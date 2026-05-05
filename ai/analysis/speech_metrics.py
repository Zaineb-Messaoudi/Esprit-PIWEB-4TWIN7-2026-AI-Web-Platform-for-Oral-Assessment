"""Speech metrics: WPM, volume (RMS), pitch."""

import time
import numpy as np

from config import SAMPLE_RATE, TARGET_WPM_LOW, TARGET_WPM_HIGH


class SpeechMetrics:
    """Track words-per-minute, volume, and pitch over time."""

    def __init__(self):
        self._start_time: float | None = None
        self._word_count = 0
        self._wpm_history: list[tuple[float, float]] = []  # (timestamp, wpm)
        self._volume_history: list[tuple[float, float]] = []  # (timestamp, rms)
        self._pitch_history: list[tuple[float, float]] = []  # (timestamp, hz)
        self._current_wpm = 0.0
        self._current_volume = 0.0
        self._current_pitch = 0.0
        self._last_pitch_time = 0.0  # throttle expensive pitch calc

    def start(self):
        self._start_time = time.time()

    def update_from_transcript(self, transcript: str,
                               elapsed: float | None = None):
        """Recalculate WPM from the full transcript."""
        if self._start_time is None and elapsed is None:
            return
        words = transcript.split()
        self._word_count = len(words)
        elapsed_value = elapsed if elapsed is not None else time.time() - self._start_time
        if elapsed_value > 2.0:  # Wait a bit before calculating
            self._current_wpm = (self._word_count / elapsed_value) * 60
            self._wpm_history.append((elapsed_value, self._current_wpm))

    def update_from_audio(self, audio: np.ndarray,
                          elapsed: float | None = None):
        """Calculate volume (RMS) and pitch from audio chunk."""
        if len(audio) == 0 or (self._start_time is None and elapsed is None):
            return
        elapsed_value = elapsed if elapsed is not None else time.time() - self._start_time

        rms = float(np.sqrt(np.mean(audio ** 2)))
        self._current_volume = rms
        self._volume_history.append((elapsed_value, rms))

        # Pitch estimation is expensive, so only sample it once per second.
        if elapsed_value - self._last_pitch_time >= 1.0:
            self._last_pitch_time = elapsed_value
            pitch = self._estimate_pitch(audio)
            if pitch > 0:
                self._current_pitch = pitch
                self._pitch_history.append((elapsed_value, pitch))

    def _estimate_pitch(self, audio: np.ndarray) -> float:
        """Simple autocorrelation pitch estimation."""
        if len(audio) < 2 * SAMPLE_RATE // 50:  # Need enough samples
            return 0.0
        if np.max(np.abs(audio)) < 0.01:
            return 0.0

        corr = np.correlate(audio, audio, mode="full")
        corr = corr[len(corr) // 2:]

        min_lag = SAMPLE_RATE // 500  # max 500 Hz
        max_lag = SAMPLE_RATE // 50   # min 50 Hz
        if max_lag >= len(corr):
            return 0.0

        segment = corr[min_lag:max_lag]
        if len(segment) == 0:
            return 0.0

        peak_idx = np.argmax(segment) + min_lag
        if corr[peak_idx] > 0.3 * corr[0]:
            return SAMPLE_RATE / peak_idx
        return 0.0

    @property
    def wpm(self) -> float:
        return self._current_wpm

    @property
    def wpm_status(self) -> str:
        if self._current_wpm == 0:
            return "..."
        if self._current_wpm < TARGET_WPM_LOW:
            return "slow"
        if self._current_wpm > TARGET_WPM_HIGH:
            return "fast"
        return "good"

    @property
    def volume(self) -> float:
        return self._current_volume

    @property
    def pitch(self) -> float:
        return self._current_pitch

    @property
    def word_count(self) -> int:
        return self._word_count

    @property
    def wpm_history(self) -> list[tuple[float, float]]:
        return list(self._wpm_history)

    @property
    def volume_history(self) -> list[tuple[float, float]]:
        return list(self._volume_history)

    @property
    def pitch_history(self) -> list[tuple[float, float]]:
        return list(self._pitch_history)

    @property
    def elapsed_seconds(self) -> float:
        if self._start_time is None:
            return 0.0
        return time.time() - self._start_time

    def reset(self):
        self._start_time = None
        self._word_count = 0
        self._wpm_history.clear()
        self._volume_history.clear()
        self._pitch_history.clear()
        self._current_wpm = 0.0
        self._current_volume = 0.0
        self._current_pitch = 0.0
        self._last_pitch_time = 0.0
