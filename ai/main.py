"""FastAPI wrapper — file-based equivalent of app.py's stop_session()."""

from __future__ import annotations

import base64
import io
import logging
import os
import shutil
import tempfile

import cv2
import numpy as np
import uvicorn
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image as PILImage

from analysis.face_analysis import analyze_face
from analysis.filler_words import FillerWordDetector
from analysis.pose_analysis import analyze_pose
from analysis.speech_metrics import SpeechMetrics
from analysis.transcription import Transcriber
from analysis.cefr_analyzer import analyze_cefr, format_cefr_report
from analysis.upload_pipeline import (
    iter_audio_chunks,
    iter_video_frames,
    load_audio_file,
    load_audio_from_video,
)
from config import FRAME_SAMPLE_INTERVAL, MAX_SAMPLE_FRAMES, SAMPLE_RATE
from feedback.charts import (
    create_expression_chart,
    create_filler_chart,
    create_volume_chart,
    create_wpm_chart,
)
from feedback.post_session import (
    compute_scores,
    compute_speech_quality,
    generate_ai_feedback,
    generate_visual_feedback,
)

# ── Added imports ─────────────────────────────────────────────
import soundfile as sf  # pip install soundfile

logging.basicConfig(level=logging.INFO, format="%(name)s | %(message)s")
log = logging.getLogger("main")

