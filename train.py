"""
train.py — Training script for the Dual-Branch Osteoporosis Detection Model.

Usage:
    python train.py --data_dir ./data --epochs 40 --batch_size 16 --lr 1e-4


Features:
  - BCEWithLogitsLoss for numerically stable binary classification
  - Adam optimiser with weight decay
  - ReduceLROnPlateau scheduler
  - Early stopping based on validation accuracy
  - Per-epoch metric tracking (accuracy, precision, recall, F1, ROC-AUC)
  - Best model checkpoint saving
  - Training curve and confusion matrix plotting
"""

import os
import argparse
import time
import numpy as np
import torch
import torch.nn as nn
from torch.optim import Adam
from torch.optim.lr_scheduler import ReduceLROnPlateau
from tqdm import tqdm

from dataset import get_dataloaders
from model import build_model
from utils import (
    set_seed,
    get_device,
    compute_metrics,
    print_classification_report,
    plot_training_curves,
    plot_confusion_matrix,
)


# ─────────────────────────────────────────────
# Training One Epoch
# ─────────────────────────────────────────────
def train_one_epoch(
    model: nn.Module,
    dataloader: torch.utils.data.DataLoader,
    criterion: nn.Module,
    optimizer: torch.optim.Optimizer,
    device: torch.device,
) -> dict:
    """
    Train the model for one epoch.

    Returns:
        Dictionary with 'loss', 'accuracy', 'precision', 'recall', 'f1', 'roc_auc'.
    """
    model.train()
    running_loss = 0.0
    all_labels = []
    all_preds = []
    all_probs = []

    pbar = tqdm(dataloader, desc="  Train", leave=False)
    for images, labels in pbar:
        images = images.to(device)
        labels = labels.to(device).unsqueeze(1)  # (B,) → (B, 1)

        # Forward pass
        logits = model(images)
        loss = criterion(logits, labels)

        # Backward pass
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        # Track predictions
        probs = torch.sigmoid(logits).detach().cpu().numpy().flatten()
        preds = (probs >= 0.5).astype(int)
        true_labels = labels.detach().cpu().numpy().flatten().astype(int)

        running_loss += loss.item() * images.size(0)
        all_labels.extend(true_labels)
        all_preds.extend(preds)
        all_probs.extend(probs)

        pbar.set_postfix(loss=f"{loss.item():.4f}")

    # Compute epoch metrics
    epoch_loss = running_loss / len(dataloader.dataset)
    metrics = compute_metrics(
        np.array(all_labels),
        np.array(all_preds),
        np.array(all_probs),
    )
    metrics["loss"] = epoch_loss
    return metrics


# ─────────────────────────────────────────────
# Validation / Evaluation
# ─────────────────────────────────────────────
@torch.no_grad()
def evaluate(
    model: nn.Module,
    dataloader: torch.utils.data.DataLoader,
    criterion: nn.Module,
    device: torch.device,
    desc: str = "  Val",
) -> dict:
    """
    Evaluate the model on a validation or test set.

    Returns:
        Dictionary with 'loss', 'accuracy', 'precision', 'recall', 'f1', 'roc_auc',
        and the raw arrays 'y_true', 'y_pred', 'y_prob'.
    """
    model.eval()
    running_loss = 0.0
    all_labels = []
    all_preds = []
    all_probs = []

    pbar = tqdm(dataloader, desc=desc, leave=False)
    for images, labels in pbar:
        images = images.to(device)
        labels = labels.to(device).unsqueeze(1)

        logits = model(images)
        loss = criterion(logits, labels)

        probs = torch.sigmoid(logits).cpu().numpy().flatten()
        preds = (probs >= 0.5).astype(int)
        true_labels = labels.cpu().numpy().flatten().astype(int)

        running_loss += loss.item() * images.size(0)
        all_labels.extend(true_labels)
        all_preds.extend(preds)
        all_probs.extend(probs)

    epoch_loss = running_loss / len(dataloader.dataset)
    y_true = np.array(all_labels)
    y_pred = np.array(all_preds)
    y_prob = np.array(all_probs)

    metrics = compute_metrics(y_true, y_pred, y_prob)
    metrics["loss"] = epoch_loss
    metrics["y_true"] = y_true
    metrics["y_pred"] = y_pred
    metrics["y_prob"] = y_prob
    return metrics


