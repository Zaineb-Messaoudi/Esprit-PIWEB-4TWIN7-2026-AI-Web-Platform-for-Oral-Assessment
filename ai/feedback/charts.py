"""Generate matplotlib charts for post-session reports."""

import io
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from PIL import Image

from config import TARGET_WPM_LOW, TARGET_WPM_HIGH


def _fig_to_image(fig) -> np.ndarray:
    """Convert matplotlib figure to numpy array (RGB)."""
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=100, bbox_inches="tight",
                facecolor="#1a1a2e", edgecolor="none")
    buf.seek(0)
    img = Image.open(buf)
    arr = np.array(img)
    plt.close(fig)
    return arr


def create_wpm_chart(wpm_history: list[tuple[float, float]]) -> np.ndarray | None:
    """Create WPM over time chart."""
    if len(wpm_history) < 2:
        return None

    times, wpms = zip(*wpm_history)

    fig, ax = plt.subplots(figsize=(8, 3))
    fig.patch.set_facecolor("#1a1a2e")
    ax.set_facecolor("#16213e")

    ax.plot(times, wpms, color="#00d2ff", linewidth=2)
    ax.axhspan(TARGET_WPM_LOW, TARGET_WPM_HIGH, alpha=0.2, color="#00ff88",
               label=f"Target ({TARGET_WPM_LOW}-{TARGET_WPM_HIGH})")
    ax.axhline(y=TARGET_WPM_LOW, color="#00ff88", linestyle="--", alpha=0.5)
    ax.axhline(y=TARGET_WPM_HIGH, color="#00ff88", linestyle="--", alpha=0.5)

    ax.set_xlabel("Time (s)", color="white")
    ax.set_ylabel("WPM", color="white")
    ax.set_title("Words Per Minute", color="white", fontsize=14)
    ax.tick_params(colors="white")
    ax.legend(facecolor="#16213e", labelcolor="white")
    for spine in ax.spines.values():
        spine.set_color("#333")

    return _fig_to_image(fig)


def create_filler_chart(filler_counts: dict[str, int]) -> np.ndarray | None:
    """Create filler word frequency bar chart."""
    if not filler_counts:
        return None

    # Top 8 fillers
    sorted_fillers = sorted(filler_counts.items(), key=lambda x: x[1], reverse=True)[:8]
    if not sorted_fillers:
        return None

    words, counts = zip(*sorted_fillers)

    fig, ax = plt.subplots(figsize=(8, 3))
    fig.patch.set_facecolor("#1a1a2e")
    ax.set_facecolor("#16213e")

    bars = ax.barh(words, counts, color="#ff6b6b")
    ax.set_xlabel("Count", color="white")
    ax.set_title("Filler Words", color="white", fontsize=14)
    ax.tick_params(colors="white")
    ax.invert_yaxis()
    for spine in ax.spines.values():
        spine.set_color("#333")

    return _fig_to_image(fig)


def create_volume_chart(volume_history: list[tuple[float, float]]) -> np.ndarray | None:
    """Create volume over time chart."""
    if len(volume_history) < 2:
        return None

    times, volumes = zip(*volume_history)

    fig, ax = plt.subplots(figsize=(8, 3))
    fig.patch.set_facecolor("#1a1a2e")
    ax.set_facecolor("#16213e")

    ax.fill_between(times, volumes, alpha=0.4, color="#ffd93d")
    ax.plot(times, volumes, color="#ffd93d", linewidth=1)

    ax.set_xlabel("Time (s)", color="white")
    ax.set_ylabel("Volume (RMS)", color="white")
    ax.set_title("Volume Over Time", color="white", fontsize=14)
    ax.tick_params(colors="white")
    for spine in ax.spines.values():
        spine.set_color("#333")

    return _fig_to_image(fig)


def create_expression_chart(expression_history: list[tuple[float, str]]) -> np.ndarray | None:
    """Create expression timeline chart."""
    if len(expression_history) < 2:
        return None

    expression_map = {"neutral": 0, "happy": 1, "surprised": 2, "angry": 3}
    times = [t for t, _ in expression_history]
    values = [expression_map.get(e, 0) for _, e in expression_history]

    fig, ax = plt.subplots(figsize=(8, 2.5))
    fig.patch.set_facecolor("#1a1a2e")
    ax.set_facecolor("#16213e")

    ax.scatter(times, values, c="#e94560", s=10, alpha=0.7)
    ax.set_yticks(list(expression_map.values()))
    ax.set_yticklabels(list(expression_map.keys()))
    ax.set_xlabel("Time (s)", color="white")
    ax.set_title("Expression Timeline", color="white", fontsize=14)
    ax.tick_params(colors="white")
    for spine in ax.spines.values():
        spine.set_color("#333")

    return _fig_to_image(fig)
