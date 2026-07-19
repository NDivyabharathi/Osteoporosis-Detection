# Generalizable Deep Learning Framework for Osteoporosis Detection from Multi-Center X-ray Datasets with External Validation

---

## 1. 📌 Title of the Project

**Generalizable Deep Learning Framework for Osteoporosis Detection from Multi-Center X-ray Datasets with External Validation**

> *A hybrid CNN–Transformer architecture for automated, clinically deployable osteoporosis screening from lumbar spine X-ray images.*

---

## 2. ❗ Problem Statement & Objectives

### Problem Statement

Osteoporosis is a systemic skeletal disease marked by decreased bone mineral density (BMD), leading to an increased risk of fractures — particularly in the spine, hip, and wrist. It is commonly referred to as a "silent disease" because bone loss progresses without symptoms until a fracture occurs.

The gold standard diagnostic method, **Dual-energy X-ray Absorptiometry (DXA)**, is expensive, not universally accessible, and requires specialized equipment. Conventional X-rays, though widely available, are underutilized for osteoporosis screening because manual interpretation by radiologists is inconsistent, time-consuming, and highly subjective.

Existing AI-based osteoporosis detection models are typically:
- Trained on **single-center datasets**, limiting generalizability.
- **Not externally validated** on images from different hospitals or imaging devices.
- Unable to handle **diverse imaging conditions**, patient demographics, and equipment variations.

This results in models that perform well in controlled research settings but fail to generalize in real-world clinical environments.

### Objectives

1. Develop a robust deep learning model for binary classification of lumbar spine X-ray images (Normal vs. Osteoporosis).
2. Design a **dual-branch hybrid architecture** combining local texture (CNN) and global structural (ViT) features for superior discriminative power.
3. Apply **CLAHE-based contrast enhancement** and **Gaussian denoising** as a standardized preprocessing pipeline to handle multi-center imaging variability.
4. Achieve high performance metrics: **Accuracy ≥ 90%, F1 ≥ 0.88, ROC-AUC ≥ 0.92**.
5. Build a full-stack, clinically deployable diagnostic system with a real-time web interface for radiologists and clinicians.
6. Perform stratified train/val/test splits (70/15/15) to rigorously evaluate generalization capability.
.

---

## 4. 🔍 Research Gap Identified

| Limitation in Existing Literature | This Project's Solution |
|-------------------------------------|--------------------------|
| Single-center training datasets | Multi-center dataset collection with stratified splits |
| No external validation | Cross-dataset external evaluation planned |
| CNN-only or ViT-only architectures | **Dual-Branch MobileNetV4 + ViT-Small hybrid** |
| Raw X-ray input without preprocessing | **CLAHE + Gaussian Denoising** preprocessing pipeline |
| No deployable clinical interface | **FastAPI + React dashboard + Gradio UI** fully deployed |
| No transparency in model decisions | Grad-CAM explainability *(planned)* |
| Poor handling of imaging device variability | Contrast normalization to standardize multi-center inputs |

---

## 5. 🏗️ Architecture Diagram

### Overall System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     CLINICAL INPUT LAYER                     │
│                  Lumbar Spine X-Ray (DICOM/PNG/JPG)          │
└───────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────┐
│                    PREPROCESSING PIPELINE                    │
│    BGR → LAB → CLAHE (L-Channel) → Gaussian Denoise → RGB   │
└───────────────────────────────┬──────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                ▼                               ▼
┌─────────────────────────┐       ┌─────────────────────────┐
│    BRANCH 1: MobileNetV4│       │    BRANCH 2: ViT-Small  │
│   (Local Texture CNN)   │       │  (Global Context ViT)   │
│                         │       │                         │
│  • Trabecular density   │       │  • Vertebral alignment  │
│  • Cortical bone detail │       │  • Disc space analysis  │
│  • Micro-architecture   │       │  • Macro-structure      │
│                         │       │                         │
│   Output: 1280-dim      │       │   Output: 384-dim       │
└────────────┬────────────┘       └────────────┬────────────┘
             │                                 │
             └───────────────┬─────────────────┘
                             ▼
             ┌───────────────────────────────┐
             │    FEATURE FUSION HEAD        │
             │  Concat (1664-dim) → Dropout  │
             │  → FC(512) → ReLU → Dropout   │
             │  → FC(1) → Raw Logit          │
             └───────────────┬───────────────┘
                             │
                             ▼
             ┌───────────────────────────────┐
             │   SIGMOID ACTIVATION          │
             │  P(Osteoporosis) ∈ [0.0, 1.0] │
             │  Threshold: 0.5               │
             └───────────────┬───────────────┘
                             │
             ┌───────────────┴───────────────┐
             ▼                               ▼
    ┌────────────────┐             ┌─────────────────┐
    │  NORMAL (0)    │             │ OSTEOPOROSIS (1) │
    └────────────────┘             └─────────────────┘
