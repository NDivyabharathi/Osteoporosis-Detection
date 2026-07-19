# 🦴 Osteoporosis Detection & Diagnostic System

A state-of-the-art medical imaging and diagnostic application leveraging a hybrid **Dual-Branch Deep Learning Model** (combining CNN and Vision Transformer architectures) to detect osteoporosis from lumbar spine X-ray images. 

This system integrates a fully functional machine learning training/inference pipeline with a high-performance **FastAPI server**, an interactive **React + Vite dashboard**, and a **Gradio workspace** for clinical screening and research.

---

## 🚀 Key Features

*   **Hybrid Dual-Branch Model**: Integrates **MobileNetV4** (for local bone texture/trabecular detail extraction) and **Vision Transformer (ViT-Small)** (for global structural context and vertebral alignment).
*   **Contrast-Enhanced Preprocessing**: Pre-processes clinical X-ray inputs using **CLAHE (Contrast Limited Adaptive Histogram Equalization)** on the luminance channel (LAB color space) and **Gaussian Denoising** to standardise imaging conditions.
*   **Multi-Client Support**:
    *   **Interactive React Dashboard**: Features a modern, premium UI with patient profiling, medical questionnaire inputs, scan history tracker, and dynamic visual graphs for probability thresholds.
    *   **Gradio Web UI**: A clean drag-and-drop diagnostic dashboard optimized for fast testing and clinical demonstrations.
    *   **FastAPI REST API**: High-throughput inference server with built-in CORS, health checks, and JSON-encoded response formats containing base64 preprocessed image previews.
*   **Complete Training & Validation Suite**: Support for full training runs with early stopping, learning rate scheduling (`ReduceLROnPlateau`), metrics tracking (Accuracy, Precision, Recall, F1, ROC-AUC), and visual plot outputs (Confusion Matrix, Loss/Accuracy curves).

---

## 📂 Project Structure

```
Osteoporosis-Detection/
├── backend/                  # Scaffolded Express & Node.js user/patient database API
│   ├── middleware/           # Auth and validation middleware
│   ├── models/               # MongoDB mongoose schemas
│   ├── routes/               # Express endpoints (Auth, patients, history)
│   ├── package.json          # Node dependencies
│   └── package-lock.json
│
├── dataset/                  # Dataset directory
│   ├── normal/               # Normal lumbar spine X-ray images (Label 0)
│   └── osteoporosis/         # Osteoporosis X-ray images (Label 1)
│
├── frontend/                 # React + Vite client application
│   ├── src/
│   │   ├── components/       # Reusable UI cards, headers, footers, charts
│   │   ├── pages/            # View pages (Landing, Patient Profile, Analyze)
│   │   ├── App.jsx           # Root layout and API health check loader
│   │   ├── index.css         # Styling system & animations
│   │   └── main.jsx          # Vite entrypoint
│   ├── package.json          # Frontend dependencies & build configurations
│   └── vite.config.js        # Vite compilation configuration
│
├── outputs/                  # Saved training outputs & visualization reports
│   ├── best_model.pth        # Serialized PyTorch weights of the best checkpoint
│   ├── confusion_matrix.png  # Evaluated test-set confusion matrix
│   └── training_curves.png   # Epoch-by-epoch loss & metric charts
│
├── api.py                    # Production FastAPI backend (Port 8000)
├── app.py                    # Research Gradio web playground (Port 7860)
├── dataset.py                # PyTorch dataset loaders, CLAHE, and image transform pipelines
├── inference.py              # CLI utility for single-image predictions
├── model.py                  # PyTorch model definition (MobileNetV4 + ViT Dual-Branch)
├── train.py                  # Full model training and evaluation loop
├── utils.py                  # Supporting code for seed setting, metrics, and plotting
├── requirements.txt          # Python dependencies
└── README_DETAILED.md        # This comprehensive project guide
```

---

## 🧠 Model Architecture & Preprocessing

The system utilizes a hybrid network designed to extract complementary features from X-ray scans:

