"""Threaded webcam capture using OpenCV."""

import queue
import threading

import cv2
import numpy as np

from config import CAMERA_INDEX, CAMERA_WIDTH, CAMERA_HEIGHT


class CameraCapture:
    """Runs a background thread reading webcam frames into a queue."""

    def __init__(self, max_queue_size: int = 2):
        self.queue: queue.Queue[np.ndarray] = queue.Queue(maxsize=max_queue_size)
        self._cap: cv2.VideoCapture | None = None
        self._thread: threading.Thread | None = None
        self._running = False

    def start(self):
        if self._running:
            return
        self._cap = cv2.VideoCapture(CAMERA_INDEX, cv2.CAP_DSHOW)
        self._cap.set(cv2.CAP_PROP_FRAME_WIDTH, CAMERA_WIDTH)
        self._cap.set(cv2.CAP_PROP_FRAME_HEIGHT, CAMERA_HEIGHT)
        if not self._cap.isOpened():
            raise RuntimeError("Cannot open camera")
        self._running = True
        self._thread = threading.Thread(target=self._capture_loop, daemon=True)
        self._thread.start()

    def _capture_loop(self):
        while self._running:
            ret, frame = self._cap.read()
            if not ret:
                continue
            # Drop old frame if queue is full
            if self.queue.full():
                try:
                    self.queue.get_nowait()
                except queue.Empty:
                    pass
            try:
                self.queue.put_nowait(frame)
            except queue.Full:
                pass

    def stop(self):
        self._running = False
        if self._thread is not None:
            self._thread.join(timeout=2.0)
            self._thread = None
        if self._cap is not None:
            self._cap.release()
            self._cap = None
        # Drain
        while not self.queue.empty():
            try:
                self.queue.get_nowait()
            except queue.Empty:
                break

    def get_latest_frame(self) -> np.ndarray | None:
        """Get the most recent frame, discarding older ones."""
        frame = None
        while True:
            try:
                frame = self.queue.get_nowait()
            except queue.Empty:
                break
        return frame

    @property
    def is_running(self) -> bool:
        return self._running
