import os
import sys
import json
from pathlib import Path

import torch
from PIL import Image
from torchvision import transforms

from model import create_model

CLASS_NAMES = ["healthy", "degrading", "replace_now"]


def get_project_root():
    return Path(__file__).resolve().parent.parent


def get_model_path():
    root = get_project_root()
    env_path = os.getenv("MODEL_PATH")

    if env_path:
        env_path_obj = Path(env_path)
        if env_path_obj.is_absolute():
            return env_path_obj
        return (root / env_path_obj).resolve()

    return root / "model" / "mycoguard_best_efficientnet.pth"


def build_transform():
    return transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])


def load_trained_model():
    model_path = get_model_path()

    if not model_path.exists():
        raise FileNotFoundError(f"Model file not found: {model_path}")

    arch = os.getenv("MODEL_ARCH", "efficientnet_b0")
    device = torch.device("cpu")

    model = create_model(arch=arch)
    state_dict = torch.load(model_path, map_location=device)
    model.load_state_dict(state_dict)
    model.to(device)
    model.eval()

    return model, device, str(model_path), arch


def status_meta(status: str):
    if status == "healthy":
        return {
            "risk": "low",
            "message": "Mycelium appears active and visually healthy."
        }
    if status == "degrading":
        return {
            "risk": "medium",
            "message": "Filter is degrading. Monitor closely and replace soon."
        }
    return {
        "risk": "high",
        "message": "Filter appears saturated or degraded. Replace immediately."
    }


def compute_efficiency(probabilities):
    healthy_p = float(probabilities[0])
    degrading_p = float(probabilities[1])
    replace_p = float(probabilities[2])

    efficiency = (
        healthy_p * 0.95 +
        degrading_p * 0.55 +
        replace_p * 0.15
    )

    efficiency = max(0.10, min(0.98, efficiency))
    return round(efficiency, 2)


def analyze(img_path: str):
    model, device, model_path, arch = load_trained_model()
    transform = build_transform()

    image = Image.open(img_path).convert("RGB")
    tensor = transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        logits = model(tensor)
        probs = torch.softmax(logits, dim=1).squeeze(0).cpu().tolist()

    pred_idx = int(torch.tensor(probs).argmax().item())
    status = CLASS_NAMES[pred_idx]
    confidence = round(float(probs[pred_idx]), 2)

    meta = status_meta(status)
    efficiency = compute_efficiency(probs)

    return {
        "status": status,
        "efficiency": efficiency,
        "risk": meta["risk"],
        "confidence": confidence,
        "model_arch": arch,
        "model_path": model_path,
        "probabilities": {
            "healthy": round(float(probs[0]), 4),
            "degrading": round(float(probs[1]), 4),
            "replace_now": round(float(probs[2]), 4)
        },
        "message": meta["message"]
    }


if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            raise ValueError("Image path argument is required")

        img_path = sys.argv[1]
        output = analyze(img_path)
        print(json.dumps(output))

    except Exception as e:
        print(json.dumps({
            "error": "analysis_failed",
            "details": str(e)
        }))
        sys.exit(1)