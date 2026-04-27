import { useState, useEffect, useCallback } from "react";
import { DEFAULT_SETTINGS } from "@/accessibility/defaultSettings";

const STORAGE_KEY = "a11y_settings";

let kbNavCleanup = null;

function enableKeyboardNav() {
  if (kbNavCleanup) return;

  document.querySelectorAll(
    "a, button, input, select, textarea, [role='button'], [role='link']"
  ).forEach((el) => {
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "0");
  });

  const onKeyDown = (e) => {
    // Don't fire shortcuts when user is typing
    const tag = document.activeElement?.tagName?.toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return;

    const key = e.key.toLowerCase();

    if (key === "m") {
      const nav = document.querySelector("nav, [role='navigation'], header");
      if (nav) { nav.setAttribute("tabindex", "-1"); nav.focus(); nav.scrollIntoView({ behavior: "smooth", block: "start" }); }
    }
    if (key === "h") {
      const h = document.querySelector("h1, h2, h3");
      if (h) { h.setAttribute("tabindex", "-1"); h.focus(); h.scrollIntoView({ behavior: "smooth", block: "center" }); }
    }
    if (key === "f") {
      const f = document.querySelector("input:not([type='hidden']), select, textarea");
      if (f) { f.focus(); f.scrollIntoView({ behavior: "smooth", block: "center" }); }
    }
    if (key === "b") {
      const btn = document.querySelector("button:not([aria-hidden='true'])");
      if (btn) { btn.focus(); btn.scrollIntoView({ behavior: "smooth", block: "center" }); }
    }
    if (key === "g") {
      const img = document.querySelector("img");
      if (img) { img.setAttribute("tabindex", "-1"); img.focus(); img.scrollIntoView({ behavior: "smooth", block: "center" }); }
    }
    if (e.key === "Escape") {
      if (document.activeElement) document.activeElement.blur();
    }
  };

  document.addEventListener("keydown", onKeyDown);
  kbNavCleanup = () => {
    document.removeEventListener("keydown", onKeyDown);
    kbNavCleanup = null;
  };
}

function disableKeyboardNav() {
  if (kbNavCleanup) kbNavCleanup();
}

// ─── Blind Users / Screen Reader optimisation ────────────────────────────────
function applyBlindUsers(on) {
  if (on) {
    // Fix images with missing alt text
    document.querySelectorAll("img:not([alt])").forEach((img) => {
      const name = img.src?.split("/").pop()?.replace(/\.\w+$/, "").replace(/[-_]/g, " ") || "image";
      img.setAttribute("alt", name);
    });
    // Fix buttons with no accessible name
    document.querySelectorAll("button:not([aria-label]):not([aria-labelledby])").forEach((btn) => {
      if (!btn.textContent.trim()) btn.setAttribute("aria-label", "button");
    });
    // Fix links with no accessible name
    document.querySelectorAll("a:not([aria-label])").forEach((a) => {
      if (!a.textContent.trim()) a.setAttribute("aria-label", "link");
    });
    // Add main role if missing
    const main = document.querySelector("main");
    if (main && !main.getAttribute("role")) main.setAttribute("role", "main");
    // Inject skip-to-content link
    if (!document.getElementById("a11y-skip-link")) {
      const skip = document.createElement("a");
      skip.id = "a11y-skip-link";
      skip.href = "#main-content";
      skip.textContent = "Skip to main content";
      skip.style.cssText = [
        "position:fixed", "top:12px", "left:12px", "z-index:999999",
        "background:#6366f1", "color:#fff", "padding:8px 18px",
        "border-radius:8px", "font-weight:700", "font-size:14px",
        "font-family:Poppins,sans-serif", "text-decoration:none",
        "transform:translateY(-200%)", "transition:transform 0.2s",
        "box-shadow:0 4px 14px rgba(99,102,241,0.5)",
      ].join(";");
      skip.addEventListener("focus", () => { skip.style.transform = "translateY(0)"; });
      skip.addEventListener("blur",  () => { skip.style.transform = "translateY(-200%)"; });
      document.body.prepend(skip);
    }
  } else {
    document.getElementById("a11y-skip-link")?.remove();
  }
}

