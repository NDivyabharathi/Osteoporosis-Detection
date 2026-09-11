"""
dataset.py — Dataset loading, preprocessing, and augmentation for Osteoporosis Detection.

Pipeline per image:
  1. Load image (BGR via OpenCV)
  2. Convert BGR → LAB colour space
  3. Apply CLAHE on the L (luminance) channel for contrast enhancement
  4. Convert back to BGR, then apply Gaussian denoising
  5. Convert BGR → RGB → PIL Image
  6. Apply torchvision transforms (resize, augment, normalize)

The dataset is split 70/15/15 into train/val/test with stratification.
"""


import os
import cv2
import numpy as np
from PIL import Image
from typing import Tuple, List, Optional

import torch
from torch.utils.data import Dataset, DataLoader, Subset
from torchvision import transforms
from sklearn.model_selection import train_test_split


# ─────────────────────────────────────────────
# CLAHE & Gaussian Denoising Preprocessing
# ─────────────────────────────────────────────
def apply_clahe(image: np.ndarray, clip_limit: float = 2.0, tile_grid: Tuple[int, int] = (8, 8)) -> np.ndarray:
    """
    Apply CLAHE (Contrast Limited Adaptive Histogram Equalisation)
    on the luminance channel of a BGR image.

    Args:
        image: Input BGR image (numpy array, uint8).
        clip_limit: CLAHE clip limit for contrast limiting.
        tile_grid: Size of the grid for histogram equalisation.

    Returns:
        Contrast-enhanced BGR image.
    """
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)

    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid)
    enhanced_l = clahe.apply(l_channel)

    merged = cv2.merge([enhanced_l, a_channel, b_channel])
    enhanced_bgr = cv2.cvtColor(merged, cv2.COLOR_LAB2BGR)
    return enhanced_bgr


def apply_gaussian_denoise(image: np.ndarray, kernel_size: Tuple[int, int] = (5, 5), sigma: float = 0) -> np.ndarray:
    """
    Apply Gaussian blur for denoising.

    Args:
        image: Input BGR image (numpy array, uint8).
        kernel_size: Size of the Gaussian kernel.
        sigma: Standard deviation (0 = auto-calculated from kernel size).

    Returns:
        Denoised BGR image.
    """
    return cv2.GaussianBlur(image, kernel_size, sigma)


def preprocess_image(image_path: str) -> Image.Image:
    """
    Full preprocessing pipeline for a single image:
      Load → CLAHE → Gaussian denoise → convert to RGB PIL Image.

    Args:
        image_path: Absolute or relative path to the image file.

    Returns:
        Preprocessed PIL Image in RGB mode.
    """
    # Read image in BGR format
    bgr_image = cv2.imread(image_path, cv2.IMREAD_COLOR)
    if bgr_image is None:
        raise FileNotFoundError(f"Could not read image: {image_path}")

    # Apply CLAHE contrast enhancement
    enhanced = apply_clahe(bgr_image)

    # Apply Gaussian denoising
    denoised = apply_gaussian_denoise(enhanced)

    # Convert BGR → RGB → PIL Image
    rgb_image = cv2.cvtColor(denoised, cv2.COLOR_BGR2RGB)
    pil_image = Image.fromarray(rgb_image)
    return pil_image


# ─────────────────────────────────────────────
# Torchvision Transforms
# ─────────────────────────────────────────────
def get_train_transforms(image_size: int = 224) -> transforms.Compose:
    """
    Training transforms with data augmentation.

    Augmentations applied:
      - Random horizontal flip (p=0.5)
      - Random rotation (±10°)
      - Random affine (small translation & scale jitter)
      - Resize to image_size × image_size
      - Normalize with ImageNet statistics
    """
    return transforms.Compose([
        transforms.Resize((image_size, image_size)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=10),
        transforms.RandomAffine(
            degrees=0,
            translate=(0.05, 0.05),
            scale=(0.95, 1.05),
        ),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],   # ImageNet mean
            std=[0.229, 0.224, 0.225],     # ImageNet std
        ),
    ])


def get_eval_transforms(image_size: int = 224) -> transforms.Compose:
    """
    Validation / test transforms — no augmentation, only resize & normalise.
    """
    return transforms.Compose([
        transforms.Resize((image_size, image_size)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225],
        ),
    ])