```
                  ┌───────────────────────────────┐
                  │      Lumbar Spine X-Ray       │
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │    CLAHE (LAB L-Channel)      │
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │      Gaussian Denoising       │
                  └───────────────┬───────────────┘
                                  │
         ┌────────────────────────┴────────────────────────┐
         │ (Local Features)                                │ (Global Features)
         ▼                                                 ▼
┌──────────────────┐                              ┌──────────────────┐
│   MobileNetV4    │                              │    ViT-Small     │
│  (Convolutional) │                              │  (Transformer)   │
└────────┬─────────┘                              └────────┬─────────┘
         │                                                 │
         │ (1280-dim)                                      │ (384-dim)
         └────────────────────────┬────────────────────────┘
                                  ▼
                  ┌───────────────────────────────┐
                  │    Concatenated Embeddings    │ (1664-dim)
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │    Fully Connected Layers     │ (ReLU + Dropout)
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │      Sigmoid Output Classifier │ (Probability 0 - 1)
                  └───────────────────────────────┘
```

1.  **Image Prep**: Lumbar spine scans are read via OpenCV, converted into LAB color space to isolate luminance, and equalized via CLAHE. A Gaussian filter removes high-frequency artifact noise.
2.  **Texture Encoder (MobileNetV4)**: Extracts high-frequency texture information, density patterns, and local trabecular details.
3.  **Global Encoder (ViT-Small)**: Scans patches across the entire image to model vertebral boundaries, space narrowing, and macro-structural shapes.
4.  **Feature Fusion Head**: Employs concatenated features mapped through a regularization sequence of dropout and dense projection to evaluate osteoporosis presence.

---

## ⚙️ Installation & Setup

### Prerequisites
*   Python 3.8 or higher
*   Node.js v16+ & npm

### 1. Python Environment Setup
Navigate to the root directory and create a virtual environment:
```bash
# Create environment
python -m venv venv

# Activate on Windows
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Node.js Frontend Setup
Navigate to the `frontend/` directory and install local dependencies:
```bash
cd frontend
npm install
cd ..
```

---

## ⚡ Running the Applications

### 1. Train the Deep Learning Model
To train the model on your custom dataset (make sure images are in `dataset/normal` and `dataset/osteoporosis`):
```bash
python train.py --data_dir ./dataset --epochs 40 --batch_size 16 --lr 1e-4
```
*   This will save the best model weights to `outputs/best_model.pth` and create evaluation plots in `outputs/`.

### 2. Run CLI Inference
Run quick prediction tests on a single X-ray image file:
```bash
python inference.py --image_path ./test_image.jpg --model_path ./outputs/best_model.pth
```

### 3. Launch the FastAPI backend (Inference Service)
Start the high-performance prediction API server:
```bash
uvicorn api:app --host 0.0.0.0 --port 8000 --reload
```
*   The API endpoints will be hosted at `http://localhost:8000`.
*   Swagger documentation is interactive at `http://localhost:8000/docs`.

### 4. Launch the React Web Dashboard
With the FastAPI server running on port 8000, start the development React client:
```bash
cd frontend
npm run dev
```
*   Open your browser and navigate to `http://localhost:5173`.
*   You will see the fully functional patient registration form and X-ray upload panel.

### 5. Launch the Gradio Web Playground
For a fast, self-contained ML interface to test model parameters:
```bash
python app.py
```
*   Open the console-provided link (usually `http://localhost:7860`) to load the web interface.

---

## 📊 Evaluation & Metrics

The current model checkpoints saved in `outputs/` are fully trained on preprocessed lumbar spine datasets:
*   **`best_model.pth`**: Contains optimized model weights achieving high validation accuracy.
*   **`training_curves.png`**: Plots epoch-by-epoch binary cross-entropy losses and validation accuracies to check convergence.
*   **`confusion_matrix.png`**: Illustrates true positive, false positive, true negative, and false negative clinical evaluations.

---
*Created as part of the Generalizable Deep Learning Framework for Osteoporosis Detection.*
