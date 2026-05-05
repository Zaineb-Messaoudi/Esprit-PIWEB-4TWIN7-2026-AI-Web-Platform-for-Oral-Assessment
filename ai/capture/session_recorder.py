"""Record session audio (WAV) and video (AVI) to disk."""

import wave
import threading
from pathlib import Path

import cv2
import numpy as np

from config import SAMPLE_RATE, CAMERA_WIDTH, CAMERA_HEIGHT


class SessionRecorder:
    """Records audio and video to files during a practice session."""

    def __init__(self, output_dir: Path, *, record_audio: bool = True,
                 record_video: bool = True):
        self._output_dir = output_dir
        self._output_dir.mkdir(parents=True, exist_ok=True)
        self._record_audio = record_audio
        self._record_video = record_video
        self._audio_path = output_dir / "audio.wav" if record_audio else None
        self._video_path = output_dir / "video.avi" if record_video else None
        self._wav_file: wave.Wave_write | None = None
        self._video_writer: cv2.VideoWriter | None = None
        self._lock = threading.Lock()
        self._audio_frames: list[np.ndarray] = []

    def start(self):
        """Start recording."""
        if self._record_audio and self._audio_path is not None:
            self._wav_file = wave.open(str(self._audio_path), "wb")
            self._wav_file.setnchannels(1)
            self._wav_file.setsampwidth(2)  # 16-bit
            self._wav_file.setframerate(SAMPLE_RATE)

        if self._record_video and self._video_path is not None:
            fourcc = cv2.VideoWriter_fourcc(*"MJPG")
            self._video_writer = cv2.VideoWriter(
                str(self._video_path), fourcc, 10.0,
                (CAMERA_WIDTH, CAMERA_HEIGHT),
            )

    def write_audio(self, audio: np.ndarray):
        """Write audio chunk (float32 mono) to WAV."""
        if self._wav_file is None:
            return
        # Convert float32 [-1, 1] to int16
        audio_int16 = (audio * 32767).astype(np.int16)
        with self._lock:
            self._wav_file.writeframes(audio_int16.tobytes())

    def write_frame(self, frame: np.ndarray):
        """Write a BGR video frame."""
        if self._video_writer is None:
            return
        # Resize if needed
        h, w = frame.shape[:2]
        if w != CAMERA_WIDTH or h != CAMERA_HEIGHT:
            frame = cv2.resize(frame, (CAMERA_WIDTH, CAMERA_HEIGHT))
        with self._lock:
            self._video_writer.write(frame)

    def stop(self):
        """Stop recording and close files."""
        with self._lock:
            if self._wav_file is not None:
                self._wav_file.close()
                self._wav_file = None
            if self._video_writer is not None:
                self._video_writer.release()
                self._video_writer = None

    @property
    def audio_path(self) -> Path:
        return self._audio_path

    @property
    def video_path(self) -> Path:
        return self._video_path