# ─────────────────────────────────────────────
# Custom Dataset Class
# ─────────────────────────────────────────────
class OsteoporosisDataset(Dataset):
    """
    Binary classification dataset for Osteoporosis Detection.

    Expected folder structure:
        data_dir/
        ├── Normal/         → label 0
        └── Osteoporosis/   → label 1

    Each image is preprocessed with CLAHE + Gaussian denoising
    before the torchvision transforms are applied.
    """

    # Class-to-label mapping (folder names are lowercase in the dataset)
    CLASS_MAP = {"normal": 0, "osteoporosis": 1}
    LABEL_MAP = {0: "Normal", 1: "Osteoporosis"}

    def __init__(
        self,
        data_dir: str,
        transform: Optional[transforms.Compose] = None,
    ) -> None:
        """
        Args:
            data_dir: Root directory containing Normal/ and Osteoporosis/ subfolders.
            transform: Torchvision transforms to apply after CLAHE/denoising.
        """
        self.data_dir = data_dir
        self.transform = transform
        self.image_paths: List[str] = []
        self.labels: List[int] = []

        # Supported image extensions
        valid_ext = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp"}

        # Walk through each class folder
        for class_name, label in self.CLASS_MAP.items():
            class_dir = os.path.join(data_dir, class_name)
            if not os.path.isdir(class_dir):
                print(f"[WARNING] Class folder not found: {class_dir}")
                continue

          
            for fname in sorted(os.listdir(class_dir)):
                ext = os.path.splitext(fname)[1].lower()
                if ext in valid_ext:
                    self.image_paths.append(os.path.join(class_dir, fname))
                    self.labels.append(label)

        print(f"[INFO] Loaded {len(self.image_paths)} images from {data_dir}")
        print(f"       Normal: {self.labels.count(0)}, Osteoporosis: {self.labels.count(1)}")

    def __len__(self) -> int:
        return len(self.image_paths)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Load, preprocess, and return a single (image_tensor, label_tensor) pair.
        """
        img_path = self.image_paths[idx]
        label = self.labels[idx]

        # Apply CLAHE + Gaussian denoising (OpenCV operations)
        pil_image = preprocess_image(img_path)

        # Apply torchvision transforms (resize, augment, normalize)
        if self.transform:
            tensor_image = self.transform(pil_image)
        else:
            tensor_image = transforms.ToTensor()(pil_image)

        label_tensor = torch.tensor(label, dtype=torch.float32)
        return tensor_image, label_tensor


# ─────────────────────────────────────────────
# DataLoader Factory
# ─────────────────────────────────────────────
def get_dataloaders(
    data_dir: str,
    batch_size: int = 16,
    image_size: int = 224,
    seed: int = 42,
    num_workers: int = 2,
) -> Tuple[DataLoader, DataLoader, DataLoader]:
    """
    Create train, validation, and test DataLoaders with a 70/15/15 split.

    The split is stratified to maintain the class distribution in each subset.
    Training data receives augmentation; validation and test data do not.

    Args:
        data_dir: Root directory with Normal/ and Osteoporosis/ subfolders.
        batch_size: Batch size for all DataLoaders.
        image_size: Target image size (height = width).
        seed: Random seed for reproducible splits.
        num_workers: Number of dataloader worker processes.

    Returns:
        Tuple of (train_loader, val_loader, test_loader).
    """
    # ── Step 1: Create the full dataset (with eval transforms as placeholder) ──
    full_dataset = OsteoporosisDataset(data_dir, transform=None)
    all_labels = full_dataset.labels
    all_indices = list(range(len(full_dataset)))

    # ── Step 2: Stratified split — 70% train, 30% temp ──
    train_idx, temp_idx = train_test_split(
        all_indices,
        test_size=0.30,
        stratify=[all_labels[i] for i in all_indices],
        random_state=seed,
    )

    # ── Step 3: Split temp into 50/50 → val 15%, test 15% ──
    val_idx, test_idx = train_test_split(
        temp_idx,
        test_size=0.50,
        stratify=[all_labels[i] for i in temp_idx],
        random_state=seed,
    )

    print(f"[INFO] Split sizes — Train: {len(train_idx)}, Val: {len(val_idx)}, Test: {len(test_idx)}")

    # ── Step 4: Create separate dataset instances with appropriate transforms ──
    train_dataset = OsteoporosisDataset(data_dir, transform=get_train_transforms(image_size))
    eval_dataset = OsteoporosisDataset(data_dir, transform=get_eval_transforms(image_size))

    # ── Step 5: Create Subsets ──
    train_subset = Subset(train_dataset, train_idx)
    val_subset = Subset(eval_dataset, val_idx)
    test_subset = Subset(eval_dataset, test_idx)

    # Only pin memory when CUDA is available
    use_pin_memory = torch.cuda.is_available()

    # ── Step 6: Wrap in DataLoaders ──
    train_loader = DataLoader(
        train_subset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=num_workers,
        pin_memory=use_pin_memory,
        drop_last=True,
    )
    val_loader = DataLoader(
        val_subset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=use_pin_memory,
    )
    test_loader = DataLoader(
        test_subset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=use_pin_memory,
    )

    return train_loader, val_loader, test_loader
