"""Bootstrap: choose a project venv, install dependencies, and launch the app."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent
REQUIREMENTS = PROJECT_ROOT / "requirements.txt"


def _venv_paths(venv_dir: Path) -> tuple[Path, Path]:
    """Return Python and pip paths for a virtual environment."""
    if sys.platform == "win32":
        return (
            venv_dir / "Scripts" / "python.exe",
            venv_dir / "Scripts" / "pip.exe",
        )
    return (
        venv_dir / "bin" / "python",
        venv_dir / "bin" / "pip",
    )


def _is_running_inside_venv() -> bool:
    return sys.prefix != getattr(sys, "base_prefix", sys.prefix)


def choose_environment() -> tuple[Path | None, Path, Path]:
    """Choose the interpreter to use for installs and launching the app.

    Priority:
    1. The currently active virtual environment, if any.
    2. `.venv` in the project root.
    3. `venv` in the project root.
    4. A fresh `venv` that we create.
    """
    if _is_running_inside_venv():
        python_path = Path(sys.executable)
        return None, python_path, python_path

    for name in (".venv", "venv"):
        venv_dir = PROJECT_ROOT / name
        python_path, pip_path = _venv_paths(venv_dir)
        if python_path.exists():
            return venv_dir, python_path, pip_path

    venv_dir = PROJECT_ROOT / "venv"
    python_path, pip_path = _venv_paths(venv_dir)
    return venv_dir, python_path, pip_path


VENV_DIR, VENV_PYTHON, VENV_PIP = choose_environment()


def ensure_venv():
    """Create the selected project virtual environment if needed."""
    if VENV_DIR is None:
        print(f"[OK] Using active virtual environment: {VENV_PYTHON}")
        return

    if VENV_PYTHON.exists():
        print(f"[OK] Virtual environment found: {VENV_DIR.name}")
        return

    print(f"[...] Creating virtual environment in {VENV_DIR.name}...")
    subprocess.check_call([sys.executable, "-m", "venv", str(VENV_DIR)])
    print("[OK] Virtual environment created.")


def install_deps():
    """Install requirements into the selected interpreter environment."""
    print("[...] Installing dependencies (this may take a few minutes)...")
    subprocess.check_call([
        str(VENV_PYTHON), "-m", "pip", "install", "--upgrade", "pip",
    ], stdout=subprocess.DEVNULL)
    subprocess.check_call([
        str(VENV_PYTHON), "-m", "pip", "install", "-r", str(REQUIREMENTS),
    ])
    print("[OK] Dependencies installed.")


def check_deps() -> tuple[bool, str]:
    """Check whether the app's core dependencies are importable."""
    code = (
        "import cv2, gradio, librosa, matplotlib, mediapipe, numpy, requests, "
        "scipy, sounddevice, rapidfuzz, faster_whisper, av"
    )
    result = subprocess.run(
        [str(VENV_PYTHON), "-c", code],
        capture_output=True,
        text=True,
    )
    if result.returncode == 0:
        return True, ""
    return False, (result.stderr or result.stdout).strip()


def launch_app():
    """Launch the Gradio app using the selected Python interpreter."""
    print(f"[...] Launching Speech Practice app with {VENV_PYTHON}...")
    print("      Open http://127.0.0.1:7860 in your browser")
    print()
    subprocess.call([str(VENV_PYTHON), str(PROJECT_ROOT / "app.py")])


def main():
    print("=" * 50)
    print("  Speech Practice - Setup & Launch")
    print("=" * 50)
    print()

    ensure_venv()

    deps_ok, error = check_deps()
    if not deps_ok:
        if error:
            print("[...] Missing or broken dependencies detected:")
            print(f"      {error.splitlines()[-1]}")
        install_deps()
    else:
        print("[OK] Dependencies already installed.")

    (PROJECT_ROOT / "data" / "sessions").mkdir(parents=True, exist_ok=True)
    (PROJECT_ROOT / "data" / "scripts").mkdir(parents=True, exist_ok=True)

    launch_app()


if __name__ == "__main__":
    main()