app = FastAPI(title="Speech AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _img_to_b64(img: np.ndarray | None) -> str | None:
    """Encode a numpy RGB/RGBA array (from matplotlib _fig_to_image) as base64 PNG."""
    if img is None:
        return None
    try:
        buf = io.BytesIO()
        PILImage.fromarray(img).convert("RGB").save(buf, format="PNG")
        return base64.b64encode(buf.getvalue()).decode()
    except Exception as e:
        log.warning("Image encode failed: %s", e)
        return None

# ── Improved helper to detect if audio file is actually a video (no magic) ──
def _is_video_file(path: str) -> bool:
    """Detect if file is video even if named .wav - checks by reading file header"""
    # Check by extension first (fast path)
    if path.lower().endswith((".mp4", ".avi", ".mov", ".webm", ".mkv", ".flv")):
        return True
    
    # For files with audio extensions, check the file header
    try:
        with open(path, "rb") as f:
            header = f.read(12)
            
        # Common video file signatures
        video_signatures = [
            b"\x00\x00\x00\x18ftypmp42",  # MP4
            b"\x00\x00\x00\x20ftypmp42",  # MP4 variant
            b"\x00\x00\x00\x1cftypisom",  # MP4 ISO
            b"RIFF",                       # AVI (also checks for WEBM)
        ]
        
        for sig in video_signatures:
            if header.startswith(sig):
                return True
        
        # Check for AVI/WEBM more carefully (RIFF container)
        if header.startswith(b"RIFF") and len(header) >= 12:
            # Check if it's AVI or WEBM (not WAV)
            container_type = header[8:12]
            if container_type in (b"AVI ", b"WEBP"):
                return True
                
    except Exception as e:
        log.debug("Could not read file header: %s", e)
    
    return False

def _process_audio(audio_path: str):
    """
    Transcribe an audio file and compute speech metrics.
    Uses transcribe_array() (single-shot) instead of the live chunked approach —
    faster for files and avoids threading complexity.
    """
    audio = load_audio_file(audio_path)
    total_duration = len(audio) / SAMPLE_RATE

    # 1. Transcribe all at once — no threading needed for files
    transcriber = Transcriber()
    transcript, word_data = transcriber.transcribe_array(audio)
    word_count = len(word_data)

    # 2. Build WPM history from word timestamps (sampled every 5 s)
    wpm_history: list[tuple[float, float]] = []
    for t in range(5, max(6, int(total_duration) + 1), 5):
        words_so_far = sum(1 for w in word_data if w.end <= t)
        wpm_history.append((float(t), (words_so_far / t) * 60.0))

    # 3. Build volume + pitch histories by iterating chunks with correct timestamps
    #    (pass elapsed=end_t so SpeechMetrics doesn't use wall clock)
    sm = SpeechMetrics()
    sm.start()
    for _, end_t, chunk in iter_audio_chunks(audio):
        sm.update_from_audio(chunk, elapsed=end_t)

    avg_wpm = (word_count / total_duration * 60.0) if total_duration > 2 else 0.0

    return (
        transcript,
        word_data,
        wpm_history,
        sm.volume_history,
        sm.pitch_history,
        avg_wpm,
        word_count,
        total_duration,
    )


def _analyze_video(video_path: str):
    """
    Run face + pose analysis on sampled frames.
    Uses iter_video_frames() (step=1s) instead of the live timer tick.
    """
    expression_history: list[tuple[float, str]] = []
    posture_history:    list[tuple[float, str]] = []
    eye_contact_history: list[tuple[float, bool]] = []
    sampled_frames:     list[np.ndarray] = []
    last_sample_t = -FRAME_SAMPLE_INTERVAL

    for elapsed, frame_bgr in iter_video_frames(video_path, step_seconds=1.0):
        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)

        try:
            face = analyze_face(frame_rgb)
            expression_history.append((elapsed, face.dominant_expression))
            eye_contact_history.append((elapsed, face.eye_contact))
        except Exception as e:
            log.debug("face_analysis error at t=%.1f: %s", elapsed, e)

        try:
            pose = analyze_pose(frame_rgb)
            posture_history.append((elapsed, pose.posture))
        except Exception as e:
            log.debug("pose_analysis error at t=%.1f: %s", elapsed, e)

        if (elapsed - last_sample_t >= FRAME_SAMPLE_INTERVAL
                and len(sampled_frames) < MAX_SAMPLE_FRAMES):
            sampled_frames.append(frame_bgr.copy())
            last_sample_t = elapsed

    return expression_history, posture_history, eye_contact_history, sampled_frames


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze")
async def analyze(
    audio: UploadFile = File(...),
    video: UploadFile = File(None),
):
    """
    Full analysis endpoint.
    - audio: required WAV file
    - video: optional AVI/MP4 file (enables face, pose, visual feedback)
    """
    with tempfile.TemporaryDirectory() as tmp:

        # ── Save uploads ─────────────────────────────────────────────────
        audio_path = os.path.join(tmp, "audio.wav")
        with open(audio_path, "wb") as f:
            shutil.copyfileobj(audio.file, f)

        video_path: str | None = None
        if video and video.filename:
            ext = os.path.splitext(video.filename)[1] or ".avi"
            video_path = os.path.join(tmp, f"video{ext}")
            with open(video_path, "wb") as f:
                shutil.copyfileobj(video.file, f)

        try:
            # ── 1. Audio ─────────────────────────────────────────────────
            # ── Check if audio file is actually a video ───────────────
            actual_audio_path = audio_path
            if _is_video_file(audio_path):
                log.info("Audio file appears to be video format - extracting audio")
                extracted = load_audio_from_video(audio_path)
                actual_audio_path = os.path.join(tmp, "extracted_audio.wav")
                sf.write(actual_audio_path, extracted, SAMPLE_RATE)

            (
                transcript,
                word_data,
                wpm_history,
                volume_history,
                pitch_history,
                avg_wpm,
                word_count,
                elapsed,
            ) = _process_audio(actual_audio_path)

            # ── 2. Filler words ──────────────────────────────────────────
            fd = FillerWordDetector()
            fd.update(transcript)
            filler_counts = fd.counts
            filler_count  = fd.total_count
            top_fillers   = fd.top_fillers()

            # ── 3. Video ─────────────────────────────────────────────────
            has_visual = bool(video_path)
            expression_history:  list[tuple[float, str]]  = []
            posture_history:     list[tuple[float, str]]  = []
            eye_contact_history: list[tuple[float, bool]] = []
            sampled_frames:      list[np.ndarray]         = []

            if video_path:
                (
                    expression_history,
                    posture_history,
                    eye_contact_history,
                    sampled_frames,
                ) = _analyze_video(video_path)

            # ── 4. Visual aggregates ─────────────────────────────────────
            unique_expressions  = len(set(e for _, e in expression_history))
            upright_count       = sum(1 for _, p in posture_history if p == "upright")
            posture_upright_pct = upright_count / max(1, len(posture_history))
            ec_count            = sum(1 for _, ec in eye_contact_history if ec)
            eye_contact_pct     = ec_count / max(1, len(eye_contact_history))

            # ── 5. Scores ────────────────────────────────────────────────
            scores = compute_scores(
                avg_wpm=avg_wpm,
                filler_count=filler_count,
                word_count=word_count,
                expression_variety=unique_expressions if has_visual else None,
                posture_upright_pct=posture_upright_pct if has_visual else None,
                eye_contact_pct=eye_contact_pct if has_visual else None,
                has_visual=has_visual,
                has_audio=True,
            )

            # ── 6. Speech quality + CEFR ─────────────────────────────────
            speech_quality = compute_speech_quality(
                wpm_history=wpm_history,
                volume_history=volume_history,
                pitch_history=pitch_history,
                word_data=word_data,
            )
            cefr_result = analyze_cefr(transcript)
            cefr_text   = format_cefr_report(cefr_result)

            # ── 7. AI feedback ───────────────────────────────────────────
            try:
                ai_feedback = generate_ai_feedback(
                    transcript=transcript,
                    scores=scores,
                    avg_wpm=avg_wpm,
                    filler_count=filler_count,
                    duration_seconds=elapsed,
                    top_fillers=top_fillers,
                    speech_quality=speech_quality,
                    has_visual=has_visual,
                    has_audio=True,
                )
            except Exception as e:
                ai_feedback = f"AI feedback unavailable: {e}"

            try:
                visual_feedback = generate_visual_feedback(
                    sampled_frames=sampled_frames,
                    scores=scores,
                    duration_seconds=elapsed,
                )
            except Exception as e:
                visual_feedback = f"Visual feedback unavailable: {e}"

            # ── 8. Charts (numpy RGB → base64 PNG) ───────────────────────
            charts = {
                "wpm":        _img_to_b64(create_wpm_chart(wpm_history)),
                "fillers":    _img_to_b64(create_filler_chart(filler_counts)),
                "volume":     _img_to_b64(create_volume_chart(volume_history)),
                "expression": _img_to_b64(create_expression_chart(expression_history)),
            }

            # ── 9. Response ───────────────────────────────────────────────
            sq = speech_quality
            return JSONResponse({
                "duration_seconds": round(elapsed, 1),
                "transcript":       transcript,
                "avg_wpm":          round(avg_wpm, 1),
                "word_count":       word_count,
                "filler_count":     filler_count,
                "filler_words":     filler_counts,
                "top_fillers":      top_fillers,
                "scores":           scores,
                "speech_quality": {
                    "wpm_std":              round(sq.wpm_std, 2),
                    "wpm_min":              round(sq.wpm_min, 1),
                    "wpm_max":              round(sq.wpm_max, 1),
                    "total_pauses":         sq.total_pauses,
                    "long_pauses":          sq.long_pauses,
                    "avg_pause_duration":   round(sq.avg_pause_duration, 2),
                    "max_pause_duration":   round(sq.max_pause_duration, 2),
                    "pitch_mean":           round(sq.pitch_mean, 1),
                    "pitch_std":            round(sq.pitch_std, 2),
                    "pitch_range":          round(sq.pitch_range, 1),
                    "volume_mean":          round(sq.volume_mean, 4),
                    "volume_std":           round(sq.volume_std, 4),
                    "avg_word_confidence":  round(sq.avg_word_confidence, 3),
                    "low_confidence_words": sq.low_confidence_words,
                },
                "visual": {
                    "eye_contact_pct":     round(eye_contact_pct, 3),
                    "posture_upright_pct": round(posture_upright_pct, 3),
                    "unique_expressions":  unique_expressions,
                } if has_visual else None,
                "cefr":       cefr_text,
                "cefr_level": cefr_result.get("overall_level", "Unknown"),
                "ai_feedback":     ai_feedback,
                "visual_feedback": visual_feedback,
                "charts": charts,
            })

        except Exception as e:
            log.exception("Analysis pipeline failed")
            raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)