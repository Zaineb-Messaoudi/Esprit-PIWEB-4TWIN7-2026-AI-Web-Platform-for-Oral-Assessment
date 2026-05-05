"""Helpers for analyzing uploaded audio and video files."""

from __future__ import annotations

import cv2
import librosa
import numpy as np

from config import AUDIO_CHUNK_SAMPLES, SAMPLE_RATE


def load_audio_file(path: str) -> np.ndarray:
    """Load an audio file as mono float32 at the app sample rate."""
    audio, _ = librosa.load(path, sr=SAMPLE_RATE, mono=True)
    return audio.astype(np.float32)


def load_audio_from_video(path: str) -> np.ndarray:
    """Extract a video's audio track using PyAV and return mono float32 samples."""
    try:
        import av
    except Exception as exc:  # pragma: no cover
        raise RuntimeError(
            "PyAV is required for uploaded video analysis but is not installed."
        ) from exc

    with av.open(path) as container:
        audio_streams = [stream for stream in container.streams if stream.type == "audio"]
        if not audio_streams:
            return np.zeros(0, dtype=np.float32)

        stream_descriptions = [
            f"idx={stream.index}, codec={getattr(stream.codec_context, 'name', '?')}, "
            f"rate={getattr(stream.codec_context, 'sample_rate', '?')}, "
            f"channels={getattr(stream.codec_context, 'channels', '?')}"
            for stream in audio_streams
        ]

    for stream_number in range(len(audio_streams)):
        chunks: list[np.ndarray] = []
        with av.open(path) as container:
            stream = container.streams.audio[stream_number]
            resampler = av.audio.resampler.AudioResampler(
                format="fltp",
                layout="mono",
                rate=SAMPLE_RATE,
            )

            for packet in container.demux(stream):
                for frame in packet.decode():
                    resampled_frames = resampler.resample(frame)
                    if not resampled_frames:
                        continue

                    if not isinstance(resampled_frames, list):
                        resampled_frames = [resampled_frames]

                    for resampled in resampled_frames:
                        arr = resampled.to_ndarray()
                        if arr.ndim == 2:
                            arr = arr[0]
                        chunks.append(arr.astype(np.float32, copy=False))

            flushed = resampler.resample(None)
            if flushed:
                if not isinstance(flushed, list):
                    flushed = [flushed]
                for resampled in flushed:
                    arr = resampled.to_ndarray()
                    if arr.ndim == 2:
                        arr = arr[0]
                    chunks.append(arr.astype(np.float32, copy=False))

        if chunks:
            return np.concatenate(chunks)

    raise RuntimeError(
        "Audio stream found but could not be decoded. "
        f"Detected streams: {'; '.join(stream_descriptions)}"
    )


def iter_audio_chunks(audio: np.ndarray):
    """Yield successive audio chunks and their time boundaries."""
    for start in range(0, len(audio), AUDIO_CHUNK_SAMPLES):
        chunk = audio[start:start + AUDIO_CHUNK_SAMPLES]
        start_t = start / SAMPLE_RATE
        end_t = (start + len(chunk)) / SAMPLE_RATE
        yield start_t, end_t, chunk


def iter_video_frames(path: str, step_seconds: float):
    """Yield sampled BGR frames from a video file."""
    cap = cv2.VideoCapture(path)
    try:
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        step_frames = max(1, int(round(step_seconds * fps)))
        frame_idx = 0

        while True:
            ok, frame = cap.read()
            if not ok:
                break
            if frame_idx % step_frames == 0:
                yield frame_idx / fps, frame
            frame_idx += 1
    finally:
        cap.release()
