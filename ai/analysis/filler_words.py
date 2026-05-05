"""Detect filler words in transcribed text."""

import re
from config import FILLER_WORDS


class FillerWordDetector:
    """Counts filler words in transcript text using word-boundary matching."""

    def __init__(self):
        self._total_count = 0
        self._counts: dict[str, int] = {}
        self._last_processed_len = 0
        # Pre-compile regex patterns for each filler word
        self._patterns = {
            filler: re.compile(
                r'\b' + re.escape(filler.lower()) + r'\b',
                re.IGNORECASE,
            )
            for filler in FILLER_WORDS
        }

    def update(self, transcript: str):
        """Process the full transcript and update counts."""
        if len(transcript) <= self._last_processed_len:
            return
        # Only process the new portion
        new_text = transcript[self._last_processed_len:]
        self._last_processed_len = len(transcript)

        for filler, pattern in self._patterns.items():
            count = len(pattern.findall(new_text))
            if count > 0:
                self._counts[filler] = self._counts.get(filler, 0) + count
                self._total_count += count

    @property
    def total_count(self) -> int:
        return self._total_count

    @property
    def counts(self) -> dict[str, int]:
        return dict(self._counts)

    def top_fillers(self, n: int = 5) -> list[tuple[str, int]]:
        return sorted(self._counts.items(), key=lambda x: x[1], reverse=True)[:n]

    def reset(self):
        self._total_count = 0
        self._counts.clear()
        self._last_processed_len = 0