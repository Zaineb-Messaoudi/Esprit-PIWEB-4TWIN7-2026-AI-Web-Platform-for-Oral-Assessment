"""Speech-to-text using faster-whisper in a background thread."""

from dataclasses import dataclass
import threading
import numpy as np
from faster_whisper import WhisperModel

from config import SAMPLE_RATE

MODEL_SIZE = "small"  # tiny, base, small, medium, large-v3


@dataclass
class WordInfo:
    """Word-level data extracted from transcription results."""
    word: str
    conf: float
    start: float
    end: float


class Transcriber:
    """Buffered speech recognizer using faster-whisper in a background thread.

    Transcription runs in a separate thread so the UI never freezes.
    The transcript updates every ~5 seconds in the background.
    """

    def __init__(self):
        self._model = None
        self._lock = threading.Lock()
        self._audio_buffer: list[np.ndarray] = []
        self._buffer_duration = 0.0
        self._transcribe_interval = 5.0  # seconds of audio before transcribing
        self._full_transcript: str = ""
        self._prev_transcript: str = ""
        self._word_data: list[WordInfo] = []
        self._final_word_data: list[WordInfo] = []
        self._is_transcribing = False

    def _ensure_model(self):
        if self._model is None:
            self._model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")

    def transcribe_array(self, audio: np.ndarray,
                         language: str = "en") -> tuple[str, list[WordInfo]]:
        """Transcribe a complete audio array synchronously."""
        self._ensure_model()
        segments, _ = self._model.transcribe(
            audio.astype(np.float32),
            beam_size=5,
            word_timestamps=True,
            language=language,
        )

        words: list[WordInfo] = []
        for segment in segments:
            for word in (segment.words or []):
                words.append(WordInfo(
                    word=word.word.strip(),
                    conf=word.probability,
                    start=word.start,
                    end=word.end,
                ))

        transcript = " ".join(w.word for w in words).strip()
        return transcript, words

    def add_audio(self, chunks: list[np.ndarray]):
        """Buffer audio chunks; trigger background transcription when ready."""
        self._ensure_model()
        with self._lock:
            for chunk in chunks:
                self._audio_buffer.append(chunk)
                self._buffer_duration += len(chunk) / SAMPLE_RATE

            if self._buffer_duration >= self._transcribe_interval and not self._is_transcribing:
                audio = np.concatenate(self._audio_buffer).astype(np.float32)
                self._audio_buffer.clear()
                self._buffer_duration = 0.0
                self._is_transcribing = True
                threading.Thread(
                    target=self._do_transcribe,
                    args=(audio,),
                    daemon=True,
                ).start()

    def _do_transcribe(self, audio: np.ndarray):
        """Run transcription in background thread — never blocks the UI."""
        try:
            _, new_words = self.transcribe_array(audio, language="en")

            if new_words:
                new_text = " ".join(w.word for w in new_words).strip()
                with self._lock:
                    self._full_transcript = (
                        f"{self._full_transcript} {new_text}".strip()
                        if self._full_transcript else new_text
                    )
                    self._final_word_data.extend(new_words)
                    self._word_data = list(self._final_word_data)
        finally:
            self._is_transcribing = False

    def try_transcribe(self) -> str | None:
        """Return updated transcript if changed, else None."""
        current = self.full_transcript
        if current != self._prev_transcript:
            self._prev_transcript = current
            return current
        return None

    @property
    def full_transcript(self) -> str:
        with self._lock:
            return self._full_transcript

    @property
    def word_data(self) -> list[WordInfo]:
        with self._lock:
            return list(self._word_data)

    @property
    def is_transcribing(self) -> bool:
        return self._is_transcribing

    def reset(self):
        with self._lock:
            self._audio_buffer.clear()
            self._buffer_duration = 0.0
            self._full_transcript = ""
            self._prev_transcript = ""
            self._word_data.clear()
            self._final_word_data.clear()
        self._is_transcribing = False
