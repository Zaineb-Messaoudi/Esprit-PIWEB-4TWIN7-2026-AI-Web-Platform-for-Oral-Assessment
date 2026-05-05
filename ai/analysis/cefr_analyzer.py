"""CEFR level analyzer for transcribed speech."""

import csv
from pathlib import Path
from collections import Counter

from config import DATA_DIR

CEFR_CSV = DATA_DIR / "cefr_words.csv"

# CEFR levels ordered from lowest to highest
CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"]
LEVEL_SCORE = {l: i for i, l in enumerate(CEFR_LEVELS)}


def _load_cefr_dict() -> dict[str, str]:
    """Load word -> highest CEFR level mapping from CSV."""
    if not CEFR_CSV.exists():
        return {}
    word_level: dict[str, str] = {}
    with open(CEFR_CSV, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            word = row.get("ud_word", "").strip().lower()
            level = row.get("ud_word_level", "").strip().upper()
            if word and level in CEFR_LEVELS:
                # Keep highest level if word appears multiple times
                if word not in word_level or (
                    LEVEL_SCORE[level] > LEVEL_SCORE[word_level[word]]
                ):
                    word_level[word] = level
    return word_level


# Load once at module level
_CEFR_DICT: dict[str, str] = _load_cefr_dict()


def analyze_cefr(transcript: str) -> dict:
    """
    Analyze transcript and return CEFR level breakdown.

    Returns:
        {
            "overall_level": "B2",
            "level_counts": {"A1": 10, "A2": 5, ...},
            "level_percentages": {"A1": 40.0, ...},
            "advanced_words": ["accountability", "fossil", ...],
            "unknown_words": 12,
            "total_scored_words": 25,
        }
    """
    if not _CEFR_DICT:
        return {"error": "CEFR dataset not loaded. Run download script first."}

    words = [w.strip(".,!?;:\"'()-").lower() for w in transcript.split()]
    words = [w for w in words if len(w) > 2]  # skip very short words

    level_counts: Counter = Counter()
    advanced_words: list[str] = []
    unknown = 0

    for word in words:
        level = _CEFR_DICT.get(word)
        if level:
            level_counts[level] += 1
            if level in ("C1", "C2"):
                advanced_words.append(word)
        else:
            unknown += 1

    total_scored = sum(level_counts.values())

    if total_scored == 0:
        return {
            "overall_level": "Unknown",
            "level_counts": {},
            "level_percentages": {},
            "advanced_words": [],
            "unknown_words": unknown,
            "total_scored_words": 0,
        }

    # Overall level = weighted average leaning toward highest frequent level
    level_percentages = {
        lvl: round(level_counts.get(lvl, 0) / total_scored * 100, 1)
        for lvl in CEFR_LEVELS
    }

    # Determine overall: find the highest level with >10% usage,
    # or fall back to the most common level
    overall_level = "A1"
    for lvl in reversed(CEFR_LEVELS):
        if level_percentages.get(lvl, 0) >= 10:
            overall_level = lvl
            break

    return {
        "overall_level": overall_level,
        "level_counts": dict(level_counts),
        "level_percentages": level_percentages,
        "advanced_words": list(set(advanced_words))[:10],
        "unknown_words": unknown,
        "total_scored_words": total_scored,
    }


def format_cefr_report(cefr_result: dict) -> str:
    """Format CEFR analysis as readable markdown."""
    if "error" in cefr_result:
        return f"CEFR analysis unavailable: {cefr_result['error']}"

    level = cefr_result["overall_level"]
    percentages = cefr_result["level_percentages"]
    advanced = cefr_result["advanced_words"]
    total = cefr_result["total_scored_words"]
    unknown = cefr_result["unknown_words"]

    lines = [
        f"**Overall CEFR Level: {level}**\n",
        f"Scored {total} words ({unknown} unrecognized)\n",
        "**Vocabulary breakdown:**",
    ]

    for lvl in CEFR_LEVELS:
        pct = percentages.get(lvl, 0)
        if pct > 0:
            bar = "█" * int(pct / 5)
            lines.append(f"- {lvl}: {pct}% {bar}")

    if advanced:
        lines.append(f"\n**Advanced words used (C1/C2):** {', '.join(advanced)}")

    return "\n".join(lines)