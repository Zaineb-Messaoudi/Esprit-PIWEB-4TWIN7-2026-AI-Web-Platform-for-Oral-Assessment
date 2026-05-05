"""Align live transcript to script position for teleprompter tracking.

Simple approach: compare each spoken word to the next expected script word.
  - Match -> advance (dim the word)
  - Close but not exact -> advance and mark mispronounced (red)
  - No match -> ignore (speaker went off-script or ASR noise)
  - Small skip-ahead (1-3 words) for when the speaker skips a word
"""

from __future__ import annotations

import html
import logging
import re
from typing import TYPE_CHECKING

from rapidfuzz import fuzz

log = logging.getLogger(__name__)

if TYPE_CHECKING:
    from analysis.transcription import WordInfo


def _normalize(word: str) -> str:
    """Lowercase and strip punctuation for comparison."""
    return word.lower().strip(".,!?;:\"'()-[]{}\u201c\u201d\u2018\u2019\u2026\u2014\u2013")


def _similarity(a: str, b: str) -> float:
    """Return similarity ratio between two normalized words."""
    if not a or not b:
        return 0.0
    if a == b:
        return 1.0
    if max(len(a), len(b)) > 2 * min(len(a), len(b)):
        return 0.0
    return fuzz.ratio(a, b) / 100.0


