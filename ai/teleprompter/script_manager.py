"""Load, save, and generate scripts via Ollama."""

from pathlib import Path

from config import SCRIPTS_DIR
from llm.ollama_client import generate


def list_scripts() -> list[str]:
    """List all saved script filenames."""
    SCRIPTS_DIR.mkdir(parents=True, exist_ok=True)
    return sorted(f.stem for f in SCRIPTS_DIR.glob("*.txt"))


def load_script(name: str) -> str:
    """Load a script by name."""
    path = SCRIPTS_DIR / f"{name}.txt"
    if path.exists():
        return path.read_text(encoding="utf-8")
    return ""


def save_script(name: str, content: str):
    """Save a script to disk."""
    SCRIPTS_DIR.mkdir(parents=True, exist_ok=True)
    path = SCRIPTS_DIR / f"{name}.txt"
    path.write_text(content, encoding="utf-8")


def delete_script(name: str):
    """Delete a script."""
    path = SCRIPTS_DIR / f"{name}.txt"
    if path.exists():
        path.unlink()


def generate_script(topic: str, duration_minutes: int = 5) -> str:
    """Use Ollama to generate a speech script on a topic."""
    word_count = duration_minutes * 140  # ~140 WPM target
    prompt = (
        f"Write a {duration_minutes}-minute speech (approximately {word_count} words) "
        f"on the topic: {topic}\n\n"
        f"The speech should have:\n"
        f"- A strong opening hook\n"
        f"- Clear structure with 2-3 main points\n"
        f"- Transitions between sections\n"
        f"- A memorable conclusion\n\n"
        f"Write ONLY the speech text, no stage directions or notes."
    )
    return generate(
        prompt,
        system="You are a professional speechwriter. Write clear, engaging speeches.",
    )