```

### Deployment Architecture

```
┌─────────────────┐     HTTP POST       ┌──────────────────────┐
│  React Frontend │ ─────────────────▶  │   FastAPI (Port 8000) │
│  (Port 5173)    │ ◀─────────────────  │   /api/predict        │
└─────────────────┘   JSON + base64     │   /api/health         │
                                        └──────────┬───────────┘
                                                   │
                                                   ▼
                                        ┌──────────────────────┐
                                        │  DualBranchOsteoModel │
                                        │  (best_model.pth)     │
                                        └──────────────────────┘
```

### Preprocessing Detail

```
Input X-Ray
    │
    ├─ cv2.imread()          → BGR Numpy Array
    ├─ cv2.cvtColor(BGR→LAB) → Separate L, A, B channels
    ├─ CLAHE on L-channel    → Enhanced contrast (clipLimit=2.0, tileGrid=8×8)
    ├─ cv2.merge(L, A, B)    → Recombine channels
    ├─ cv2.cvtColor(LAB→BGR) → Restored BGR
    ├─ GaussianBlur(5×5)     → Noise reduction
    └─ cvtColor(BGR→RGB)     → PIL Image → ToTensor → Normalize (ImageNet stats)
```

---

## 6. 💡 Proposed Work with Planned Innovation

### Proposed Methodology

1. **Dataset Curation**: Collect lumbar spine X-ray images from publicly available sources (Kaggle Osteoporosis dataset, Lumbar Spine Osteoporosis dataset). Organize into `dataset/normal/` and `dataset/osteoporosis/` sub-directories.

2. **Preprocessing Module**: Implement CLAHE + Gaussian denoising as a standardized, reproducible pipeline to eliminate inter-device imaging variability (see `dataset.py`).

3. **Dual-Branch Model Design**:
   - **MobileNetV4** backbone (pretrained on ImageNet-1K) freezes 70% of early parameters and fine-tunes the latter 30% for bone-specific feature extraction.
   - **ViT-Small** backbone (pretrained on ImageNet-21K, fine-tuned on ImageNet-1K) applies self-attention across 16×16 image patches to capture vertebral body relationships.
   - A **fusion head** concatenates both embeddings and applies progressive dimensionality reduction with dropout regularization.

4. **Training Strategy**:
   - Loss: `BCEWithLogitsLoss` (numerically stable)
   - Optimizer: `Adam` with `weight_decay=1e-4`
   - Scheduler: `ReduceLROnPlateau` (patience=5)
   - Early stopping: Based on validation accuracy (patience=10)

5. **Evaluation & Explainability**:
   - Per-epoch metrics: Accuracy, Precision, Recall, F1-score, ROC-AUC
   - Confusion matrix visualization
   - *(Planned)* Grad-CAM heat-map overlays for clinical interpretability

### Planned Innovations

| Innovation | Description |
|------------|-------------|
| 🔬 **Dual-Branch Hybrid Fusion** | Novel combination of MobileNetV4 and ViT-Small for complementary feature extraction in a single forward pass |
| 🎨 **CLAHE Preprocessing** | Standardized preprocessing across multi-center datasets to normalize imaging conditions |
| 🌐 **Full-Stack Clinical Deployment** | End-to-end pipeline from raw X-ray to clinical dashboard with real-time API and visual confidence scores |
| 📊 **Multi-Metric Evaluation** | Comprehensive evaluation beyond accuracy alone — Precision, Recall, F1, ROC-AUC reported per epoch |
| 🔭 **Grad-CAM Interpretability** *(planned)* | Saliency maps overlaid on X-rays to highlight clinically significant bone regions used in prediction |

---

## 7. 🧩 Modules of the Project

The project is organized into 7 interdependent modules:

### Module 1 — Data Preprocessing (`dataset.py`)
- CLAHE contrast enhancement
- Gaussian denoising
- Torchvision transforms (resize to 224×224, augmentation, normalization)
- `OsteoporosisDataset` PyTorch Dataset class
- Stratified 70/15/15 train/val/test splitting

### Module 2 — Deep Learning Model (`model.py`)
- `MobileNetV4Branch`: CNN-based local feature extractor (pretrained, partial freeze)
- `ViTBranch`: Transformer-based global feature extractor (pretrained, partial freeze)
- `DualBranchOsteoModel`: Fusion head combining both branches into a single binary classifier

### Module 3 — Training Pipeline (`train.py`)
- Full epoch loop with forward/backward pass
- Validation and test evaluation loop
- Metric computation and logging per epoch
- Early stopping and best-checkpoint saving
- Training curve and confusion matrix plots

### Module 4 — Inference Engine (`inference.py`)
- Command-line single-image inference utility
- Accepts `--image_path` and `--model_path` arguments
- Returns: predicted class, confidence score, raw sigmoid probability

### Module 5 — FastAPI Backend (`api.py`)
- `POST /api/predict`: Receives uploaded image, returns prediction JSON with base64 preprocessed image
- `GET /api/health`: Reports server and model readiness status
- CORS-enabled for React development server integration

### Module 6 — React + Vite Frontend (`frontend/`)
| Component | Role |
|-----------|------|
| `LandingPage.jsx` | Hero section, pipeline overview, call-to-action |
| `PatientPage.jsx` | Patient details, medical history questionnaire |
| `AnalyzePage.jsx` | Drag-and-drop X-ray upload + live result display |
| `UploadCard.jsx` | File selection, preview, and analyze button |
| `ResultsCard.jsx` | Confidence bars, diagnosis badge, clinical notes |
| `Header.jsx` | Navigation bar with live API online/offline indicator |
| `PatientForm.jsx` | Comprehensive patient profiling input form |
| `Suggestions.jsx` | Medically informed recommendation cards |

### Module 7 — Gradio Playground (`app.py`)
- Drag-and-drop image upload widget
- Displays prediction label and confidence scores
- Shows CLAHE-preprocessed image preview side-by-side with original
- Runs on `http://localhost:7860`

