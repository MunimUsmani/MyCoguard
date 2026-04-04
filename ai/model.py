import os
import torch.nn as nn
import torchvision


NUM_CLASSES = 3


def create_model(arch: str = None, num_classes: int = NUM_CLASSES):
    arch = (arch or os.getenv("MODEL_ARCH", "efficientnet_b0")).lower()

    if arch == "efficientnet_b0":
        model = torchvision.models.efficientnet_b0(weights=None)
        in_features = model.classifier[1].in_features
        model.classifier = nn.Sequential(
            nn.Dropout(0.4),
            nn.Linear(in_features, num_classes)
        )
        return model

    if arch == "resnet18":
        model = torchvision.models.resnet18(weights=None)
        in_features = model.fc.in_features
        model.fc = nn.Sequential(
            nn.Dropout(0.4),
            nn.Linear(in_features, num_classes)
        )
        return model

    raise ValueError(
        f"Unsupported MODEL_ARCH '{arch}'. Use 'efficientnet_b0' or 'resnet18'."
    )