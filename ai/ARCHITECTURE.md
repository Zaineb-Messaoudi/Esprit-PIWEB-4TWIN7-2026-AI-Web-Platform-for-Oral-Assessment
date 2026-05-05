# Architecture

This document describes the internal architecture of Speech Practice, including module responsibilities, data flow, and key design decisions.

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   Gradio Web UI (app.py)                    │
│  Practice Tab │ Report Tab │ Scripts Tab │ History Tab       │
└──────────┬──────────────────────────────────────────────────┘
           │
     ┌─────┼─────────┬──────────────┬────────────┐
     │     │         │              │            │
     ▼     ▼         ▼              ▼            ▼
  Capture  Analysis  Feedback   Teleprompter    LLM
  Module   Module    Module      Module        Module
     │     │         │              │            │
     ▼     ▼         ▼              ▼            ▼
  Camera   MediaPipe Charts &    Script       Ollama
  Mic      Vosk      Overlay    Position      REST API
  Recorder Filler    Scoring    Tracking
```

The application follows a **capture → analyze → feedback** pipeline, driven by a Gradio timer that ticks every 150ms (~7 Hz).

## Module Details

### Capture (`capture/`)

Handles real-time hardware I/O using background threads with queue-based buffering.

| File | Class | Responsibility |
|------|-------|----------------|
| `camera.py` | `CameraCapture` | Threaded OpenCV webcam capture at 30fps. Queue-based frame buffer (max 2) with thread-safe latest-frame access. |
| `microphone.py` | `MicrophoneCapture` | Threaded sounddevice audio stream at 16 kHz mono. Callback-based chunk streaming (0.5s chunks = 8000 samples). Auto-drops oldest chunks to prevent lag. |
| `session_recorder.py` | `SessionRecorder` | Writes audio to WAV (16-bit PCM) and video to AVI (MJPEG, 10fps). Thread-safe file I/O with locks. |

**Design decision:** Camera and microphone run in dedicated threads to avoid blocking the UI timer loop. Small queue sizes (2 frames, bounded audio) ensure the UI always processes the most recent data rather than falling behind.

### Analysis (`analysis/`)

Extracts insights from raw capture data. All analyzers are stateful and designed for incremental/streaming updates.

| File | Class/Function | Responsibility |
|------|----------------|----------------|
| `transcription.py` | `Transcriber` | Real-time speech-to-text using Vosk KaldiRecognizer. Produces `WordInfo` objects with word, confidence (0-1), start time, and end time. Maintains both finalized and partial (in-progress) results. |
| `speech_metrics.py` | `SpeechMetrics` | Calculates WPM (from word count / elapsed time), volume (RMS energy), and pitch (autocorrelation-based F0, throttled to 1Hz). All metrics stored as `(timestamp, value)` tuples for charting. |
| `filler_words.py` | `FillerWordDetector` | Scans new transcript text for 17 configured filler words. Maintains per-filler counts. Incremental — only processes text added since last update. |
| `face_analysis.py` | `analyze_face()` | MediaPipe FaceLandmarker with 478 landmarks. Detects expressions (happy, surprised, angry, neutral) via blendshape weights. Eye contact estimated from nose-center proximity. |
| `pose_analysis.py` | `analyze_pose()` | MediaPipe PoseLandmarker with 33 body landmarks. Classifies posture (upright/slouching) from head-shoulder distance. Measures gesture openness from wrist spread relative to shoulder width. |
| `model_downloader.py` | `ensure_model()` | Auto-downloads MediaPipe model files from Google storage on first use. Caches in `data/models/`. |

**Design decision:** MediaPipe models are lazily initialized on the first frame to avoid startup delay. They run in VIDEO mode with monotonic timestamps for optimal performance on sequential frames.

### Feedback (`feedback/`)

Generates both real-time visual feedback and post-session reports.

| File | Class/Function | Responsibility |
|------|----------------|----------------|
| `realtime_overlay.py` | `draw_overlay()` | Renders a heads-up display on the camera frame using OpenCV. Left panel: WPM, fillers, volume bar, duration. Right panel: expression, eye contact, posture, gesture openness. Color-coded (green/yellow/red). |
| `charts.py` | `create_*_chart()` | Generates four matplotlib charts: WPM over time (with target zone band), filler word bar chart, volume area chart, and expression timeline scatter plot. Dark theme, rendered to numpy RGB arrays. |
| `post_session.py` | `compute_scores()` | Calculates 0-100 scores across 5 dimensions with weighted overall: Pace (25%), Clarity (30%), Expression (20%), Posture (25%). |
| `post_session.py` | `compute_speech_quality()` | Produces `SpeechQualityMetrics`: WPM variation, pitch analysis, volume dynamics, pause detection (including long pauses >2s), and articulation quality (avg word confidence). |
| `post_session.py` | `generate_ai_feedback()` | Sends session data to Ollama llama3 for personalized coaching: strengths, speech quality, areas for improvement, and exercises. |
| `post_session.py` | `generate_visual_feedback()` | Sends 1-6 sampled frames to Ollama llava for body language, gesture, and presence analysis. |

### Teleprompter (`teleprompter/`)

Manages scripts and tracks the speaker's position through the text in real time.

| File | Class | Responsibility |
|------|-------|----------------|
| `script_manager.py` | (functions) | CRUD operations for scripts stored as `.txt` files in `data/scripts/`. AI script generation via Ollama (calculates word count from duration at 140 WPM). |
| `position_tracker.py` | `PositionTracker` | Fuzzy word matching using rapidfuzz (60% similarity threshold). Tracks current position, handles skip-ahead detection (checks 3 words ahead), and marks mispronunciations (<85% match). Generates HTML with color-coded progress: gray (spoken), blue highlight (current), red underline (mispronounced), normal (upcoming). |

**Design decision:** Fuzzy matching is essential because ASR output rarely matches the script verbatim. The skip-ahead window of 3 words handles cases where the speaker speeds up or the recognizer drops words. Partial word snapshots allow rollback when interim Vosk results change.

### LLM (`llm/`)

| File | Class/Function | Responsibility |
|------|----------------|----------------|
| `ollama_client.py` | `generate()` | Calls Ollama `/api/generate` REST endpoint. Non-streaming mode. Default model: llama3. |
| `ollama_client.py` | `generate_with_images()` | Sends base64-encoded images to vision-capable model. Default: llava. 180s timeout. |
| `ollama_client.py` | `is_ollama_available()` | Health check against Ollama API. Graceful degradation if unavailable. |

### Sessions (`sessions/`)

| File | Class/Function | Responsibility |
|------|----------------|----------------|
| `storage.py` | (functions) | Creates timestamped session directories (`YYYYMMDD_HHMMSS`). Saves/loads JSON metadata (date, duration, word count, WPM, filler count, scores, transcript). Lists sessions sorted newest-first. |

## Session Lifecycle

### 1. Start (`start_session`)

```
User clicks "Start Session"
  ├─ Create session directory (data/sessions/YYYYMMDD_HHMMSS/)
  ├─ Initialize CameraCapture → start thread
  ├─ Initialize MicrophoneCapture → start stream
  ├─ Initialize SessionRecorder → open WAV + AVI files
  ├─ Initialize Transcriber → load Vosk model
  ├─ Initialize FillerWordDetector, SpeechMetrics
  ├─ Initialize PositionTracker (if script provided)
  └─ Set state.running = True