// ─── Master DOM applicator ────────────────────────────────────────────────────
function applyToDOM(settings) {
  const root = document.documentElement;
  const body = document.body;

  // ── Profile body classes (ALL independent — multiple can be on at once) ────
  body.classList.toggle("a11y-seizure-safe",    settings.profiles.seizureSafe);
  body.classList.toggle("a11y-vision-impaired", settings.profiles.visionImpaired);
  body.classList.toggle("a11y-adhd-friendly",   settings.profiles.adhdFriendly);
  body.classList.toggle("a11y-cognitive",        settings.profiles.cognitiveDisability);
  body.classList.toggle("a11y-keyboard-nav",    settings.profiles.keyboardNavigation);
  body.classList.toggle("a11y-blind-users",     settings.profiles.blindUsers);

  // Keyboard nav needs JS engine too
  settings.profiles.keyboardNavigation ? enableKeyboardNav() : disableKeyboardNav();
  // Blind users needs DOM fixes
  applyBlindUsers(settings.profiles.blindUsers);

  // ── Color filter classes ───────────────────────────────────────────────────
  body.classList.toggle("a11y-dark-contrast",   settings.colors.darkContrast);
  body.classList.toggle("a11y-light-contrast",  settings.colors.lightContrast);
  body.classList.toggle("a11y-high-contrast",   settings.colors.highContrast);
  body.classList.toggle("a11y-high-saturation", settings.colors.highSaturation);
  body.classList.toggle("a11y-low-saturation",  settings.colors.lowSaturation);
  body.classList.toggle("a11y-monochrome",      settings.colors.monochrome);

  // ── Custom color overrides ─────────────────────────────────────────────────
  settings.colors.textColor
    ? root.style.setProperty("--a11y-text-color", settings.colors.textColor)
    : root.style.removeProperty("--a11y-text-color");
  settings.colors.titleColor
    ? root.style.setProperty("--a11y-title-color", settings.colors.titleColor)
    : root.style.removeProperty("--a11y-title-color");
  settings.colors.backgroundColor
    ? (body.style.backgroundColor = settings.colors.backgroundColor)
    : body.style.removeProperty("background-color");

  // ── Orientation classes ────────────────────────────────────────────────────
  body.classList.toggle("a11y-hide-images",     settings.orientation.hideImages);
  body.classList.toggle("a11y-stop-anims",      settings.orientation.stopAnimations);
  body.classList.toggle("a11y-read-mode",       settings.orientation.readMode);
  body.classList.toggle("a11y-highlight-hover", settings.orientation.highlightHover);

  // ── Content: font size ─────────────────────────────────────────────────────
  root.style.fontSize = settings.content.fontSizing === 0
    ? "" : `${100 + settings.content.fontSizing * 10}%`;

  // ── Content: line height ───────────────────────────────────────────────────
  root.style.setProperty(
    "--a11y-line-height",
    settings.content.lineHeight === 0 ? "" : `${1.5 + settings.content.lineHeight * 0.25}`
  );

  // ── Content: letter spacing ────────────────────────────────────────────────
  root.style.setProperty(
    "--a11y-letter-spacing",
    settings.content.letterSpacing === 0 ? "" : `${settings.content.letterSpacing}px`
  );

  // ── Content: readable font ─────────────────────────────────────────────────
  root.style.setProperty(
    "--a11y-font-family",
    settings.content.readableFont ? "Arial, sans-serif" : ""
  );

  // ── Mute all media ─────────────────────────────────────────────────────────
  if (settings.orientation.muteSounds) {
    document.querySelectorAll("audio,video").forEach((el) => (el.muted = true));
  }

  // ── Injected <style> tag: all CSS rules ────────────────────────────────────
  let tag = document.getElementById("a11y-styles");
  if (!tag) {
    tag = document.createElement("style");
    tag.id = "a11y-styles";
    document.head.appendChild(tag);
  }

  const css = [];

  // ── SEIZURE SAFE: kill every animation, desaturate hot colors ─────────────
  css.push(`
    .a11y-seizure-safe *,
    .a11y-seizure-safe *::before,
    .a11y-seizure-safe *::after {
      animation: none !important;
      animation-duration: 0s !important;
      animation-iteration-count: 1 !important;
      transition: none !important;
      transition-duration: 0s !important;
    }
    .a11y-seizure-safe {
      filter: saturate(0.6) !important;
    }
    .a11y-seizure-safe video,
    .a11y-seizure-safe canvas {
      opacity: 0.4 !important;
    }
  `);

  // ── VISION IMPAIRED: bigger text, better contrast, thick focus, big cursor ─
  css.push(`
    .a11y-vision-impaired {
      font-size: 120% !important;
    }
    .a11y-vision-impaired * {
      line-height: 1.85 !important;
      letter-spacing: 0.04em !important;
    }
    .a11y-vision-impaired p,
    .a11y-vision-impaired span,
    .a11y-vision-impaired li,
    .a11y-vision-impaired td,
    .a11y-vision-impaired label {
      font-size: 1.1em !important;
      word-spacing: 0.1em !important;
    }
    .a11y-vision-impaired h1 { font-size: 2.2em !important; }
    .a11y-vision-impaired h2 { font-size: 1.8em !important; }
    .a11y-vision-impaired h3 { font-size: 1.5em !important; }
    .a11y-vision-impaired a {
      text-decoration: underline !important;
      text-underline-offset: 3px !important;
      font-weight: 600 !important;
    }
    .a11y-vision-impaired :focus {
      outline: 4px solid #facc15 !important;
      outline-offset: 4px !important;
      box-shadow: 0 0 0 8px rgba(250,204,21,0.3) !important;
    }
    .a11y-vision-impaired button,
    .a11y-vision-impaired input,
    .a11y-vision-impaired select,
    .a11y-vision-impaired textarea {
      font-size: 1.1em !important;
      min-height: 44px !important;
      border-width: 2px !important;
    }
    .a11y-vision-impaired img {
      outline: 2px solid rgba(99,102,241,0.4) !important;
    }
  `);

  // ── ADHD FRIENDLY: no motion, fade noise, focus on content ────────────────
  css.push(`
    .a11y-adhd-friendly *,
    .a11y-adhd-friendly *::before,
    .a11y-adhd-friendly *::after {
      animation: none !important;
      animation-duration: 0s !important;
      transition-duration: 0.1s !important;
    }
    .a11y-adhd-friendly {
      font-family: Arial, sans-serif !important;
    }
    .a11y-adhd-friendly p,
    .a11y-adhd-friendly li {
      line-height: 1.9 !important;
      max-width: 70ch;
    }
    .a11y-adhd-friendly :focus {
      outline: 3px solid #6366f1 !important;
      outline-offset: 3px !important;
    }
    .a11y-adhd-friendly video:not(:focus),
    .a11y-adhd-friendly iframe:not(:focus) {
      opacity: 0.35 !important;
    }
    .a11y-adhd-friendly [class*="ads"],
    .a11y-adhd-friendly [class*="banner"],
    .a11y-adhd-friendly [class*="promo"] {
      opacity: 0.2 !important;
      pointer-events: none !important;
    }
  `);

  // ── COGNITIVE DISABILITY: readable font, spacing, large targets, no CAPS ──
  css.push(`
    .a11y-cognitive {
      font-family: Arial, Verdana, sans-serif !important;
    }
    .a11y-cognitive * {
      font-style: normal !important;
      text-transform: none !important;
      line-height: 1.85 !important;
      letter-spacing: 0.05em !important;
      word-spacing: 0.12em !important;
    }
    .a11y-cognitive p,
    .a11y-cognitive li,
    .a11y-cognitive td {
      font-size: 1.05em !important;
      max-width: 65ch;
    }
    .a11y-cognitive h1,
    .a11y-cognitive h2,
    .a11y-cognitive h3 {
      font-weight: 700 !important;
      border-bottom: 2px solid rgba(99,102,241,0.25) !important;
      padding-bottom: 4px !important;
      margin-bottom: 0.6em !important;
    }
    .a11y-cognitive a {
      text-decoration: underline !important;
      text-underline-offset: 3px !important;
    }
    .a11y-cognitive button,
    .a11y-cognitive [role="button"],
    .a11y-cognitive input,
    .a11y-cognitive select {
      min-height: 44px !important;
      min-width: 44px !important;
      padding: 8px 16px !important;
    }
    .a11y-cognitive :focus {
      outline: 3px solid #6366f1 !important;
      outline-offset: 3px !important;
    }
  `);

  // ── KEYBOARD NAVIGATION: very visible focus ring on every focusable el ────
  css.push(`
    .a11y-keyboard-nav :focus,
    .a11y-keyboard-nav :focus-visible {
      outline: 3px solid #6366f1 !important;
      outline-offset: 3px !important;
      box-shadow: 0 0 0 6px rgba(99,102,241,0.25) !important;
      position: relative !important;
      z-index: 9999 !important;
    }
  `);

  // ── BLIND USERS: flag missing alt text, show sr-only text ─────────────────
  css.push(`
    .a11y-blind-users img:not([alt]),
    .a11y-blind-users img[alt=""] {
      outline: 3px solid #ef4444 !important;
      outline-offset: 2px !important;
    }
    .a11y-blind-users .sr-only,
    .a11y-blind-users .visually-hidden {
      position: static !important;
      width: auto !important;
      height: auto !important;
      clip: auto !important;
      clip-path: none !important;
      overflow: visible !important;
      white-space: normal !important;
    }
  `);

  // ── COLOR ADJUSTMENTS ─────────────────────────────────────────────────────
  css.push(`
    .a11y-dark-contrast   { filter: invert(1) hue-rotate(180deg) !important; }
    .a11y-light-contrast  { background: #fffff0 !important; color: #000 !important; }
    .a11y-high-contrast * { color: #000 !important; background: #fff !important; border-color: #000 !important; }
    .a11y-high-saturation { filter: saturate(2.2) !important; }
    .a11y-low-saturation  { filter: saturate(0.3) !important; }
    .a11y-monochrome      { filter: grayscale(1) !important; }
  `);

  // ── ORIENTATION ───────────────────────────────────────────────────────────
  css.push(`
    .a11y-hide-images img,
    .a11y-hide-images video { visibility: hidden !important; }
    .a11y-stop-anims *,
    .a11y-stop-anims *::before,
    .a11y-stop-anims *::after { animation: none !important; transition: none !important; }
    .a11y-highlight-hover *:hover { outline: 3px solid #6366f1 !important; outline-offset: 2px; }
  `);

  // ── CONTENT: conditional ──────────────────────────────────────────────────
  if (settings.content.highlightTitles) {
    css.push("h1,h2,h3,h4,h5,h6 { outline: 2px solid #f59e0b !important; outline-offset: 3px; }");
  }
  if (settings.content.highlightLinks) {
    css.push("a { outline: 2px solid #6366f1 !important; background: rgba(99,102,241,0.12) !important; border-radius: 2px; }");
  }
  if (settings.orientation.readingGuide) {
    css.push(`body::after { content:''; position:fixed; left:0; right:0; height:44px; background:rgba(255,255,0,0.28); pointer-events:none; z-index:999998; top:var(--a11y-guide-y,50%); }`);
  }
  if (settings.orientation.readingMask) {
    css.push(`body::before { content:''; position:fixed; inset:0; background:rgba(0,0,0,0.55); pointer-events:none; z-index:999997; clip-path:inset(var(--a11y-mask-top,45%) 0 var(--a11y-mask-bottom,45%) 0); }`);
  }

  tag.textContent = css.join("\n");
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAccessibility() {
  const [settings, setSettings] = useState(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (!s) return DEFAULT_SETTINGS;
      const p = JSON.parse(s);
      return {
        profiles:    { ...DEFAULT_SETTINGS.profiles,    ...p.profiles },
        content:     { ...DEFAULT_SETTINGS.content,     ...p.content },
        colors:      { ...DEFAULT_SETTINGS.colors,      ...p.colors },
        orientation: { ...DEFAULT_SETTINGS.orientation, ...p.orientation },
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    applyToDOM(settings);
  }, [settings]);

  // All updaters do a proper nested spread → multiple profiles ON simultaneously ✓
  const updateProfile     = useCallback((k, v) => setSettings((p) => ({ ...p, profiles:    { ...p.profiles,    [k]: v } })), []);
  const updateContent     = useCallback((k, v) => setSettings((p) => ({ ...p, content:     { ...p.content,     [k]: v } })), []);
  const updateColor       = useCallback((k, v) => setSettings((p) => ({ ...p, colors:      { ...p.colors,      [k]: v } })), []);
  const updateOrientation = useCallback((k, v) => setSettings((p) => ({ ...p, orientation: { ...p.orientation, [k]: v } })), []);

  const resetSettings = useCallback(() => {
    disableKeyboardNav();
    applyBlindUsers(false);
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return { settings, updateProfile, updateContent, updateColor, updateOrientation, resetSettings };
}