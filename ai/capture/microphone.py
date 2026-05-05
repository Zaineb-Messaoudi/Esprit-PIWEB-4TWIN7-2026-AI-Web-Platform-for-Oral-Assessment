"""Threaded microphone capture using sounddevice."""

import queue
import threading
import numpy as np
import sounddevice as sd

from config import SAMPLE_RATE, AUDIO_CHANNELS, AUDIO_CHUNK_SAMPLES


class MicrophoneCapture:
    """Streams audio from the default microphone into a thread-safe queue."""

    def __init__(self, max_queue_size: int = 50):
        self.queue: queue.Queue[np.ndarray] = queue.Queue(maxsize=max_queue_size)
        self._stream: sd.InputStream | None = None
        self._running = False

    def _audio_callback(self, indata: np.ndarray, frames: int,
                        time_info, status):
        if status:
            pass  # dropped frames, not much we can do
        audio_copy = indata[:, 0].copy()  # mono
        try:
            self.queue.put_nowait(audio_copy)
        except queue.Full:
            # Drop oldest chunk to make room
            try:
                self.queue.get_nowait()
            except queue.Empty:
                pass
            try:
                self.queue.put_nowait(audio_copy)
            except queue.Full:
                pass

    def start(self):
        if self._running:
            return
        self._running = True
        self._stream = sd.InputStream(
            samplerate=SAMPLE_RATE,
            channels=AUDIO_CHANNELS,
            dtype="float32",
            blocksize=AUDIO_CHUNK_SAMPLES,
            callback=self._audio_callback,
        )
        self._stream.start()

    def stop(self):
        self._running = False
        if self._stream is not None:
            self._stream.stop()
            self._stream.close()
            self._stream = None
        # Drain queue
        while not self.queue.empty():
            try:
                self.queue.get_nowait()
            except queue.Empty:
                break

    def drain(self) -> list[np.ndarray]:
        """Drain all pending audio chunks from the queue."""
        chunks = []
        while True:
            try:
                chunks.append(self.queue.get_nowait())
            except queue.Empty:
                break
        return chunks

    @property
    def is_running(self) -> bool:
        return self._running
