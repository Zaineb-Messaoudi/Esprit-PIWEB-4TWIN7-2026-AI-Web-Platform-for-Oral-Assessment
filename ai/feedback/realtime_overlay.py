"""Draw HUD metrics overlay on video frames."""

import cv2
import numpy as np

from config import (
    COLOR_GREEN, COLOR_YELLOW, COLOR_RED, COLOR_WHITE, COLOR_BG,
    TARGET_WPM_LOW, TARGET_WPM_HIGH,
)


def _color_for_wpm(wpm: float) -> tuple:
    if wpm == 0:
        return COLOR_WHITE
    if TARGET_WPM_LOW <= wpm <= TARGET_WPM_HIGH:
        return COLOR_GREEN
    if abs(wpm - (TARGET_WPM_LOW + TARGET_WPM_HIGH) / 2) < 40:
        return COLOR_YELLOW
    return COLOR_RED


def _draw_bg_rect(frame: np.ndarray, x: int, y: int, w: int, h: int,
                  alpha: float = 0.6):
    """Draw a semi-transparent background rectangle."""
    overlay = frame.copy()
    cv2.rectangle(overlay, (x, y), (x + w, y + h), COLOR_BG, -1)
    cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)


def draw_overlay(
    frame: np.ndarray,
    wpm: float = 0,
    wpm_status: str = "...",
    filler_count: int = 0,
    volume: float = 0,
    expression: str = "neutral",
    eye_contact: bool = False,
    posture: str = "unknown",
    gesture_openness: float = 0,
    elapsed_seconds: float = 0,
    is_recording: bool = False,
) -> np.ndarray:
    """Draw HUD overlay on a BGR frame. Returns the modified frame."""
    h, w = frame.shape[:2]
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.5
    thickness = 1
    line_height = 22

    # Top-left panel: speech metrics
    panel_x, panel_y = 8, 8
    panel_w, panel_h = 200, 130
    _draw_bg_rect(frame, panel_x, panel_y, panel_w, panel_h)

    y_pos = panel_y + 20

    # Recording indicator
    if is_recording:
        cv2.circle(frame, (panel_x + 10, y_pos - 4), 5, COLOR_RED, -1)
        elapsed_str = f"{int(elapsed_seconds // 60):02d}:{int(elapsed_seconds % 60):02d}"
        cv2.putText(frame, f"REC {elapsed_str}", (panel_x + 22, y_pos),
                    font, font_scale, COLOR_RED, thickness)
    y_pos += line_height

    # WPM
    wpm_color = _color_for_wpm(wpm)
    cv2.putText(frame, f"WPM: {wpm:.0f} ({wpm_status})", (panel_x + 6, y_pos),
                font, font_scale, wpm_color, thickness)
    y_pos += line_height

    # Fillers
    filler_color = COLOR_GREEN if filler_count < 5 else (COLOR_YELLOW if filler_count < 15 else COLOR_RED)
    cv2.putText(frame, f"Fillers: {filler_count}", (panel_x + 6, y_pos),
                font, font_scale, filler_color, thickness)
    y_pos += line_height

    # Volume bar
    cv2.putText(frame, "Vol:", (panel_x + 6, y_pos), font, font_scale, COLOR_WHITE, thickness)
    bar_x = panel_x + 45
    bar_w = 140
    bar_h = 10
    cv2.rectangle(frame, (bar_x, y_pos - 10), (bar_x + bar_w, y_pos - 10 + bar_h),
                  COLOR_WHITE, 1)
    vol_w = int(min(1.0, volume * 10) * bar_w)
    vol_color = COLOR_GREEN if volume < 0.08 else (COLOR_YELLOW if volume < 0.15 else COLOR_RED)
    cv2.rectangle(frame, (bar_x, y_pos - 10), (bar_x + vol_w, y_pos - 10 + bar_h),
                  vol_color, -1)

    # Top-right panel: body language
    panel2_x = w - 208
    panel2_y = 8
    panel2_w, panel2_h = 200, 110
    _draw_bg_rect(frame, panel2_x, panel2_y, panel2_w, panel2_h)

    y_pos = panel2_y + 20

    # Expression
    cv2.putText(frame, f"Expression: {expression}", (panel2_x + 6, y_pos),
                font, font_scale, COLOR_WHITE, thickness)
    y_pos += line_height

    # Eye contact
    ec_color = COLOR_GREEN if eye_contact else COLOR_YELLOW
    ec_text = "Yes" if eye_contact else "No"
    cv2.putText(frame, f"Eye Contact: {ec_text}", (panel2_x + 6, y_pos),
                font, font_scale, ec_color, thickness)
    y_pos += line_height

    # Posture
    posture_color = COLOR_GREEN if posture == "upright" else (
        COLOR_YELLOW if "slight" in posture else COLOR_RED
    )
    cv2.putText(frame, f"Posture: {posture}", (panel2_x + 6, y_pos),
                font, font_scale, posture_color, thickness)
    y_pos += line_height

    # Gesture openness
    openness_pct = int(gesture_openness * 100)
    cv2.putText(frame, f"Openness: {openness_pct}%", (panel2_x + 6, y_pos),
                font, font_scale, COLOR_WHITE, thickness)

    return frame