class PositionTracker:
    """Simple script position tracker.

    Compares each spoken word to the next expected script word.
    Advances on match, marks mispronunciations, ignores noise.
    """

    MATCH_THRESHOLD = 0.6        # minimum similarity to count as a match
    MISPRONOUNCE_THRESHOLD = 0.85  # below this = mispronounced
    SKIP_AHEAD = 3               # check up to 3 words ahead for skipped words
    MIN_CONFIDENCE = 0.4         # ignore ASR words below this

    def __init__(self):
        self._script_text: str = ""
        self._script_words: list[str] = []
        self._script_normalized: list[str] = []
        self._word_spans: list[tuple[int, int]] = []
        self._position = 0
        self._expect_ptr = 0
        self._mispronounced: set[int] = set()

        # Word tracking (final vs partial)
        self._last_n_final_words = 0
        self._last_partial_words: list[str] = []
        self._partial_snapshot: tuple | None = None

        # HTML cache
        self._cached_html: str = ""
        self._cached_pos: int = -1
        self._cached_mispronounced_len: int = 0

    def set_script(self, script: str):
        """Set the script text to track against."""
        self._script_text = script
        self._script_words = []
        self._script_normalized = []
        self._word_spans = []
        self._position = 0
        self._expect_ptr = 0
        self._mispronounced = set()
        self._last_n_final_words = 0
        self._last_partial_words = []
        self._partial_snapshot = None

        for m in re.finditer(r'\S+', script):
            self._script_words.append(m.group())
            self._script_normalized.append(_normalize(m.group()))
            self._word_spans.append((m.start(), m.end()))

    # ------------------------------------------------------------------
    # Public update methods
    # ------------------------------------------------------------------

    def update(self, transcript: str):
        """Update position from plain transcript text."""
        if not self._script_normalized:
            return
        words = [_normalize(w) for w in transcript.split() if _normalize(w)]
        new_words = words[self._last_n_final_words:]
        self._last_n_final_words = len(words)
        if new_words:
            self._process_words(new_words)

    def update_words(self, words: list[WordInfo],
                     n_final: int | None = None):
        """Update position from Vosk word-level data."""
        if not self._script_normalized:
            return

        if n_final is None:
            n_final = len(words)

        final_words = [
            _normalize(w.word) for w in words[:n_final]
            if w.conf >= self.MIN_CONFIDENCE and _normalize(w.word)
        ]
        partial_words = [
            _normalize(w.word) for w in words[n_final:]
            if w.conf >= self.MIN_CONFIDENCE and _normalize(w.word)
        ]

        # Process new final words
        new_final = final_words[self._last_n_final_words:]
        self._last_n_final_words = len(final_words)

        if new_final:
            self._rollback_partial()
            log.info("final=%s | ptr=%d", new_final, self._expect_ptr)
            self._process_words(new_final)
            self._save_snapshot()
            self._last_partial_words = []

        # Partial words: rollback previous partials and re-evaluate
        if partial_words != self._last_partial_words:
            self._rollback_partial()
            if partial_words:
                log.info("partial=%s | ptr=%d", partial_words, self._expect_ptr)
                self._save_snapshot()
                self._process_words(partial_words)
            self._last_partial_words = partial_words

    # ------------------------------------------------------------------
    # Snapshot / rollback for volatile partial words
    # ------------------------------------------------------------------

    def _save_snapshot(self):
        self._partial_snapshot = (
            self._position,
            self._expect_ptr,
        )

    def _rollback_partial(self):
        if self._partial_snapshot is not None:
            pos, ptr = self._partial_snapshot
            self._position = pos
            self._expect_ptr = ptr
            self._partial_snapshot = None

    # ------------------------------------------------------------------
    # Core matching engine
    # ------------------------------------------------------------------

    def _process_words(self, spoken_words: list[str]):
        """Match each spoken word against the next expected script word.

        1. Try the next expected word
        2. Try skipping 1-3 script words (speaker skipped ahead)
        3. Otherwise ignore (off-script or ASR noise)
        """
        for word in spoken_words:
            n = len(self._script_normalized)
            if self._expect_ptr >= n:
                return

            # --- Try next expected word ---
            expected = self._script_normalized[self._expect_ptr]
            sim = _similarity(word, expected)
            if sim >= self.MATCH_THRESHOLD:
                if sim < self.MISPRONOUNCE_THRESHOLD:
                    self._mispronounced.add(self._expect_ptr)
                log.info("  MATCH '%s' ~ '%s' (%.2f) -> pos %d",
                         word, expected, sim, self._expect_ptr)
                self._advance_to(self._expect_ptr)
                continue

            # --- Try skip-ahead (speaker skipped 1-3 words) ---
            skip_end = min(n, self._expect_ptr + 1 + self.SKIP_AHEAD)
            found = False
            for si in range(self._expect_ptr + 1, skip_end):
                skip_sim = _similarity(word, self._script_normalized[si])
                if skip_sim >= self.MATCH_THRESHOLD:
                    if skip_sim < self.MISPRONOUNCE_THRESHOLD:
                        self._mispronounced.add(si)
                    log.info("  SKIP '%s' ~ '%s' (%.2f) -> pos %d (+%d)",
                             word, self._script_normalized[si], skip_sim,
                             si, si - self._expect_ptr)
                    self._advance_to(si)
                    found = True
                    break
            if found:
                continue

            # --- No match: ignore ---
            log.info("  MISS '%s' (expected '%s', sim=%.2f)",
                     word, expected, sim)

    def _advance_to(self, pos: int):
        """Advance position forward (never backward)."""
        if pos >= self._position:
            self._position = pos
            self._expect_ptr = pos + 1

    # ------------------------------------------------------------------
    # Properties
    # ------------------------------------------------------------------

    @property
    def position(self) -> int:
        return self._position

    @property
    def progress(self) -> float:
        if not self._script_words:
            return 0.0
        return min(1.0, self._position / max(1, len(self._script_words)))

    # ------------------------------------------------------------------
    # HTML rendering
    # ------------------------------------------------------------------

    def get_script_html(self) -> str:
        """Render the full script as HTML preserving original formatting."""
        if not self._script_words:
            return ""

        pos = self._position

        if (pos == self._cached_pos
                and len(self._mispronounced) == self._cached_mispronounced_len
                and self._cached_html):
            return self._cached_html

        text = self._script_text
        base_style = "display:inline-block;padding:2px 4px;border-radius:4px;"
        out: list[str] = []
        prev_end = 0

        for i, (start, end) in enumerate(self._word_spans):
            gap = text[prev_end:start]
            if gap:
                out.append(html.escape(gap).replace("\n", "<br>"))

            escaped = html.escape(text[start:end])

            if i == pos:
                out.append(
                    f'<span id="tp-current" style="{base_style}'
                    f'background:#3b82f6;color:#fff;font-weight:700;">{escaped}</span>'
                )
            elif i in self._mispronounced and i < pos:
                out.append(
                    f'<span style="{base_style}'
                    f'text-decoration:underline wavy red;color:#ef4444;"'
                    f' title="Possible mispronunciation">{escaped}</span>'
                )
            elif i < pos:
                out.append(
                    f'<span style="{base_style}color:#9ca3af;">{escaped}</span>'
                )
            else:
                out.append(
                    f'<span style="{base_style}">{escaped}</span>'
                )

            prev_end = end

        if prev_end < len(text):
            out.append(html.escape(text[prev_end:]).replace("\n", "<br>"))

        self._cached_html = "".join(out)
        self._cached_pos = pos
        self._cached_mispronounced_len = len(self._mispronounced)
        return self._cached_html

    def get_visible_text(self, words_before: int = 10, words_after: int = 40) -> tuple[str, str, str]:
        """Get text around current position: (past, current_word, upcoming)."""
        if not self._script_words:
            return ("", "", "")

        pos = self._position
        past_start = max(0, pos - words_before)
        past = " ".join(self._script_words[past_start:pos])
        current = self._script_words[pos] if pos < len(self._script_words) else ""
        upcoming_end = min(len(self._script_words), pos + 1 + words_after)
        upcoming = " ".join(self._script_words[pos + 1:upcoming_end])

        return (past, current, upcoming)

    def reset(self):
        self._position = 0
        self._expect_ptr = 0
        self._mispronounced = set()
        self._last_n_final_words = 0
        self._last_partial_words = []
        self._partial_snapshot = None
