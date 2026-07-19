"""
api.py — FastAPI Backend for Osteoporosis Detection.

Provides a REST API endpoint for X-ray image classification.

Endpoints:
  POST /api/predict   — Upload an X-ray image, returns prediction
  GET  /api/health    — Health check

Usage:
    uvicorn api:app --host 0.0.0.0 --port 8000 --reload
"""

import os
import io
import base64
import numpy as np
import torch
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
import cv2
import tempfile

from dataset import preprocess_image, get_eval_transforms
from model import DualBranchOsteoModel
from utils import get_device


# ─────────────────────────────────────────────
# App Configuration
# ─────────────────────────────────────────────
app = FastAPI(
    title="Osteoporosis Detection API",
    description="Dual-Branch MobileNetV4 + ViT for Lumbar Spine X-ray Analysis",
    version="1.0.0",
)

# Allow React dev server (localhost:5173) to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────
# Model Loading (singleton)
# ─────────────────────────────────────────────
MODEL_PATH = os.path.join("outputs", "best_model.pth")
DEVICE = get_device()
MODEL = None


def get_model():
    """Load and cache the trained model."""
    global MODEL
    if MODEL is not None:
        return MODEL

    if not os.path.exists(MODEL_PATH):
        raise HTTPException(
            status_code=503,
            detail=f"Model not found at {MODEL_PATH}. Please train the model first.",
        )

    print(f"[INFO] Loading model from: {MODEL_PATH}")
    MODEL = DualBranchOsteoModel(pretrained=False)

    checkpoint = torch.load(MODEL_PATH, map_location=DEVICE, weights_only=True)
    MODEL.load_state_dict(checkpoint["model_state_dict"])
    MODEL = MODEL.to(DEVICE)
    MODEL.eval()

    epoch = checkpoint.get("epoch", "?")
    val_acc = checkpoint.get("val_accuracy", 0)
    print(f"[INFO] Model loaded (epoch {epoch}, val acc: {val_acc:.4f})")
    return MODEL


def pil_to_base64(pil_image: Image.Image) -> str:
    """Convert a PIL image to a base64-encoded string for the frontend."""
    buffer = io.BytesIO()
    pil_image.save(buffer, format="PNG")
    buffer.seek(0)
    return base64.b64encode(buffer.read()).decode("utf-8")


# ─────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────
@app.get("/api/health")
async def health_check():
    """Check if the API and model are ready."""
    model_ready = os.path.exists(MODEL_PATH)
    return {
        "status": "healthy",
        "model_ready": model_ready,
        "model_path": MODEL_PATH,
        "device": str(DEVICE),
    }


@app.post("/api/predict")
async def predict(file: UploadFile = File(...)):
    """
    Predict osteoporosis from an uploaded X-ray image.

    Returns:
        JSON with prediction class, confidence, probability,
        and the preprocessed image as base64.
    """
    # Validate file type
    allowed_types = {"image/jpeg", "image/png", "image/bmp", "image/tiff", "image/webp"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}. Allowed: {allowed_types}",
        )

    # Save uploaded file to a temp location
    contents = await file.read()
    suffix = os.path.splitext(file.filename)[1] if file.filename else ".jpg"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        # Load model
        model = get_model()

        # Preprocess: CLAHE + Gaussian denoise
        preprocessed_pil = preprocess_image(tmp_path)

        # Transform for model input
        transform = get_eval_transforms(image_size=224)
        tensor_image = transform(preprocessed_pil).unsqueeze(0).to(DEVICE)

        # Forward pass
        with torch.no_grad():
            logit = model(tensor_image)
            probability = torch.sigmoid(logit).item()

        # Determine prediction
        predicted_label = 1 if probability >= 0.5 else 0
        class_name = "Osteoporosis" if predicted_label == 1 else "Normal"
        confidence = probability if predicted_label == 1 else (1.0 - probability)

        # Convert preprocessed image to base64 for frontend display
        preprocessed_b64 = pil_to_base64(preprocessed_pil)

        return JSONResponse(content={
            "success": True,
            "prediction": {
                "class": class_name,
                "label": predicted_label,
                "confidence": round(confidence * 100, 2),
                "probability": round(probability * 100, 2),
                "normal_score": round((1.0 - probability) * 100, 2),
                "osteoporosis_score": round(probability * 100, 2),
            },
            "preprocessed_image": preprocessed_b64,
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        # Clean up temp file
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


# ─────────────────────────────────────────────
# Entry Point
# ─────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
