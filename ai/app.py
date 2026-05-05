"""Gradio UI and session orchestration for speech practice."""

import logging
import time

logging.basicConfig(level=logging.INFO, format="%(name)s | %(message)s")
from dataclasses import dataclass, field
from pathlib import Path

import cv2
import numpy as np
import gradio as gr

from config import TIMER_INTERVAL, CAMERA_WIDTH, CAMERA_HEIGHT, FRAME_SAMPLE_INTERVAL, MAX_SAMPLE_FRAMES
from capture.camera import CameraCapture
from capture.microphone import MicrophoneCapture
from capture.session_recorder import SessionRecorder
from analysis.transcription import Transcriber
from analysis.filler_words import FillerWordDetector
from analysis.speech_metrics import SpeechMetrics
from analysis.face_analysis import analyze_face, FaceAnalysisResult
from analysis.pose_analysis import analyze_pose, PoseAnalysisResult
from feedback.realtime_overlay import draw_overlay
from feedback.charts import (
    create_wpm_chart, create_filler_chart,
    create_volume_chart, create_expression_chart,
)
from feedback.post_session import compute_scores, compute_speech_quality, generate_ai_feedback, generate_visual_feedback
from sessions.storage import (
    create_session_dir, save_session_metadata,
    list_sessions, delete_session, load_session_metadata,
)
from teleprompter.script_manager import (
    list_scripts, load_script, save_script, delete_script, generate_script,
)
from teleprompter.position_tracker import PositionTracker
from llm.ollama_client import is_ollama_available

from dataclasses import dataclass, field
from pathlib import Path
from typing import Literal

SessionMode = Literal["live_video", "live_audio", "upload_audio", "upload_video"]

# ---------------------------------------------------------------------------
# Session State
# ---------------------------------------------------------------------------

@dataclass
class SessionState:
    mode: SessionMode = "live_video"
    running: bool = False
    upload_path: str | None = None
    has_video: bool = False
    has_visual_analysis: bool = True
    """Mutable state for a practice session — only accessed from timer tick."""
    running: bool = False
    camera: CameraCapture | None = None
    microphone: MicrophoneCapture | None = None
    recorder: SessionRecorder | None = None
    transcriber: Transcriber | None = None
    filler_detector: FillerWordDetector | None = None
    speech_metrics: SpeechMetrics | None = None
    position_tracker: PositionTracker | None = None
    session_dir: Path | None = None
    # Latest analysis results
    face_result: FaceAnalysisResult = field(default_factory=FaceAnalysisResult)
    pose_result: PoseAnalysisResult = field(default_factory=PoseAnalysisResult)
    expression_history: list = field(default_factory=list)
    posture_history: list = field(default_factory=list)
    eye_contact_history: list = field(default_factory=list)
    # Cumulative audio for metrics
    all_audio_chunks: list = field(default_factory=list)
    # Sampled frames for vision model analysis
    sampled_frames: list = field(default_factory=list)
    last_sample_time: float = 0.0
    # Teleprompter dedup — skip Gradio DOM update when HTML hasn't changed
    last_teleprompter_html: str = ""


state = SessionState()


# ---------------------------------------------------------------------------
# Session Control
# ---------------------------------------------------------------------------

def start_session(script_text: str = ""):
    """Start a new practice session."""
    if state.running:
        return "Session already running"

    state.session_dir = create_session_dir()

    state.camera = CameraCapture()
    state.microphone = MicrophoneCapture()
    state.recorder = SessionRecorder(state.session_dir)
    state.transcriber = Transcriber()
    state.filler_detector = FillerWordDetector()
    state.speech_metrics = SpeechMetrics()
    state.position_tracker = PositionTracker()
    state.expression_history = []
    state.posture_history = []
    state.eye_contact_history = []
    state.all_audio_chunks = []
    state.sampled_frames = []
    state.last_sample_time = -FRAME_SAMPLE_INTERVAL  # capture first frame immediately

    if script_text and script_text.strip():
        state.position_tracker.set_script(script_text)

    # Start capture
    errors = []
    try:
        state.camera.start()
    except RuntimeError as e:
        errors.append(f"Camera: {e}")
        state.camera = None

    try:
        state.microphone.start()
    except Exception as e:
        errors.append(f"Microphone: {e}")
        state.microphone = None

    state.recorder.start()
    state.speech_metrics.start()
    state.running = True

    msg = "Session started!"
    if errors:
        msg += "\nWarnings: " + "; ".join(errors)
    return msg


