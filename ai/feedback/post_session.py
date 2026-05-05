"""Post-session aggregation and AI feedback via Ollama."""

from dataclasses import dataclass, field

import cv2
import numpy as np

from config import TARGET_WPM_LOW, TARGET_WPM_HIGH, OLLAMA_VISION_MODEL
from llm.ollama_client import (
    generate, generate_with_images,
    is_ollama_available, is_vision_model_available,
)
from analysis.cefr_analyzer import analyze_cefr, format_cefr_report


@dataclass
class SpeechQualityMetrics:
    """Aggregated speech quality metrics computed from raw session data."""
    # Pace variation
    wpm_std: float = 0.0  # standard deviation of WPM over time
    wpm_min: float = 0.0
    wpm_max: float = 0.0
    # Pauses
    total_pauses: int = 0  # pauses > 0.5s
    long_pauses: int = 0   # pauses > 2.0s
    avg_pause_duration: float = 0.0
    max_pause_duration: float = 0.0
    # Pitch / intonation
    pitch_mean: float = 0.0
    pitch_std: float = 0.0  # higher = more vocal variety
    pitch_min: float = 0.0
    pitch_max: float = 0.0
    pitch_range: float = 0.0
    # Volume / projection
    volume_mean: float = 0.0
    volume_std: float = 0.0
    volume_min: float = 0.0
    volume_max: float = 0.0
    # Word confidence (proxy for clarity/articulation)
    avg_word_confidence: float = 0.0
    low_confidence_words: list[str] = field(default_factory=list)  # words with conf < 0.7


def compute_speech_quality(
    wpm_history: list[tuple[float, float]],
    volume_history: list[tuple[float, float]],
    pitch_history: list[tuple[float, float]],
    word_data: list,  # list of WordInfo(word, conf, start, end)
) -> SpeechQualityMetrics:
    """Compute speech quality metrics from raw session data."""
    m = SpeechQualityMetrics()

    # WPM variation
    if len(wpm_history) >= 2:
        wpms = [w for _, w in wpm_history]
        m.wpm_std = float(np.std(wpms))
        m.wpm_min = min(wpms)
        m.wpm_max = max(wpms)

    # Pitch / intonation
    if len(pitch_history) >= 2:
        pitches = [p for _, p in pitch_history]
        m.pitch_mean = float(np.mean(pitches))
        m.pitch_std = float(np.std(pitches))
        m.pitch_min = min(pitches)
        m.pitch_max = max(pitches)
        m.pitch_range = m.pitch_max - m.pitch_min

    # Volume / projection
    if len(volume_history) >= 2:
        # Filter out silence (very low RMS)
        vols = [v for _, v in volume_history if v > 0.005]
        if vols:
            m.volume_mean = float(np.mean(vols))
            m.volume_std = float(np.std(vols))
            m.volume_min = min(vols)
            m.volume_max = max(vols)

    # Pauses (from word-level timestamps)
    if len(word_data) >= 2:
        pause_durations = []
        for i in range(1, len(word_data)):
            gap = word_data[i].start - word_data[i - 1].end
            if gap > 0.5:
                pause_durations.append(gap)
        m.total_pauses = len(pause_durations)
        m.long_pauses = sum(1 for d in pause_durations if d > 2.0)
        if pause_durations:
            m.avg_pause_duration = float(np.mean(pause_durations))
            m.max_pause_duration = max(pause_durations)

    # Word confidence (articulation proxy)
    if word_data:
        confs = [w.conf for w in word_data if w.conf > 0]
        if confs:
            m.avg_word_confidence = float(np.mean(confs))
        m.low_confidence_words = [
            w.word for w in word_data if 0 < w.conf < 0.7
        ][:10]  # top 10 unclear words

    return m


