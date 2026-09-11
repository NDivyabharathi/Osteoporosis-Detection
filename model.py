"""
model.py — Dual-Branch Architecture for Osteoporosis Detection.

Architecture:
  Branch 1: MobileNetV4 (pretrained) — extracts local bone texture features
  Branch 2: ViT-Small (pretrained)   — extracts global structural features

Both branches have their classifier heads removed. Their feature vectors
are concatenated and passed through a fusion head:
  Concat → Dropout → FC → ReLU → Dropout → FC → raw logit (1-dim)

The raw logit is used with BCEWithLogitsLoss during training.
For inference, apply torch.sigmoid() to get the probability.
"""


import torch
import torch.nn as nn
import timm


# ─────────────────────────────────────────────
# MobileNetV4 Feature Extractor
# ─────────────────────────────────────────────
class MobileNetV4Branch(nn.Module):
    """
    MobileNetV4 backbone for local bone texture feature extraction.

    Uses the `timm` library to load a pretrained MobileNetV4 model,
    removes the classification head, and outputs a feature vector.
    """

    def __init__(
        self,
        model_name: str = "mobilenetv4_conv_small.e2400_r224_in1k",
        pretrained: bool = True,
        freeze_ratio: float = 0.7,
    ) -> None:
        """
        Args:
            model_name: timm model identifier for MobileNetV4.
            pretrained: Whether to load ImageNet-pretrained weights.
            freeze_ratio: Fraction of early parameters to freeze (0.0–1.0).
        """
        super().__init__()

        # Load MobileNetV4 without classifier head (num_classes=0)
        self.backbone = timm.create_model(model_name, pretrained=pretrained, num_classes=0)

        # Determine actual output feature dimension via dummy forward pass
        self.backbone.eval()
        with torch.no_grad():
            dummy = torch.zeros(1, 3, 224, 224)
            dummy_out = self.backbone(dummy)
            self.num_features = dummy_out.shape[1]
        self.backbone.train()

        # Freeze early layers to prevent catastrophic forgetting
        self._freeze_layers(freeze_ratio)

        print(f"[INFO] MobileNetV4 branch: {model_name}")
        print(f"       Output features: {self.num_features}")
        print(f"       Frozen ratio: {freeze_ratio:.0%}")

    def _freeze_layers(self, ratio: float) -> None:
        """Freeze the first `ratio` fraction of model parameters."""
        params = list(self.backbone.parameters())
        num_freeze = int(len(params) * ratio)
        for param in params[:num_freeze]:
            param.requires_grad = False

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Extract feature vector from input images."""
        return self.backbone(x)


# ─────────────────────────────────────────────
# Vision Transformer (ViT) Feature Extractor
# ─────────────────────────────────────────────
class ViTBranch(nn.Module):
    """
    Vision Transformer backbone for global structural feature extraction.

    Uses ViT-Small with 16×16 patches, pretrained on ImageNet-21k
    and fine-tuned on ImageNet-1k.
    """

    def __init__(
        self,
        model_name: str = "vit_small_patch16_224.augreg_in21k_ft_in1k",
        pretrained: bool = True,
        freeze_ratio: float = 0.7,
    ) -> None:
        """
        Args:
            model_name: timm model identifier for ViT.
            pretrained: Whether to load pretrained weights.
            freeze_ratio: Fraction of early parameters to freeze (0.0–1.0).
        """
        super().__init__()

        # Load ViT without classifier head (num_classes=0)
        self.backbone = timm.create_model(model_name, pretrained=pretrained, num_classes=0)

        # Determine actual output feature dimension via dummy forward pass
        self.backbone.eval()
        with torch.no_grad():
            dummy = torch.zeros(1, 3, 224, 224)
            dummy_out = self.backbone(dummy)
            self.num_features = dummy_out.shape[1]
        self.backbone.train()

        # Freeze early layers
        self._freeze_layers(freeze_ratio)

        print(f"[INFO] ViT branch: {model_name}")
        print(f"       Output features: {self.num_features}")
        print(f"       Frozen ratio: {freeze_ratio:.0%}")

    def _freeze_layers(self, ratio: float) -> None:
        """Freeze the first `ratio` fraction of model parameters."""
        params = list(self.backbone.parameters())
        num_freeze = int(len(params) * ratio)
        for param in params[:num_freeze]:
            param.requires_grad = False

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Extract feature vector from input images."""
        return self.backbone(x)