def stop_session():
    """Stop the current session and generate report."""
    if not state.running:
        return ("No session running", None, None, None, None, "", "", "", "", "")

    state.running = False

    # Gather final metrics
    transcript = state.transcriber.full_transcript if state.transcriber else ""
    wpm_history = state.speech_metrics.wpm_history if state.speech_metrics else []
    volume_history = state.speech_metrics.volume_history if state.speech_metrics else []
    pitch_history = state.speech_metrics.pitch_history if state.speech_metrics else []
    filler_counts = state.filler_detector.counts if state.filler_detector else {}
    elapsed = state.speech_metrics.elapsed_seconds if state.speech_metrics else 0
    word_count = state.speech_metrics.word_count if state.speech_metrics else 0
    avg_wpm = state.speech_metrics.wpm if state.speech_metrics else 0
    filler_count = state.filler_detector.total_count if state.filler_detector else 0
    top_fillers = state.filler_detector.top_fillers() if state.filler_detector else []
    word_data = state.transcriber.word_data if state.transcriber else []

    # Count expression variety and posture
    unique_expressions = len(set(e for _, e in state.expression_history))
    upright_count = sum(1 for _, p in state.posture_history if p == "upright")
    posture_total = max(1, len(state.posture_history))
    posture_upright_pct = upright_count / posture_total
    ec_count = sum(1 for _, ec in state.eye_contact_history if ec)
    ec_total = max(1, len(state.eye_contact_history))
    eye_contact_pct = ec_count / ec_total

    # Stop capture
    if state.camera:
        state.camera.stop()
    if state.microphone:
        state.microphone.stop()
    if state.recorder:
        state.recorder.stop()

    # Compute scores
    scores = compute_scores(
        avg_wpm=avg_wpm,
        filler_count=filler_count,
        word_count=word_count,
        expression_variety=unique_expressions,
        posture_upright_pct=posture_upright_pct,
        eye_contact_pct=eye_contact_pct,
    )

    # Save metadata
    if state.session_dir:
        save_session_metadata(state.session_dir, {
            "date": time.strftime("%Y-%m-%d %H:%M:%S"),
            "duration_seconds": elapsed,
            "word_count": word_count,
            "avg_wpm": round(avg_wpm, 1),
            "filler_count": filler_count,
            "scores": scores,
            "transcript": transcript,
        })

    # Generate charts
    wpm_chart = create_wpm_chart(wpm_history)
    filler_chart = create_filler_chart(filler_counts)
    volume_chart = create_volume_chart(volume_history)
    expression_chart = create_expression_chart(state.expression_history)

    # Score text
    score_text = "\n".join(
        f"**{k.title()}**: {v}/100" for k, v in scores.items()
    )

    # Compute speech quality metrics for vocal analysis
    speech_quality = compute_speech_quality(
        wpm_history=wpm_history,
        volume_history=volume_history,
        pitch_history=pitch_history,
        word_data=word_data,
    )

    # CEFR vocabulary analysis
    from analysis.cefr_analyzer import analyze_cefr, format_cefr_report
    cefr_text = format_cefr_report(analyze_cefr(transcript))

    # AI feedback (may take a moment)
    try:
        ai_feedback = generate_ai_feedback(
            transcript=transcript,
            scores=scores,
            avg_wpm=avg_wpm,
            filler_count=filler_count,
            duration_seconds=elapsed,
            top_fillers=top_fillers,
            speech_quality=speech_quality,
        )
    except Exception as e:
        ai_feedback = f"AI feedback unavailable: {e}"

    # Visual feedback from video frames (vision model)
    try:
        visual_feedback = generate_visual_feedback(
            sampled_frames=state.sampled_frames,
            scores=scores,
            duration_seconds=elapsed,
        )
    except Exception as e:
        visual_feedback = f"Visual feedback unavailable: {e}"

    return (
        f"Session ended. Duration: {int(elapsed//60):02d}:{int(elapsed%60):02d}",
        wpm_chart, filler_chart, volume_chart, expression_chart,
        score_text, ai_feedback, visual_feedback, transcript, cefr_text,
    )