---

## 8. 🚧 Implementation with Intermediate Result (30% Completion)

### ✅ Completed Milestones

| Task | Status |
|------|--------|
| Project planning and architecture design | ✅ Done |
| Literature survey and research gap analysis | ✅ Done |
| Dataset directory structure set up (`dataset/normal`, `dataset/osteoporosis`) | ✅ Done |
| CLAHE + Gaussian denoising preprocessing pipeline | ✅ Done |
| `OsteoporosisDataset` class with stratified split | ✅ Done |
| MobileNetV4 branch implementation with partial freeze | ✅ Done |
| ViT-Small branch implementation with partial freeze | ✅ Done |
| Dual-Branch fusion head and full model graph | ✅ Done |
| Training loop with early stopping and checkpointing | ✅ Done |
| Per-epoch metrics: Accuracy, Precision, Recall, F1, ROC-AUC | ✅ Done |
| Training curves and confusion matrix plot generation | ✅ Done |
| CLI inference script (`inference.py`) | ✅ Done |
| FastAPI backend with `/api/predict` and `/api/health` | ✅ Done |
| React + Vite frontend with patient form and analyze page | ✅ Done |
| Gradio web playground (`app.py`) | ✅ Done |
| Best model checkpoint saved (`outputs/best_model.pth`) | ✅ Done |
| Training convergence plots (`training_curves.png`) | ✅ Done |
| Confusion matrix on test set (`confusion_matrix.png`) | ✅ Done |

### 🟡 In Progress / Planned

| Task | Status |
|------|--------|
| Grad-CAM saliency map integration | 🟡 Planned |
| Multi-center external validation | 🟡 Planned |
| Patient history persistence (MongoDB backend) | 🟡 Planned |
| Model fine-tuning on additional datasets | 🟡 Planned |
| Docker containerization for deployment | 🟡 Planned |