# ─────────────────────────────────────────────
# Dual-Branch Fusion Model
# ─────────────────────────────────────────────
class DualBranchOsteoModel(nn.Module):
    """
    Dual-branch model combining MobileNetV4 and ViT for binary
    osteoporosis classification.

    Architecture:
        Input Image
            ├─→ MobileNetV4 → feature_mob  (e.g., 1024-dim)
            └─→ ViT         → feature_vit  (e.g., 384-dim)
                     ↓
              Concatenation → (1408-dim)
                     ↓
              Dropout(0.5)
                     ↓
              Linear(1408, 512) → ReLU
                     ↓
              Dropout(0.3)
                     ↓
              Linear(512, 1) → raw logit

    The model outputs a single raw logit. Use BCEWithLogitsLoss for
    training and torch.sigmoid() for inference probabilities.
    """

    def __init__(
        self,
        mobilenet_name: str = "mobilenetv4_conv_small.e2400_r224_in1k",
        vit_name: str = "vit_small_patch16_224.augreg_in21k_ft_in1k",
        pretrained: bool = True,
        freeze_ratio: float = 0.7,
        dropout_1: float = 0.5,
        dropout_2: float = 0.3,
        hidden_dim: int = 512,
    ) -> None:
        """
        Args:
            mobilenet_name: timm identifier for MobileNetV4.
            vit_name: timm identifier for ViT.
            pretrained: Load pretrained weights for both branches.
            freeze_ratio: Fraction of early layers to freeze in each branch.
            dropout_1: Dropout rate after concatenation.
            dropout_2: Dropout rate after the hidden FC layer.
            hidden_dim: Dimension of the hidden FC layer in the fusion head.
        """
        super().__init__()

        # ── Branch 1: MobileNetV4 (local texture features) ──
        self.mobilenet_branch = MobileNetV4Branch(
            model_name=mobilenet_name,
            pretrained=pretrained,
            freeze_ratio=freeze_ratio,
        )

        # ── Branch 2: ViT (global structural features) ──
        self.vit_branch = ViTBranch(
            model_name=vit_name,
            pretrained=pretrained,
            freeze_ratio=freeze_ratio,
        )

        # ── Fusion Head ──
        combined_dim = self.mobilenet_branch.num_features + self.vit_branch.num_features
        print(f"[INFO] Fusion head input dim: {combined_dim} "
              f"(MobileNetV4: {self.mobilenet_branch.num_features} + "
              f"ViT: {self.vit_branch.num_features})")

        self.fusion_head = nn.Sequential(
            nn.Dropout(p=dropout_1),
            nn.Linear(combined_dim, hidden_dim),
            nn.ReLU(inplace=True),
            nn.Dropout(p=dropout_2),
            nn.Linear(hidden_dim, 1),   # Single logit for binary classification
        )

        # Initialize the fusion head weights
        self._init_fusion_weights()

    def _init_fusion_weights(self) -> None:
        """Kaiming initialisation for the fusion head linear layers."""
        for module in self.fusion_head.modules():
            if isinstance(module, nn.Linear):
                nn.init.kaiming_normal_(module.weight, nonlinearity="relu")
                if module.bias is not None:
                    nn.init.zeros_(module.bias)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass through both branches and the fusion head.

        Args:
            x: Input image tensor of shape (B, 3, 224, 224).

        Returns:
            Raw logit tensor of shape (B, 1).
        """
        # Extract features from both branches
        mob_features = self.mobilenet_branch(x)   # (B, mob_dim)
        vit_features = self.vit_branch(x)         # (B, vit_dim)

        # Concatenate feature vectors
        combined = torch.cat([mob_features, vit_features], dim=1)  # (B, mob_dim + vit_dim)

        # Pass through fusion head → raw logit
        logit = self.fusion_head(combined)  # (B, 1)
        return logit

    def get_num_trainable_params(self) -> int:
        """Return the number of trainable parameters."""
        return sum(p.numel() for p in self.parameters() if p.requires_grad)

    def get_num_total_params(self) -> int:
        """Return the total number of parameters."""
        return sum(p.numel() for p in self.parameters())


# ─────────────────────────────────────────────
# Model Builder (convenience function)
# ─────────────────────────────────────────────
def build_model(
    pretrained: bool = True,
    freeze_ratio: float = 0.7,
    device: torch.device = torch.device("cpu"),
) -> DualBranchOsteoModel:
    """
    Build and return the dual-branch model, moved to the specified device.

    Args:
        pretrained: Whether to load pretrained weights.
        freeze_ratio: Fraction of early layers to freeze.
        device: Target device (cuda / mps / cpu).

    Returns:
        DualBranchOsteoModel ready for training.
    """
    model = DualBranchOsteoModel(
        pretrained=pretrained,
        freeze_ratio=freeze_ratio,
    )

    total = model.get_num_total_params()
    trainable = model.get_num_trainable_params()
    frozen = total - trainable

    print(f"\n[INFO] Model Summary:")
    print(f"       Total parameters:     {total:>12,}")
    print(f"       Trainable parameters: {trainable:>12,}")
    print(f"       Frozen parameters:    {frozen:>12,}")

    model = model.to(device)
    return model