# ---------------------------------------------------------------------------
# Timer Tick — called every TIMER_INTERVAL seconds by gr.Timer
# ---------------------------------------------------------------------------

def timer_tick():
    """Main update loop: pull data, analyze, return UI updates."""
    if not state.running:
        # Return blank frame and empty metrics; preserve teleprompter (don't clear it)
        blank = np.zeros((CAMERA_HEIGHT, CAMERA_WIDTH, 3), dtype=np.uint8)
        return blank, "", _metrics_html(), gr.update()

    frame = None
    frame_rgb = None

    # 1. Get latest camera frame
    if state.camera and state.camera.is_running:
        frame = state.camera.get_latest_frame()

    if frame is None:
        frame = np.zeros((CAMERA_HEIGHT, CAMERA_WIDTH, 3), dtype=np.uint8)
        cv2.putText(frame, "No camera feed", (180, 240),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
    else:
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # 2. Drain audio
    audio_chunks = []
    if state.microphone and state.microphone.is_running:
        audio_chunks = state.microphone.drain()

    # Record audio
    if audio_chunks and state.recorder:
        combined = np.concatenate(audio_chunks)
        state.recorder.write_audio(combined)
        state.all_audio_chunks.extend(audio_chunks)

    # Record video frame
    if state.recorder and frame is not None:
        state.recorder.write_frame(frame)

    # 3. Face + pose analysis
    if frame_rgb is not None:
        try:
            state.face_result = analyze_face(frame_rgb)
            elapsed = state.speech_metrics.elapsed_seconds if state.speech_metrics else 0
            state.expression_history.append(
                (elapsed, state.face_result.dominant_expression)
            )
            state.eye_contact_history.append(
                (elapsed, state.face_result.eye_contact)
            )
        except Exception as e:
            print(f"[face_analysis] error: {e}")

        try:
            state.pose_result = analyze_pose(frame_rgb)
            elapsed = state.speech_metrics.elapsed_seconds if state.speech_metrics else 0
            state.posture_history.append(
                (elapsed, state.pose_result.posture)
            )
        except Exception as e:
            print(f"[pose_analysis] error: {e}")

    # 3b. Sample frames for vision model analysis
    if frame is not None and state.speech_metrics:
        elapsed = state.speech_metrics.elapsed_seconds
        if (elapsed - state.last_sample_time >= FRAME_SAMPLE_INTERVAL
                and len(state.sampled_frames) < MAX_SAMPLE_FRAMES):
            state.sampled_frames.append(frame.copy())
            state.last_sample_time = elapsed

    # 4. Transcription
    if audio_chunks and state.transcriber:
        state.transcriber.add_audio(audio_chunks)
    transcript_new = None
    if state.transcriber:
        transcript_new = state.transcriber.try_transcribe()

    # 5. Update metrics
    transcript = state.transcriber.full_transcript if state.transcriber else ""
    if state.speech_metrics:
        state.speech_metrics.update_from_transcript(transcript)
        if audio_chunks:
            combined = np.concatenate(audio_chunks)
            state.speech_metrics.update_from_audio(combined)

    if state.filler_detector:
        state.filler_detector.update(transcript)

    # 6. Update teleprompter position (skip DOM update if unchanged)
    teleprompter_update = gr.update()
    if state.position_tracker:
        transcriber = state.transcriber
        if transcriber:
            word_data = transcriber.word_data
            n_final = len(transcriber._final_word_data)
        else:
            word_data = []
            n_final = 0
        if word_data:
            logging.getLogger("app").info(
                "word_data len=%d, last 3: %s",
                len(word_data),
                [(w.word, w.conf) for w in word_data[-3:]],
            )
        state.position_tracker.update_words(word_data, n_final=n_final)
        script_html = state.position_tracker.get_script_html()
        if script_html and script_html != state.last_teleprompter_html:
            state.last_teleprompter_html = script_html
            teleprompter_update = script_html
            logging.getLogger("app").info(
                "HTML updated, pos=%d", state.position_tracker.position
            )

    # 7. Draw overlay on frame
    overlay_frame = draw_overlay(
        frame,
        wpm=state.speech_metrics.wpm if state.speech_metrics else 0,
        wpm_status=state.speech_metrics.wpm_status if state.speech_metrics else "...",
        filler_count=state.filler_detector.total_count if state.filler_detector else 0,
        volume=state.speech_metrics.volume if state.speech_metrics else 0,
        expression=state.face_result.dominant_expression,
        eye_contact=state.face_result.eye_contact,
        posture=state.pose_result.posture,
        gesture_openness=state.pose_result.gesture_openness,
        elapsed_seconds=state.speech_metrics.elapsed_seconds if state.speech_metrics else 0,
        is_recording=True,
    )

    # Convert BGR to RGB for Gradio display
    display_frame = cv2.cvtColor(overlay_frame, cv2.COLOR_BGR2RGB)

    # Format metrics into compact HTML
    wpm_text = f"{state.speech_metrics.wpm:.0f}" if state.speech_metrics else "0"
    filler_text = str(state.filler_detector.total_count) if state.filler_detector else "0"
    expression_text = state.face_result.dominant_expression
    eye_text = "Yes" if state.face_result.eye_contact else "No"
    posture_text = state.pose_result.posture
    openness_text = f"{int(state.pose_result.gesture_openness * 100)}%"
    elapsed = state.speech_metrics.elapsed_seconds if state.speech_metrics else 0
    elapsed_str = f"{int(elapsed//60):02d}:{int(elapsed%60):02d}"

    # Prepend elapsed time to WPM
    wpm_label = f"{wpm_text} ({elapsed_str})"

    metrics_html = _metrics_html(
        wpm=wpm_label, fillers=filler_text,
        expression=expression_text, eye_contact=eye_text,
        posture=posture_text, openness=openness_text,
    )

    return (
        display_frame, transcript, metrics_html,
        teleprompter_update,
    )


# ---------------------------------------------------------------------------
# Script Management Handlers
# ---------------------------------------------------------------------------

def on_load_script(name):
    if not name:
        return ""
    return load_script(name)


def on_save_script(name, content):
    if not name:
        return gr.update(), "Please enter a name"
    save_script(name, content)
    return gr.update(choices=list_scripts(), value=name), f"Saved '{name}'"


def on_delete_script(name):
    if not name:
        return gr.update(), ""
    delete_script(name)
    return gr.update(choices=list_scripts(), value=None), f"Deleted '{name}'"


def on_generate_script(topic, duration):
    if not topic:
        return "Please enter a topic"
    return generate_script(topic, int(duration))


def refresh_scripts():
    return gr.update(choices=list_scripts())


# ---------------------------------------------------------------------------
# Session History Handlers
# ---------------------------------------------------------------------------

def refresh_history():
    sessions = list_sessions()
    if not sessions:
        return "No sessions recorded yet."
    rows = []
    for s in sessions:
        date = s.get("date", "?")
        dur = s.get("duration_seconds", 0)
        dur_str = f"{int(dur//60):02d}:{int(dur%60):02d}"
        score = s.get("scores", {}).get("overall", "?")
        wpm = s.get("avg_wpm", "?")
        fillers = s.get("filler_count", "?")
        rows.append(f"| {date} | {dur_str} | {wpm} | {fillers} | {score}/100 |")
    header = "| Date | Duration | WPM | Fillers | Score |\n|---|---|---|---|---|\n"
    return header + "\n".join(rows)


def view_session_report(session_idx):
    sessions = list_sessions()
    if not sessions or session_idx is None or session_idx >= len(sessions):
        return "Select a session", "", ""
    s = sessions[int(session_idx)]
    scores = s.get("scores", {})
    score_text = "\n".join(f"**{k.title()}**: {v}/100" for k, v in scores.items())
    transcript = s.get("transcript", "No transcript available")
    return score_text, transcript, str(s.get("path", ""))


# ---------------------------------------------------------------------------
# Build Gradio UI
# ---------------------------------------------------------------------------

def _metrics_html(wpm="0", fillers="0", expression="...", eye_contact="...",
                   posture="...", openness="0%"):
    """Build compact HTML metrics bar."""
    def _pill(label, value, color="#60a5fa"):
        return (
            f'<div style="display:flex;flex-direction:column;align-items:center;'
            f'padding:4px 14px;min-width:80px">'
            f'<span style="font-size:.7rem;text-transform:uppercase;letter-spacing:.05em;'
            f'color:#9ca3af">{label}</span>'
            f'<span style="font-size:1.15rem;font-weight:700;color:{color}">{value}</span>'
            f'</div>'
        )
    return (
        '<div style="display:flex;justify-content:center;gap:6px;flex-wrap:wrap;'
        'background:linear-gradient(135deg,#1e293b,#1f2937);border-radius:10px;padding:8px 6px;'
        'font-family:Inter,system-ui,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,0.15)">'
        + _pill("WPM", wpm)
        + _pill("Fillers", fillers, "#f87171")
        + _pill("Expression", expression, "#a78bfa")
        + _pill("Eye Contact", eye_contact, "#34d399")
        + _pill("Posture", posture, "#fbbf24")
        + _pill("Openness", openness, "#38bdf8")
        + '</div>'
    )


def build_ui():
    theme = gr.themes.Soft(
        primary_hue="blue",
        secondary_hue="cyan",
        font=[gr.themes.GoogleFont("Inter"), "system-ui", "sans-serif"],
        font_mono=[gr.themes.GoogleFont("Roboto Mono"), "monospace"],
    )

    with gr.Blocks(theme=theme, title="Speech Practice", css="""
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap');
        .teleprompter-text { font-size: 1.6rem !important; line-height: 2 !important; padding: 10px !important; }
        .teleprompter-text * { font-size: 1.6rem !important; line-height: 2 !important; }
        .teleprompter-input textarea { font-size: 0.9rem !important; line-height: 1.4 !important; }
        .compact-btn { min-width: 0 !important; }
        .metric-bar { padding: 0 !important; }
        .metric-bar > div { padding: 0 !important; margin: 0 !important; }
        .gap-compact { gap: 8px !important; }
        #app-header {
            background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 60%, #38bdf8 100%);
            border-radius: 12px;
            padding: 20px 28px;
            margin-bottom: 16px;
            color: white;
        }
        #app-header h1 {
            margin: 0 !important;
            font-size: 1.8rem !important;
            font-weight: 700 !important;
            color: white !important;
            letter-spacing: -0.02em;
        }
        #app-header p {
            margin: 4px 0 0 0 !important;
            font-size: 0.95rem !important;
            color: rgba(255,255,255,0.8) !important;
            font-weight: 400;
        }
        .gradio-container { max-width: 100% !important; padding-left: 24px !important; padding-right: 24px !important; }
    """) as app:
        gr.HTML(
            '<div id="app-header">'
            '<h1>Speech Grading </h1>'
            '<p>Real-time feedback to public speaking skills</p>'
            '</div>'
        )

        with gr.Tabs() as tabs:
            # ============ Tab 1: Practice Session ============
            with gr.Tab("Practice", id="practice"):
                with gr.Row(equal_height=False):
                    with gr.Column(scale=3, min_width=400):
                        video_output = gr.Image(
                            label="Camera Feed",
                            height=400,
                            show_label=False,
                        )
                        metrics_display = gr.HTML(
                            value=_metrics_html(),
                            elem_classes=["metric-bar"],
                        )
                        with gr.Row(elem_classes=["gap-compact"]):
                            start_btn = gr.Button("Start Session", variant="primary", size="sm", scale=1)
                            stop_btn = gr.Button("Stop", variant="stop", size="sm", scale=1)
                            status_box = gr.Textbox(
                                value="Ready", interactive=False,
                                show_label=False, scale=2,
                                container=False,
                            )

                    with gr.Column(scale=2, min_width=300):
                        teleprompter_display = gr.HTML(
                            value="<p style='color:#9ca3af;font-style:italic;'>Load a script in the Scripts tab to use the teleprompter</p>",
                            label="Teleprompter",
                            elem_classes=["teleprompter-text"],
                            max_height=380,
                        )
                        scroll_speed = gr.Radio(
                            choices=["Off", "Slow", "Medium", "Fast"],
                            value="Off",
                            label="Scroll Speed",
                            interactive=True,
                        )
                        scroll_speed.change(
                            fn=None,
                            inputs=[scroll_speed],
                            js="""(val) => {
                                const speeds = { Off: 0, Slow: 0.3, Medium: 0.6, Fast: 1.2 };
                                window._tpSpeed = speeds[val] || 0;
                                console.log('[TP] Speed changed to:', val, '=', window._tpSpeed, 'px/tick');

                                // Start scroll loop once (idempotent)
                                if (!window._tpInterval) {
                                    window._tpInterval = setInterval(() => {
                                        if (window._tpSpeed <= 0) return;
                                        const tp = document.querySelector('.teleprompter-text');
                                        if (!tp) { console.log('[TP] .teleprompter-text not found'); return; }
                                        // Try children first
                                        for (const c of tp.querySelectorAll('*')) {
                                            if (c.scrollHeight > c.clientHeight + 1) {
                                                c.scrollTop += window._tpSpeed;
                                                console.log('[TP] scrolling', c.tagName, c.className, 'top=', Math.round(c.scrollTop));
                                                return;
                                            }
                                        }
                                        // Fallback: tp itself
                                        if (tp.scrollHeight > tp.clientHeight + 1) {
                                            tp.scrollTop += window._tpSpeed;
                                            console.log('[TP] scrolling tp, top=', Math.round(tp.scrollTop));
                                        } else {
                                            console.log('[TP] nothing scrollable. tp scroll/client:', tp.scrollHeight, tp.clientHeight);
                                        }
                                    }, 30);
                                    console.log('[TP] scroll loop started');
                                }
                            }""",
                        )
                        script_for_session = gr.Textbox(
                            label="Paste script (or load from Scripts tab)",
                            lines=2, placeholder="Enter your speech script...",
                            elem_classes=["teleprompter-input"],
                        )

                transcript_display = gr.Textbox(
                    label="Live Transcript",
                    lines=2, interactive=False, max_lines=4,
                    placeholder="Start speaking...",
                )

                # Timer for real-time updates
                timer = gr.Timer(value=TIMER_INTERVAL, active=True)
                timer.tick(
                    fn=timer_tick,
                    outputs=[
                        video_output, transcript_display,
                        metrics_display,
                        teleprompter_display,
                    ],
                    concurrency_limit=1,
                    concurrency_id="live_tick",
                )

                start_btn.click(
                    fn=start_session,
                    inputs=[script_for_session],
                    outputs=[status_box],
                )

            # ============ Tab 2: Post-Session Report ============
            with gr.Tab("Report", id="report"):
                report_status = gr.Textbox(label="Status", interactive=False, max_lines=1)

                with gr.Row():
                    with gr.Column(scale=2, min_width=350):
                        gr.Markdown("#### Video Feedback")
                        visual_feedback_display = gr.Markdown("")
                    with gr.Column(scale=1, min_width=200):
                        gr.Markdown("#### Scores")
                        scores_display = gr.Markdown("")

                with gr.Accordion("AI Feedback", open=True):
                    ai_feedback_display = gr.Markdown("")

                with gr.Accordion("Charts", open=False):
                    with gr.Row():
                        wpm_chart = gr.Image(label="WPM Over Time", show_label=True)
                        filler_chart = gr.Image(label="Filler Words", show_label=True)
                    with gr.Row():
                        volume_chart = gr.Image(label="Volume Over Time", show_label=True)
                        expression_chart = gr.Image(label="Expression Timeline", show_label=True)

                with gr.Accordion("Transcript", open=False):
                    report_transcript = gr.Textbox(label="Transcript", lines=6, interactive=False)
                
                
                with gr.Accordion("Vocabulary Level (CEFR)", open=True):
                    cefr_display = gr.Markdown("")

                stop_btn.click(
                    fn=stop_session,
                    outputs=[
                        report_status,
                        wpm_chart, filler_chart, volume_chart, expression_chart,
                        scores_display, ai_feedback_display, visual_feedback_display, cefr_display,
                        report_transcript,
                    ],
                ).then(
                    fn=lambda: gr.Tabs(selected="report"),
                    outputs=[tabs],
                )

            # ============ Tab 3: Scripts ============
            with gr.Tab("Scripts", id="scripts"):
                with gr.Row():
                    with gr.Column(scale=1, min_width=200):
                        script_dropdown = gr.Dropdown(
                            choices=list_scripts(),
                            label="Saved Scripts",
                            interactive=True,
                        )
                        with gr.Row(elem_classes=["gap-compact"]):
                            load_btn = gr.Button("Load", size="sm")
                            delete_script_btn = gr.Button("Del", variant="stop", size="sm")
                            refresh_btn = gr.Button("Refresh", size="sm")
                        script_status = gr.Textbox(label="Status", interactive=False)

                    with gr.Column(scale=2, min_width=350):
                        script_name_input = gr.Textbox(label="Script Name", placeholder="my-speech")
                        script_editor = gr.Textbox(label="Script Content", lines=12, placeholder="Write or paste your speech here...")
                        save_btn = gr.Button("Save Script", variant="primary", size="sm")

                with gr.Accordion("AI Script Generator", open=False):
                    with gr.Row():
                        topic_input = gr.Textbox(label="Topic", placeholder="e.g., The importance of renewable energy", scale=3)
                        duration_input = gr.Slider(label="Duration (min)", minimum=1, maximum=30, value=5, step=1, scale=1)
                    generate_btn = gr.Button("Generate Script", variant="primary", size="sm")

                load_btn.click(fn=on_load_script, inputs=[script_dropdown], outputs=[script_editor])
                save_btn.click(fn=on_save_script, inputs=[script_name_input, script_editor], outputs=[script_dropdown, script_status])
                delete_script_btn.click(fn=on_delete_script, inputs=[script_dropdown], outputs=[script_dropdown, script_status])
                refresh_btn.click(fn=refresh_scripts, outputs=[script_dropdown])
                generate_btn.click(fn=on_generate_script, inputs=[topic_input, duration_input], outputs=[script_editor])

            # ============ Tab 4: Session History ============
            with gr.Tab("History", id="history"):
                with gr.Row():
                    refresh_history_btn = gr.Button("Refresh", size="sm", scale=0)
                    session_idx_input = gr.Number(label="Session # (0 = newest)", value=0, precision=0, scale=1)
                    view_btn = gr.Button("View", size="sm", scale=0)
                history_display = gr.Markdown("Click refresh to load sessions")
                refresh_history_btn.click(fn=refresh_history, outputs=[history_display])

                with gr.Row():
                    hist_scores = gr.Markdown("")
                    hist_transcript = gr.Textbox(label="Transcript", lines=6, interactive=False)
                hist_path = gr.Textbox(label="Session Path", interactive=False, visible=False)
                view_btn.click(
                    fn=view_session_report,
                    inputs=[session_idx_input],
                    outputs=[hist_scores, hist_transcript, hist_path],
                )

    return app


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    app = build_ui()
    app.launch(
        server_name="127.0.0.1",
        server_port=7860,
        share=False,
        show_error=True,
    )


if __name__ == "__main__":
    main()
