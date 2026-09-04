"""
app.py — Gradio Web Interface for Osteoporosis Detection.

Provides a drag-and-drop web UI where users can upload lumbar spine
X-ray images and receive real-time predictions (Normal / Osteoporosis)
with confidence scores and preprocessed image previews.

Usage:
    python app.py


The app will launch on http://localhost:7860
"""

import os
import numpy as np
import torch
import gradio as gr
from PIL import Image

from dataset import preprocess_image, get_eval_transforms
from model import DualBranchOsteoModel
from utils import get_device


# ─────────────────────────────────────────────
# Global Model Loading
# ─────────────────────────────────────────────
MODEL_PATH = os.path.join("outputs", "best_model.pth")
DEVICE = get_device()
MODEL = None  # Lazy-loaded on first prediction


def load_model():
    """Load the trained model from checkpoint."""
    global MODEL
    if MODEL is not None:
        return MODEL

    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Model not found at {MODEL_PATH}. "
            "Please train the model first using: python train.py"
        )

    print(f"[INFO] Loading model from: {MODEL_PATH}")
    MODEL = DualBranchOsteoModel(pretrained=False)

    checkpoint = torch.load(MODEL_PATH, map_location=DEVICE, weights_only=True)
    MODEL.load_state_dict(checkpoint["model_state_dict"])
    MODEL = MODEL.to(DEVICE)
    MODEL.eval()

    epoch = checkpoint.get("epoch", "?")
    val_acc = checkpoint.get("val_accuracy", "N/A")
    print(f"[INFO] Model loaded (epoch {epoch}, val acc: {val_acc})")
    return MODEL


# ─────────────────────────────────────────────
# Prediction Function
# ─────────────────────────────────────────────
def predict(image_path: str):
    """
    Run inference on an uploaded X-ray image.

    Args:
        image_path: Path to the uploaded image file.

    Returns:
        Tuple of (label_dict, preprocessed_image):
          - label_dict: Gradio label format {class_name: confidence}
          - preprocessed_image: PIL Image after CLAHE + denoising
    """
    if image_path is None:
        return None, None

    try:
        model = load_model()
    except FileNotFoundError as e:
        return {str(e): 1.0}, None

    # Preprocess: CLAHE + Gaussian denoise
    preprocessed_pil = preprocess_image(image_path)

    # Transform for model input
    transform = get_eval_transforms(image_size=224)
    tensor_image = transform(preprocessed_pil).unsqueeze(0).to(DEVICE)

    # Forward pass
    with torch.no_grad():
        logit = model(tensor_image)
        probability = torch.sigmoid(logit).item()

    # Build result
    osteo_conf = probability
    normal_conf = 1.0 - probability

    label_dict = {
        "Osteoporosis": float(osteo_conf),
        "Normal": float(normal_conf),
    }

    return label_dict, preprocessed_pil


# ─────────────────────────────────────────────
# Gradio Interface
# ─────────────────────────────────────────────
def create_interface():
    """Build and return the Gradio Blocks interface."""

    # Custom CSS for a medical-themed look
    custom_css = """
    .gradio-container {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    .main-title {
        text-align: center;
        color: #1a5276;
        font-size: 2em;
        font-weight: bold;
        margin-bottom: 5px;
    }
    .sub-title {
        text-align: center;
        color: #5d6d7e;
        font-size: 1.1em;
        margin-bottom: 20px;
    }
    .info-box {
        background: linear-gradient(135deg, #ebf5fb, #d4efdf);
        border-radius: 10px;
        padding: 15px;
        margin: 10px 0;
        border-left: 4px solid #2980b9;
    }
    .footer {
        text-align: center;
        color: #95a5a6;
        font-size: 0.85em;
        margin-top: 20px;
    }
    """

    with gr.Blocks(css=custom_css, title="Osteoporosis Detection System") as demo:

        # ── Header ──
        gr.HTML("""
            <div class="main-title">Osteoporosis Detection System</div>
            <div class="sub-title">
                Dual-Branch Deep Learning (MobileNetV4 + ViT) for Lumbar Spine X-ray Analysis
            </div>
        """)

        with gr.Row():
            # ── Left Column: Input ──
            with gr.Column(scale=1):
                gr.Markdown("### Upload X-ray Image")
                input_image = gr.Image(
                    type="filepath",
                    label="Lumbar Spine X-ray",
                    height=350,
                )
                predict_btn = gr.Button(
                    "Analyze X-ray",
                    variant="primary",
                    size="lg",
                )

                gr.HTML("""
                    <div class="info-box">
                        <strong>How it works:</strong><br>
                        1. Upload a lumbar spine X-ray image<br>
                        2. The image is enhanced with CLAHE contrast and denoised<br>
                        3. MobileNetV4 extracts bone texture features<br>
                        4. Vision Transformer extracts structural patterns<br>
                        5. Combined analysis produces the prediction
                    </div>
                """)

            # ── Right Column: Output ──
            with gr.Column(scale=1):
                gr.Markdown("### Prediction Result")
                output_label = gr.Label(
                    label="Classification",
                    num_top_classes=2,
                )

                gr.Markdown("### Preprocessed Image")
                output_image = gr.Image(
                    type="pil",
                    label="After CLAHE + Denoising",
                    height=300,
                )

        # ── Connect button to prediction function ──
        predict_btn.click(
            fn=predict,
            inputs=[input_image],
            outputs=[output_label, output_image],
        )

        # Also predict on image upload
        input_image.change(
            fn=predict,
            inputs=[input_image],
            outputs=[output_label, output_image],
        )

        # ── Footer ──
        gr.HTML("""
            <div class="footer">
                Dual-Branch Architecture: MobileNetV4 (local texture) + ViT (global structure)<br>
                For research and educational purposes only. Not a medical diagnostic tool.
            </div>
        """)

    return demo


# ─────────────────────────────────────────────
# Entry Point
# ─────────────────────────────────────────────
if __name__ == "__main__":
    demo = create_interface()
    demo.launch(
        server_name="0.0.0.0",
        server_port=7860,
        share=False,
        show_error=True,
    )