```

### 2. Processing Loop (`timer_tick`, every 150ms)

```
Timer fires
  │
  ├─ CAPTURE
  │   ├─ camera.get_latest_frame() → BGR frame
  │   └─ microphone.drain() → list of audio chunks
  │
  ├─ RECORD
  │   ├─ recorder.write_frame(frame)
  │   └─ recorder.write_audio(chunks)
  │
  ├─ ANALYZE
  │   ├─ analyze_face(frame) → expression, eye_contact
  │   ├─ analyze_pose(frame) → posture, gesture_openness
  │   ├─ transcriber.add_audio(chunks) → word_data
  │   ├─ speech_metrics.update(transcript, audio)
  │   └─ filler_detector.update(transcript)
  │
  ├─ TELEPROMPTER
  │   └─ position_tracker.update_words(word_data) → HTML
  │
  ├─ SAMPLE (every 30s, max 6 frames for vision model)
  │
  └─ RENDER
      └─ draw_overlay(frame, metrics) → annotated frame
```

### 3. Stop (`stop_session`)

```
User clicks "Stop Session"
  ├─ Stop camera, microphone, recorder threads
  │
  ├─ AGGREGATE
  │   ├─ compute_speech_quality() → pitch, pauses, articulation
  │   ├─ compute_scores() → pace, clarity, expression, posture, overall
  │   └─ save_session_metadata()
  │
  ├─ VISUALIZE
  │   ├─ create_wpm_chart()
  │   ├─ create_filler_chart()
  │   ├─ create_volume_chart()
  │   └─ create_expression_chart()
  │
  ├─ AI FEEDBACK
  │   ├─ generate_ai_feedback() → llama3 text analysis
  │   └─ generate_visual_feedback() → llava frame analysis
  │
  └─ Return results to Report tab
```

## Scoring System

| Metric | Weight | Calculation |
|--------|--------|-------------|
| **Pace** | 25% | Proximity to 120-160 WPM target range |
| **Clarity** | 30% | `100 - (filler_rate × 15)` — penalizes filler word density |
| **Expression** | 20% | Expression variety + eye contact percentage |
| **Posture** | 25% | Percentage of frames classified as "upright" |
| **Overall** | — | Weighted average of the above |

## Threading Model

```
Main Thread (Gradio UI)
  │
  ├─ Timer callback (150ms) ──── processes frames + audio
  │
  ├─ Camera Thread ─────────────── OpenCV capture → frame queue (max 2)
  │
  └─ Microphone Thread ─────────── sounddevice callback → audio queue
```

The main thread drains both queues on each timer tick. Small queue sizes ensure the UI always works with the most recent data. Locks protect file I/O in the session recorder.

## Key Design Decisions

1. **Queue-based capture** — Decouples hardware I/O from processing. Prevents frame drops from blocking analysis and keeps latency predictable.

2. **Incremental analysis** — All analyzers (transcriber, filler detector, metrics) process only new data since the last update. This keeps each timer tick fast (~20-50ms).

3. **Lazy model loading** — MediaPipe models initialize on first frame, Vosk model on first session start. Avoids a 5-10 second startup delay.

4. **Graceful Ollama degradation** — AI feedback is optional. If Ollama isn't running, the app still provides real-time metrics, scores, and charts.

5. **Local-first privacy** — Vosk and MediaPipe run entirely offline. Ollama runs locally. No data is sent to external services.

6. **Frame sampling for vision** — Instead of sending all frames to the vision model, only 6 frames sampled at 30-second intervals are used. This keeps inference time reasonable (~30s vs minutes).