# ─────────────────────────────────────────────
# Full Training Loop
# ─────────────────────────────────────────────
def train(
    data_dir: str,
    epochs: int = 40,
    batch_size: int = 16,
    lr: float = 1e-4,
    weight_decay: float = 1e-5,
    patience: int = 10,
    seed: int = 42,
    save_dir: str = "outputs",
    num_workers: int = 2,
) -> None:
    """
    Complete training pipeline.

    Args:
        data_dir: Root directory with Normal/ and Osteoporosis/ subfolders.
        epochs: Maximum number of training epochs.
        batch_size: Batch size for DataLoaders.
        lr: Initial learning rate.
        weight_decay: L2 regularisation strength.
        patience: Early stopping patience (epochs without improvement).
        seed: Random seed for reproducibility.
        save_dir: Directory to save model checkpoint and plots.
        num_workers: DataLoader worker processes.
    """
    # ── Setup ──
    set_seed(seed)
    device = get_device()
    os.makedirs(save_dir, exist_ok=True)

    # ── Data ──
    print("\n" + "=" * 55)
    print("  LOADING DATASET")
    print("=" * 55)
    train_loader, val_loader, test_loader = get_dataloaders(
        data_dir=data_dir,
        batch_size=batch_size,
        seed=seed,
        num_workers=num_workers,
    )

    # ── Model ──
    print("\n" + "=" * 55)
    print("  BUILDING MODEL")
    print("=" * 55)
    model = build_model(pretrained=True, freeze_ratio=0.7, device=device)

    # ── Loss, Optimiser, Scheduler ──
    criterion = nn.BCEWithLogitsLoss()
    optimizer = Adam(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=lr,
        weight_decay=weight_decay,
    )
    scheduler = ReduceLROnPlateau(
        optimizer,
        mode="max",          # Maximise validation accuracy
        patience=5,
        factor=0.5,
    )

    # ── Training History ──
    history = {
        "train_loss": [],
        "val_loss": [],
        "train_acc": [],
        "val_acc": [],
    }

    best_val_acc = 0.0
    epochs_no_improve = 0
    best_model_path = os.path.join(save_dir, "best_model.pth")

    # ── Training Loop ──
    print("\n" + "=" * 55)
    print("  TRAINING STARTED")
    print("=" * 55)
    start_time = time.time()

    for epoch in range(1, epochs + 1):
        print(f"\nEpoch [{epoch}/{epochs}]")
        print("-" * 40)

        # Train
        train_metrics = train_one_epoch(model, train_loader, criterion, optimizer, device)

        # Validate
        val_metrics = evaluate(model, val_loader, criterion, device, desc="  Val")

        # Update scheduler
        scheduler.step(val_metrics["accuracy"])

        # Record history
        history["train_loss"].append(train_metrics["loss"])
        history["val_loss"].append(val_metrics["loss"])
        history["train_acc"].append(train_metrics["accuracy"])
        history["val_acc"].append(val_metrics["accuracy"])

        # Print epoch summary
        current_lr = optimizer.param_groups[0]["lr"]
        print(f"  Train — Loss: {train_metrics['loss']:.4f} | "
              f"Acc: {train_metrics['accuracy']:.4f} | "
              f"F1: {train_metrics['f1']:.4f} | "
              f"AUC: {train_metrics['roc_auc']:.4f}")
        print(f"  Val   — Loss: {val_metrics['loss']:.4f} | "
              f"Acc: {val_metrics['accuracy']:.4f} | "
              f"F1: {val_metrics['f1']:.4f} | "
              f"AUC: {val_metrics['roc_auc']:.4f}")
        print(f"  LR: {current_lr:.2e}")

        # Save best model
        if val_metrics["accuracy"] > best_val_acc:
            best_val_acc = val_metrics["accuracy"]
            epochs_no_improve = 0
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "val_accuracy": best_val_acc,
                "val_f1": val_metrics["f1"],
                "val_roc_auc": val_metrics["roc_auc"],
            }, best_model_path)
            print(f"  [BEST] Model saved (Val Acc: {best_val_acc:.4f})")
        else:
            epochs_no_improve += 1
            print(f"  [--] No improvement for {epochs_no_improve}/{patience} epochs")

        # Early stopping
        if epochs_no_improve >= patience:
            print(f"\n[INFO] Early stopping triggered after {epoch} epochs.")
            break

    elapsed = time.time() - start_time
    print(f"\n[INFO] Training completed in {elapsed / 60:.1f} minutes.")
    print(f"[INFO] Best validation accuracy: {best_val_acc:.4f}")

    # ── Plot Training Curves ──
    plot_training_curves(history, save_dir=save_dir)

    # ── Test Set Evaluation ──
    print("\n" + "=" * 55)
    print("  TEST SET EVALUATION")
    print("=" * 55)

    # Load best model
    checkpoint = torch.load(best_model_path, map_location=device, weights_only=True)
    model.load_state_dict(checkpoint["model_state_dict"])
    print(f"[INFO] Loaded best model from epoch {checkpoint['epoch']}")

    test_metrics = evaluate(model, test_loader, criterion, device, desc="  Test")

    print(f"\n  Test Results:")
    print(f"    Accuracy:  {test_metrics['accuracy']:.4f}")
    print(f"    Precision: {test_metrics['precision']:.4f}")
    print(f"    Recall:    {test_metrics['recall']:.4f}")
    print(f"    F1-Score:  {test_metrics['f1']:.4f}")
    print(f"    ROC-AUC:   {test_metrics['roc_auc']:.4f}")

    # Classification report
    print_classification_report(test_metrics["y_true"], test_metrics["y_pred"])

    # Confusion matrix
    plot_confusion_matrix(test_metrics["y_true"], test_metrics["y_pred"], save_dir=save_dir)

    print("\n[INFO] All outputs saved to:", save_dir)
    print("[INFO] Done! [SUCCESS]")


# ─────────────────────────────────────────────
# Entry Point
# ─────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Train the Dual-Branch Osteoporosis Detection Model"
    )
    parser.add_argument(
        "--data_dir", type=str, default="./dataset",
        help="Path to dataset root containing Normal/ and Osteoporosis/ folders",
    )
    parser.add_argument("--epochs", type=int, default=40, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=16, help="Batch size")
    parser.add_argument("--lr", type=float, default=1e-4, help="Initial learning rate")
    parser.add_argument("--weight_decay", type=float, default=1e-5, help="Weight decay (L2)")
    parser.add_argument("--patience", type=int, default=10, help="Early stopping patience")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    parser.add_argument("--save_dir", type=str, default="./outputs", help="Output directory")
    parser.add_argument("--num_workers", type=int, default=2, help="DataLoader workers")

    args = parser.parse_args()

    train(
        data_dir=args.data_dir,
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr,
        weight_decay=args.weight_decay,
        patience=args.patience,
        seed=args.seed,
        save_dir=args.save_dir,
        num_workers=args.num_workers,
    )
