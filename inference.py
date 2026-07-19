"""
inference.py — Single-image inference for the Dual-Branch Osteoporosis Detection Model.

Usage:
    python inference.py --image_path ./test_image.jpg --model_path ./outputs/best_model.pth

Loads the saved best model checkpoint, preprocesses the input image
(CLAHE + Gaussian denoising + resize + normalize), runs a forward pass,
and prints the predicted class with confidence score.
"""

import argparse
import torch

from dataset import preprocess_image, get_eval_transforms
from model import DualBranchOsteoModel
from utils import get_device


# ─────────────────────────────────────────────
# Inference Function
# ─────────────────────────────────────────────
def predict_single_image(
    image_path: str,
    model_path: str,
    device: torch.device = None,
) -> dict:
    """
    Run inference on a single image.

    Args:
        image_path: Path to the input X-ray image.
        model_path: Path to the saved model checkpoint (.pth).
        device: Target device (auto-detected if None).

    Returns:
        Dictionary with:
            - 'class': Predicted class name ('Normal' or 'Osteoporosis')
            - 'label': Predicted label (0 or 1)
            - 'confidence': Prediction confidence (0.0 – 1.0)
            - 'probability': Raw sigmoid probability
    """
    if device is None:
        device = get_device()

    # ── Step 1: Load the model ──
    print(f"[INFO] Loading model from: {model_path}")
    model = DualBranchOsteoModel(pretrained=False)  # No need to download weights again

    checkpoint = torch.load(model_path, map_location=device, weights_only=True)
    model.load_state_dict(checkpoint["model_state_dict"])
    model = model.to(device)
    model.eval()

    print(f"[INFO] Model loaded (trained at epoch {checkpoint.get('epoch', '?')})")
    print(f"       Val Accuracy: {checkpoint.get('val_accuracy', 'N/A')}")

    # ── Step 2: Preprocess the image ──
    print(f"[INFO] Processing image: {image_path}")
    pil_image = preprocess_image(image_path)  # CLAHE + Gaussian denoise → PIL

    transform = get_eval_transforms(image_size=224)
    tensor_image = transform(pil_image).unsqueeze(0)  # Add batch dimension → (1, 3, 224, 224)
    tensor_image = tensor_image.to(device)

    # ── Step 3: Forward pass ──
    with torch.no_grad():
        logit = model(tensor_image)          # (1, 1)
        probability = torch.sigmoid(logit).item()

    # ── Step 4: Determine prediction ──
    predicted_label = 1 if probability >= 0.5 else 0
    class_name = "Osteoporosis" if predicted_label == 1 else "Normal"
    confidence = probability if predicted_label == 1 else (1.0 - probability)

    result = {
        "class": class_name,
        "label": predicted_label,
        "confidence": confidence,
        "probability": probability,
    }

    return result


# ─────────────────────────────────────────────
# Entry Point
# ─────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Run inference on a single X-ray image"
    )
    parser.add_argument(
        "--image_path", type=str, required=True,
        help="Path to the input X-ray image",
    )
    parser.add_argument(
        "--model_path", type=str, default="./outputs/best_model.pth",
        help="Path to the saved best model checkpoint",
    )

    args = parser.parse_args()

    # Run prediction
    result = predict_single_image(args.image_path, args.model_path)

    # Display result
    print("\n" + "=" * 45)
    print("         PREDICTION RESULT")
    print("=" * 45)
    print(f"  Image:       {args.image_path}")
    print(f"  Prediction:  {result['class']}")
    print(f"  Confidence:  {result['confidence']:.2%}")
    print(f"  Probability: {result['probability']:.4f}")
    print("=" * 45)
