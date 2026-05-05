"""Global configuration constants."""

from pathlib import Path

# Paths
PROJECT_ROOT = Path(__file__).parent
DATA_DIR = PROJECT_ROOT / "data"
SESSIONS_DIR = DATA_DIR / "sessions"
SCRIPTS_DIR = DATA_DIR / "scripts"

# Audio
SAMPLE_RATE = 16000
AUDIO_CHANNELS = 1
AUDIO_CHUNK_DURATION = 0.5  # seconds per chunk
AUDIO_CHUNK_SAMPLES = int(SAMPLE_RATE * AUDIO_CHUNK_DURATION)

# Transcription (Vosk handles model download automatically)

# Video
CAMERA_INDEX = 0
CAMERA_WIDTH = 640
CAMERA_HEIGHT = 480
TIMER_INTERVAL = 0.15  # seconds (Gradio timer tick)

# Ollama
OLLAMA_URL = "http://localhost:11434"
OLLAMA_MODEL = "llama3"
OLLAMA_VISION_MODEL = "llava"  # Vision model for video frame analysis

# Video analysis
FRAME_SAMPLE_INTERVAL = 30  # seconds between sampled frames for visual feedback
MAX_SAMPLE_FRAMES = 6  # max frames to send to vision model

# Filler words
FILLER_WORDS = [
    "um", "uh", "uhh", "umm", "hmm", "hm",
    "like", "you know", "basically", "actually",
    "literally", "right", "so", "well", "I mean",
    "kind of", "sort of", "stuff like that",
    "or whatever", "or something",
]

# Speech metrics
TARGET_WPM_LOW = 120
TARGET_WPM_HIGH = 160

# Overlay colors (BGR for OpenCV)
COLOR_GREEN = (0, 200, 0)
COLOR_YELLOW = (0, 200, 200)
COLOR_RED = (0, 0, 200)
COLOR_WHITE = (255, 255, 255)
COLOR_BG = (30, 30, 30)

# MediaPipe
FACE_DETECTION_CONFIDENCE = 0.5
POSE_DETECTION_CONFIDENCE = 0.5

MODELS_DIR = DATA_DIR / "models"
FACE_LANDMARKER_MODEL = MODELS_DIR / "face_landmarker.task"
POSE_LANDMARKER_MODEL = MODELS_DIR / "pose_landmarker_lite.task"

FACE_LANDMARKER_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task"
POSE_LANDMARKER_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task"