### 📊 Intermediate Training Results

The model has been trained and the best checkpoint is saved in `outputs/best_model.pth`.

**Key Outputs:**
- `outputs/training_curves.png` — Loss and accuracy convergence per epoch
- `outputs/confusion_matrix.png` — Test-set evaluation with TP, FP, TN, FN breakdown

**Evaluation Metrics (from saved checkpoint):**

| Metric | Value (Intermediate) |
|--------|----------------------|
| Validation Accuracy | Tracked per epoch |
| Best Model Epoch | Saved at peak val accuracy |
| Loss Function | BCEWithLogitsLoss |
| Optimizer | Adam (lr=1e-4, wd=1e-4) |

---

## 9. 📄 Git Documentation & Paper Draft

### Abstract

Osteoporosis is a prevalent skeletal disease associated with high fracture risk and significant morbidity. While Dual-energy X-ray Absorptiometry (DXA) remains the clinical gold standard for diagnosis, its limited accessibility necessitates alternative, cost-effective screening approaches. This paper proposes a **generalizable dual-branch deep learning framework** that combines **MobileNetV4** and **Vision Transformer (ViT-Small)** to classify lumbar spine X-rays as normal or osteoporotic.

A standardized preprocessing pipeline incorporating **Contrast Limited Adaptive Histogram Equalization (CLAHE)** and **Gaussian denoising** is applied to reduce inter-center imaging variability. The fused feature representations from both branches are passed through a regularized fusion head for binary classification. The framework is evaluated on a stratified dataset with comprehensive metrics including accuracy, precision, recall, F1-score, and ROC-AUC. A full-stack clinical deployment system comprising a **FastAPI inference server** and **React web dashboard** enables real-time clinical screening.

### Introduction

The World Health Organization estimates that osteoporosis affects over 200 million people worldwide, with 1 in 3 women and 1 in 5 men over 50 experiencing osteoporotic fractures. Early and accurate detection is essential to initiate timely medical intervention, yet the disease is widely underdiagnosed due to the high cost and limited availability of DXA scanners, particularly in low- and middle-income countries.

Conventional lumbar spine X-rays are routinely captured in clinical settings as part of standard orthopedic assessment. However, manual assessment for osteoporosis signs — such as vertebral body trabecular rarefaction, cortical thinning, and reduced bone density — is subjective, time-consuming, and dependent on radiologist expertise. Deep learning approaches offer the potential to automate this process with standardized, reproducible diagnostic accuracy.

Recent works have demonstrated the effectiveness of convolutional neural networks (CNNs) for medical image classification tasks. However, CNNs are inherently limited in modeling long-range spatial dependencies across the full vertebral column. Vision Transformers (ViTs), with their self-attention mechanisms, address this limitation but require substantially larger datasets for training from scratch. **Hybrid architectures** combining the complementary strengths of both paradigms present a promising direction for robust osteoporosis detection.

In this work, we present a dual-branch architecture that processes each X-ray through two parallel encoders — a lightweight MobileNetV4 for local bone texture analysis and a ViT-Small for global structural context — and fuses their representations for final classification. We additionally propose a preprocessing standardization pipeline based on CLAHE to enable generalizability across imaging devices and institutions. The system is made clinically accessible through a full-stack web application with real-time inference capabilities.

### Git Repository

> 📦 **GitHub**: [NDivyabharathi/Osteoporosis-Detection](https://github.com/NDivyabharathi/Osteoporosis-Detection)

**Repository Structure Summary:**
- `model.py` — Dual-branch model definition
- `dataset.py` — Preprocessing and dataset management
- `train.py` — Complete training pipeline
- `api.py` — FastAPI REST backend
- `app.py` — Gradio research interface
- `frontend/` — React + Vite clinical dashboard
- `outputs/` — Trained checkpoints and evaluation plots
- `requirements.txt` — Python dependencies

**Commit Conventions Used:**
```
feat:   New feature implementation
fix:    Bug fixes and corrections
model:  Changes to model architecture
data:   Preprocessing pipeline updates
api:    Backend API changes
ui:     Frontend and UI changes
docs:   Documentation updates
```

---

*© 2024 NDivyabharathi — Osteoporosis Detection Research Project*
