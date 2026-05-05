"""Session folder management and metadata."""

import json
from datetime import datetime
from pathlib import Path

from config import SESSIONS_DIR


def create_session_dir() -> Path:
    """Create a new session directory with timestamp-based name."""
    SESSIONS_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    session_dir = SESSIONS_DIR / timestamp
    session_dir.mkdir(parents=True, exist_ok=True)
    return session_dir


def save_session_metadata(session_dir: Path, metadata: dict):
    """Save session metadata to JSON."""
    meta_path = session_dir / "metadata.json"
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2, default=str)


def load_session_metadata(session_dir: Path) -> dict | None:
    """Load session metadata from JSON."""
    meta_path = session_dir / "metadata.json"
    if not meta_path.exists():
        return None
    with open(meta_path) as f:
        return json.load(f)


def list_sessions() -> list[dict]:
    """List all sessions with their metadata, newest first."""
    if not SESSIONS_DIR.exists():
        return []
    sessions = []
    for d in sorted(SESSIONS_DIR.iterdir(), reverse=True):
        if d.is_dir():
            meta = load_session_metadata(d)
            if meta:
                meta["path"] = str(d)
                sessions.append(meta)
    return sessions


def delete_session(session_dir: Path):
    """Delete a session directory and all its contents."""
    import shutil
    if session_dir.exists() and session_dir.is_dir():
        shutil.rmtree(session_dir)
