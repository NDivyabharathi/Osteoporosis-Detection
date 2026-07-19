"""
utils.py — Utility functions for the Osteoporosis Detection Pipeline.

Provides:
  - Reproducibility seeding
  - Device auto-detection
  - Metric computation (Accuracy, Precision, Recall, F1, ROC-AUC)
  - Training curve plotting
  - Confusion matrix visualization
"""

import os
import random
import numpy as np
import torch
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report,
)


# ─────────────────────────────────────────────
# Reproducibility
# ─────────────────────────────────────────────
def set_seed(seed: int = 42) -> None:
    """Set random seeds for reproducibility across all libraries."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False
    print(f"[INFO] Random seed set to {seed}")


# ─────────────────────────────────────────────
# Device Detection
# ─────────────────────────────────────────────
def get_device() -> torch.device:
    """Auto-detect the best available device (CUDA > MPS > CPU)."""
    if torch.cuda.is_available():
        device = torch.device("cuda")
        print(f"[INFO] Using CUDA: {torch.cuda.get_device_name(0)}")
    elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        device = torch.device("mps")
        print("[INFO] Using Apple MPS")
    else:
        device = torch.device("cpu")
        print("[INFO] Using CPU")
    return device


# ─────────────────────────────────────────────
# Metric Computation
# ─────────────────────────────────────────────
def compute_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_prob: np.ndarray,
) -> dict:
    """
    Compute classification metrics for binary osteoporosis detection.

    Args:
        y_true: Ground-truth binary labels (0 = Normal, 1 = Osteoporosis).
        y_pred: Predicted binary labels (thresholded at 0.5).
        y_prob: Predicted probabilities (sigmoid outputs).

    Returns:
        Dictionary with accuracy, precision, recall, f1, and roc_auc.
    """
    metrics = {
        "accuracy": accuracy_score(y_true, y_pred),
        "precision": precision_score(y_true, y_pred, zero_division=0),
        "recall": recall_score(y_true, y_pred, zero_division=0),
        "f1": f1_score(y_true, y_pred, zero_division=0),
    }

    # ROC-AUC requires at least two classes present in y_true
    try:
        metrics["roc_auc"] = roc_auc_score(y_true, y_prob)
    except ValueError:
        metrics["roc_auc"] = 0.0

    return metrics


def print_classification_report(y_true: np.ndarray, y_pred: np.ndarray) -> None:
    """Print a detailed sklearn classification report."""
    target_names = ["Normal", "Osteoporosis"]
    report = classification_report(y_true, y_pred, target_names=target_names)
    print("\n" + "=" * 55)
    print("              CLASSIFICATION REPORT")
    print("=" * 55)
    print(report)


# ─────────────────────────────────────────────
# Training Curve Plotting
# ─────────────────────────────────────────────
def plot_training_curves(history: dict, save_dir: str = ".") -> None:
    """
    Plot and save training/validation loss and accuracy curves.

    Args:
        history: Dictionary with keys 'train_loss', 'val_loss',
                 'train_acc', 'val_acc' — each a list of per-epoch values.
        save_dir: Directory to save the plot PNGs.
    """
    os.makedirs(save_dir, exist_ok=True)
    epochs = range(1, len(history["train_loss"]) + 1)

    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    # ── Loss Curve ──
    axes[0].plot(epochs, history["train_loss"], "b-o", label="Train Loss", markersize=4)
    axes[0].plot(epochs, history["val_loss"], "r-o", label="Val Loss", markersize=4)
    axes[0].set_title("Training & Validation Loss", fontsize=14, fontweight="bold")
    axes[0].set_xlabel("Epoch")
    axes[0].set_ylabel("Loss")
    axes[0].legend()
    axes[0].grid(True, alpha=0.3)

    # ── Accuracy Curve ──
    axes[1].plot(epochs, history["train_acc"], "b-o", label="Train Accuracy", markersize=4)
    axes[1].plot(epochs, history["val_acc"], "r-o", label="Val Accuracy", markersize=4)
    axes[1].set_title("Training & Validation Accuracy", fontsize=14, fontweight="bold")
    axes[1].set_xlabel("Epoch")
    axes[1].set_ylabel("Accuracy")
    axes[1].legend()
    axes[1].grid(True, alpha=0.3)

    plt.tight_layout()
    save_path = os.path.join(save_dir, "training_curves.png")
    plt.savefig(save_path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"[INFO] Training curves saved to {save_path}")


# ─────────────────────────────────────────────
# Confusion Matrix Visualization
# ─────────────────────────────────────────────
def plot_confusion_matrix(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    save_dir: str = ".",
) -> None:
    """
    Plot and save a confusion matrix heatmap.

    Args:
        y_true: Ground-truth labels.
        y_pred: Predicted labels.
        save_dir: Directory to save the plot PNG.
    """
    os.makedirs(save_dir, exist_ok=True)
    cm = confusion_matrix(y_true, y_pred)
    labels = ["Normal", "Osteoporosis"]

    fig, ax = plt.subplots(figsize=(7, 6))
    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=labels,
        yticklabels=labels,
        annot_kws={"size": 16},
        linewidths=0.5,
        ax=ax,
    )
    ax.set_title("Confusion Matrix", fontsize=16, fontweight="bold")
    ax.set_xlabel("Predicted Label", fontsize=13)
    ax.set_ylabel("True Label", fontsize=13)

    plt.tight_layout()
    save_path = os.path.join(save_dir, "confusion_matrix.png")
    plt.savefig(save_path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"[INFO] Confusion matrix saved to {save_path}")
