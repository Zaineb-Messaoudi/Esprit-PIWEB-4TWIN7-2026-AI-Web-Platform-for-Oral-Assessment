"""Download MediaPipe model files on first use."""

import urllib.request
from pathlib import Path

from config import (
    MODELS_DIR,
    FACE_LANDMARKER_MODEL,
    FACE_LANDMARKER_URL,
    POSE_LANDMARKER_MODEL,
    POSE_LANDMARKER_URL,
)


def ensure_model(model_path: Path, url: str) -> Path:
    """Download a model file if it doesn't exist. Returns the path."""
    if model_path.exists():
        return model_path
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Downloading {model_path.name} ...")
    urllib.request.urlretrieve(url, str(model_path))
    print(f"Saved to {model_path}")
    return model_path


def ensure_face_landmarker() -> Path:
    return ensure_model(FACE_LANDMARKER_MODEL, FACE_LANDMARKER_URL)


def ensure_pose_landmarker() -> Path:
    return ensure_model(POSE_LANDMARKER_MODEL, POSE_LANDMARKER_URL)
