"""Face analysis using MediaPipe FaceLandmarker Task API with blendshapes."""

import numpy as np

from config import FACE_DETECTION_CONFIDENCE

_face_landmarker = None
_mp_initialized = False


def _init_mediapipe():
    global _face_landmarker, _mp_initialized
    if _mp_initialized:
        return
    _mp_initialized = True
    try:
        from analysis.model_downloader import ensure_face_landmarker

        model_path = ensure_face_landmarker()

        import mediapipe as mp
        from mediapipe.tasks import python as mp_python
        from mediapipe.tasks.python import vision

        base_options = mp_python.BaseOptions(
            model_asset_path=str(model_path),
        )
        options = vision.FaceLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.VIDEO,
            output_face_blendshapes=True,
            output_facial_transformation_matrixes=False,
            num_faces=1,
            min_face_detection_confidence=FACE_DETECTION_CONFIDENCE,
            min_face_presence_confidence=FACE_DETECTION_CONFIDENCE,
            min_tracking_confidence=FACE_DETECTION_CONFIDENCE,
        )
        _face_landmarker = vision.FaceLandmarker.create_from_options(options)
    except Exception as e:
        print(f"[face_analysis] init error: {e}")
        _face_landmarker = None


# Blendshape categories mapped to emotions
EMOTION_BLENDSHAPES = {
    "happy": ["mouthSmileLeft", "mouthSmileRight", "cheekSquintLeft", "cheekSquintRight"],
    "surprised": ["browInnerUp", "browOuterUpLeft", "browOuterUpRight", "jawOpen"],
    "angry": ["browDownLeft", "browDownRight", "mouthFrownLeft", "mouthFrownRight"],
    "neutral": [],
}

# Monotonic timestamp counter for VIDEO running mode
_frame_timestamp_ms = 0


class FaceAnalysisResult:
    def __init__(self):
        self.face_detected = False
        self.eye_contact = False
        self.dominant_expression = "neutral"
        self.expression_scores: dict[str, float] = {}
        self.landmarks = None


def analyze_face(frame_rgb: np.ndarray) -> FaceAnalysisResult:
    """Analyze a single RGB frame for face landmarks and expressions."""
    global _frame_timestamp_ms
    result = FaceAnalysisResult()

    _init_mediapipe()
    if _face_landmarker is None:
        return result

    try:
        import mediapipe as mp

        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
        _frame_timestamp_ms += 33  # ~30fps increments
        detection = _face_landmarker.detect_for_video(mp_image, _frame_timestamp_ms)
    except Exception as e:
        print(f"[face_analysis] detect error: {e}")
        return result

    if not detection.face_landmarks:
        return result

    result.face_detected = True
    result.landmarks = detection.face_landmarks[0]

    # Eye contact estimation: check if face is roughly centered and facing forward
    nose = detection.face_landmarks[0][1]
    center_x_diff = abs(nose.x - 0.5)
    center_y_diff = abs(nose.y - 0.5)
    result.eye_contact = center_x_diff < 0.15 and center_y_diff < 0.2

    # Blendshape-based expression detection
    if detection.face_blendshapes:
        blendshapes = {bs.category_name: bs.score
                       for bs in detection.face_blendshapes[0]}

        for emotion, shape_names in EMOTION_BLENDSHAPES.items():
            if shape_names:
                score = sum(blendshapes.get(s, 0.0) for s in shape_names) / len(shape_names)
                result.expression_scores[emotion] = score

        if result.expression_scores:
            result.dominant_expression = max(
                result.expression_scores, key=result.expression_scores.get
            )
            # If all scores are low, call it neutral
            if max(result.expression_scores.values()) < 0.1:
                result.dominant_expression = "neutral"

    return result