def compute_scores(
    avg_wpm: float,
    filler_count: int,
    word_count: int,
    expression_variety: int | None,
    posture_upright_pct: float | None,
    eye_contact_pct: float | None,
    has_visual: bool = True,
    has_audio: bool = True,
) -> dict[str, int | None]:
    """Compute 0-100 scores for various categories."""
    scores = {}

    # Pace and clarity need usable audio/transcript input.
    if has_audio:
        ideal_mid = (TARGET_WPM_LOW + TARGET_WPM_HIGH) / 2
        if TARGET_WPM_LOW <= avg_wpm <= TARGET_WPM_HIGH:
            scores["pace"] = 90 + int(10 * (1 - abs(avg_wpm - ideal_mid) / ideal_mid))
        else:
            deviation = min(abs(avg_wpm - TARGET_WPM_LOW), abs(avg_wpm - TARGET_WPM_HIGH))
            scores["pace"] = max(20, 80 - int(deviation))

        if word_count > 0:
            filler_rate = filler_count / word_count * 100
            scores["clarity"] = max(20, 100 - int(filler_rate * 15))
        else:
            scores["clarity"] = 50
    else:
        scores["pace"] = None
        scores["clarity"] = None

    # Expression score
    if has_visual and expression_variety is not None and eye_contact_pct is not None:
        scores["expression"] = min(
            100,
            40 + expression_variety * 20 + int(eye_contact_pct * 30),
        )
    else:
        scores["expression"] = None

    # Posture score
    if has_visual and posture_upright_pct is not None:
        scores["posture"] = max(20, int(posture_upright_pct * 100))
    else:
        scores["posture"] = None

    # Overall
    if has_visual and has_audio:
        weights = {"pace": 0.25, "clarity": 0.30, "expression": 0.20, "posture": 0.25}
    elif has_visual:
        weights = {"expression": 0.50, "posture": 0.50}
    else:
        weights = {"pace": 0.50, "clarity": 0.50}
    scores["overall"] = int(sum((scores[k] or 0) * weights[k] for k in weights))

    # Clamp all to 0-100
    clamped: dict[str, int | None] = {}
    for key, value in scores.items():
        clamped[key] = value if value is None else max(0, min(100, value))
    return clamped


def generate_ai_feedback(
    transcript: str,
    scores: dict[str, int | None],
    avg_wpm: float,
    filler_count: int,
    duration_seconds: float,
    top_fillers: list[tuple[str, int]],
    speech_quality: SpeechQualityMetrics | None = None,
    has_visual: bool = True,
    has_audio: bool = True,
) -> str:
    """Use Ollama to generate AI feedback on the session."""
    if not is_ollama_available():
        return (
            "AI feedback unavailable (Ollama not running).\n\n"
            "Start Ollama with `ollama serve` and ensure llama3 is pulled."
        )

    filler_str = ", ".join(f'"{w}" ({c}x)' for w, c in top_fillers) if top_fillers else "none detected"
    duration_min = duration_seconds / 60

    # Build speech quality section
    sq_section = ""
    if speech_quality:
        sq = speech_quality
        sq_section = f"""
Speech Quality Analysis:
- Pace variation: WPM ranged from {sq.wpm_min:.0f} to {sq.wpm_max:.0f} (std dev: {sq.wpm_std:.1f}) — {"monotonous pacing" if sq.wpm_std < 5 else "good pace variation" if sq.wpm_std < 20 else "erratic pacing"}
- Pauses: {sq.total_pauses} pauses detected (>{0.5}s), {sq.long_pauses} long pauses (>2s), longest pause: {sq.max_pause_duration:.1f}s, avg pause: {sq.avg_pause_duration:.1f}s
- Vocal variety (pitch): mean {sq.pitch_mean:.0f} Hz, range {sq.pitch_range:.0f} Hz (std dev: {sq.pitch_std:.1f}) — {"monotone delivery" if sq.pitch_std < 10 else "good vocal variety" if sq.pitch_std < 40 else "highly expressive intonation"}
- Voice projection (volume): mean RMS {sq.volume_mean:.4f}, variation {sq.volume_std:.4f} — {"very consistent volume" if sq.volume_std < 0.005 else "good dynamic range" if sq.volume_std < 0.02 else "highly variable volume"}
- Articulation clarity: avg word confidence {sq.avg_word_confidence:.0%}{f' — words that were unclear: {", ".join(sq.low_confidence_words)}' if sq.low_confidence_words else " — all words clearly articulated"}
"""

    # CEFR vocabulary analysis
    cefr_result = analyze_cefr(transcript)
    cefr_section = format_cefr_report(cefr_result)
    expression_score = "N/A" if scores.get("expression") is None else f"{scores['expression']}/100"
    posture_score = "N/A" if scores.get("posture") is None else f"{scores['posture']}/100"
    pace_score = "N/A" if scores.get("pace") is None else f"{scores['pace']}/100"
    clarity_score = "N/A" if scores.get("clarity") is None else f"{scores['clarity']}/100"
    visual_note = (
        "- Visual/body-language metrics were unavailable for this audio-only session.\n"
        if not has_visual else ""
    )
    audio_note = (
        "- Vocal/audio metrics were unavailable because the uploaded video had no usable audio track.\n"
        if not has_audio else ""
    )

    prompt = f"""Analyze this speech practice session and provide constructive feedback.

Session Summary:
- Duration: {duration_min:.1f} minutes
- Average pace: {avg_wpm:.0f} WPM (target: {TARGET_WPM_LOW}-{TARGET_WPM_HIGH})
- Filler words used: {filler_count} total — top fillers: {filler_str}
- Scores: Pace {pace_score}, Clarity {clarity_score}, Expression {expression_score}, Posture {posture_score}, Overall {scores.get('overall', 0)}/100
{visual_note}\
{audio_note}\
{sq_section}
Vocabulary Level (CEFR):
{cefr_section}

Transcript:
{transcript[:3000]}

Provide:
1. **Strengths** — 2-3 specific things done well
2. **Speech Quality** — feedback on vocal variety, intonation, pacing rhythm, use of pauses, volume/projection, and articulation clarity
3. **Vocabulary Level** — comment on the CEFR level and suggest ways to enrich vocabulary
4. **Areas for Improvement** — 2-3 specific areas with actionable tips
5. **Exercise** — one exercise to practice before the next session

Keep the feedback encouraging, specific, and actionable. Format with clear headings."""

    return generate(
        prompt,
        system="You are an expert public speaking and vocal coach. Give concise, actionable feedback on both content delivery and vocal quality (intonation, pacing, pauses, projection, articulation).",
        timeout=None,
    )


