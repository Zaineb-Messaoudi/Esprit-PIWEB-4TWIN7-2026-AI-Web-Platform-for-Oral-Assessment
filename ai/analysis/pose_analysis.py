"""Pose analysis using MediaPipe PoseLandmarker Task API."""

import numpy as np

from config import POSE_DETECTION_CONFIDENCE

_pose_landmarker = None
_mp_initialized = False


def _init_mediapipe():
    global _pose_landmarker, _mp_initialized
    if _mp_initialized:
        return
    _mp_initialized = True
    try:
        from analysis.model_downloader import ensure_pose_landmarker

        model_path = ensure_pose_landmarker()

        import mediapipe as mp
        from mediapipe.tasks import python as mp_python
        from mediapipe.tasks.python import vision

        base_options = mp_python.BaseOptions(
            model_asset_path=str(model_path),
        )
        options = vision.PoseLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.VIDEO,
            num_poses=1,
            min_pose_detection_confidence=POSE_DETECTION_CONFIDENCE,
            min_pose_presence_confidence=POSE_DETECTION_CONFIDENCE,
            min_tracking_confidence=POSE_DETECTION_CONFIDENCE,
        )
        _pose_landmarker = vision.PoseLandmarker.create_from_options(options)
    except Exception as e:
        print(f"[pose_analysis] init error: {e}")
        _pose_landmarker = None


# Monotonic timestamp counter for VIDEO running mode
_frame_timestamp_ms = 0


class PoseAnalysisResult:
    def __init__(self):
        self.pose_detected = False
        self.posture = "unknown"  # "upright", "slouching", "leaning"
        self.gesture_openness = 0.0  # 0 = closed, 1 = open
        self.shoulders_level = True
        self.landmarks = None


def analyze_pose(frame_rgb: np.ndarray) -> PoseAnalysisResult:
    """Analyze posture and gestures from an RGB frame."""
    global _frame_timestamp_ms
    result = PoseAnalysisResult()

    _init_mediapipe()
    if _pose_landmarker is None:
        return result

    try:
        import mediapipe as mp

        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
        _frame_timestamp_ms += 33  # ~30fps increments
        detection = _pose_landmarker.detect_for_video(mp_image, _frame_timestamp_ms)
    except Exception as e:
        print(f"[pose_analysis] detect error: {e}")
        return result

    if not detection.pose_landmarks:
        return result

    result.pose_detected = True
    landmarks = detection.pose_landmarks[0]
    result.landmarks = landmarks

    # Posture: compare nose Y to midpoint of shoulders Y
    # Landmark indices: 0=nose, 11=left_shoulder, 12=right_shoulder
    nose = landmarks[0]
    left_shoulder = landmarks[11]
    right_shoulder = landmarks[12]

    shoulder_mid_y = (left_shoulder.y + right_shoulder.y) / 2
    head_shoulder_diff = shoulder_mid_y - nose.y  # positive = head above shoulders

    if head_shoulder_diff > 0.15:
        result.posture = "upright"
    elif head_shoulder_diff > 0.08:
        result.posture = "slightly slouching"
    else:
        result.posture = "slouching"

    # Shoulder level check
    shoulder_diff = abs(left_shoulder.y - right_shoulder.y)
    result.shoulders_level = shoulder_diff < 0.05

    # Gesture openness: distance between wrists relative to shoulder width
    # Landmark indices: 15=left_wrist, 16=right_wrist
    left_wrist = landmarks[15]
    right_wrist = landmarks[16]
    shoulder_width = abs(left_shoulder.x - right_shoulder.x)
    if shoulder_width > 0.01:
        wrist_spread = abs(left_wrist.x - right_wrist.x)
        result.gesture_openness = min(1.0, wrist_spread / (shoulder_width * 2.5))

    return result