def _encode_frames_as_jpeg(frames: list[np.ndarray]) -> list[bytes]:
    """Encode BGR numpy frames to JPEG bytes for the vision model."""
    encoded = []
    for frame in frames:
        success, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        if success:
            encoded.append(buf.tobytes())
    return encoded


def generate_visual_feedback(
    sampled_frames: list[np.ndarray],
    scores: dict[str, int | None],
    duration_seconds: float,
) -> str:
    """Use a vision-capable Ollama model to analyze video frames from the session.

    Args:
        sampled_frames: List of BGR frames sampled at intervals during the session.
        scores: Score dict from compute_scores().
        duration_seconds: Total session duration.
    """
    if not sampled_frames:
        return "No video frames were captured during this session."

    if not is_ollama_available():
        return (
            "Visual feedback unavailable (Ollama not running).\n\n"
            "Start Ollama with `ollama serve` and ensure the vision model is pulled."
        )

    if not is_vision_model_available():
        return (
            f"Visual feedback unavailable (model `{OLLAMA_VISION_MODEL}` not found).\n\n"
            f"Pull it with: `ollama pull {OLLAMA_VISION_MODEL}`"
        )

    image_bytes = _encode_frames_as_jpeg(sampled_frames)
    if not image_bytes:
        return "Failed to encode video frames for analysis."

    n = len(image_bytes)
    duration_min = duration_seconds / 60

    expression_score = "N/A" if scores.get("expression") is None else f"{scores['expression']}/100"
    posture_score = "N/A" if scores.get("posture") is None else f"{scores['posture']}/100"

    prompt = f"""You are reviewing {n} frames sampled evenly from a {duration_min:.1f}-minute speech practice session.
The speaker's metric scores were: Pace {scores.get('pace', 0)}/100, Clarity {scores.get('clarity', 0)}/100, Expression {expression_score}, Posture {posture_score}.

Analyze these images and provide feedback on:
1. **Body Language** — posture, stance, shoulder tension, how the speaker holds themselves
2. **Gestures** — hand movements, whether they appear natural or stiff, use of space
3. **Facial Expressions** — engagement, energy, whether expressions match the speaking context
4. **Eye Contact & Gaze** — where the speaker appears to be looking, camera engagement
5. **Overall Presence** — confidence level, stage presence, visual distractions (if any)

For each point, be specific about what you observe in the frames and give one actionable tip to improve.
Keep the tone encouraging and constructive. Format with clear headings."""

    return generate_with_images(
        prompt=prompt,
        images=image_bytes,
        system="You are an expert public speaking coach specializing in non-verbal communication and visual presence. Analyze the speaker's video frames and give specific, actionable visual feedback.",
        timeout=None,
    )
