import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useA11y } from "@/context/AccessibilityContext";

// ─── Theme tokens ─────────────────────────────────────────────────────────────
function useThemeTokens() {
  const [isDark, setIsDark] = useState(
    () => document.documentElement.getAttribute("data-theme") !== "light"
  );
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setIsDark(document.documentElement.getAttribute("data-theme") !== "light")
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  return {
    isDark,
    panelBg:          isDark ? "rgba(3,0,20,0.97)"           : "rgba(248,250,252,0.98)",
    panelBorder:      isDark ? "rgba(220,38,38,0.2)"          : "rgba(220,38,38,0.15)",
    panelShadow:      isDark
      ? "0 24px 60px rgba(0,0,0,0.75), 0 0 0 1px rgba(220,38,38,0.12), 0 0 40px rgba(220,38,38,0.05)"
      : "0 16px 50px rgba(15,23,42,0.15), 0 0 0 1px rgba(220,38,38,0.1)",
    textPrimary:      isDark ? "#ffffff"  : "#0f172a",
    textSecondary:    isDark ? "#9ca3af"  : "#475569",
    divider:          isDark ? "rgba(220,38,38,0.08)" : "rgba(220,38,38,0.07)",
    cardBg:           isDark ? "rgba(220,38,38,0.04)" : "rgba(220,38,38,0.04)",
    cardHover:        isDark ? "rgba(220,38,38,0.08)" : "rgba(220,38,38,0.08)",
    cardActive:       isDark ? "rgba(220,38,38,0.15)" : "rgba(220,38,38,0.12)",
    cardActiveBorder: "rgba(220,38,38,0.5)",
    trackOff:         isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.1)",
    accent:           "#dc2626",
    accentLight:      "#ef4444",
    secondary:        "#6366f1",
    headerBg:         isDark
      ? "linear-gradient(135deg, rgba(20,0,0,1) 0%, rgba(127,0,0,0.9) 100%)"
      : "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
    fabBg:            "linear-gradient(135deg, #dc2626, #b91c1c)",
    fabShadow:        "0 4px 18px rgba(220,38,38,0.5)",
    fabShadowHover:   "0 8px 28px rgba(220,38,38,0.7), 0 0 0 4px rgba(220,38,38,0.2)",
    toggleOn:         "linear-gradient(135deg, #dc2626, #ef4444)",
    toggleOnShadow:   "0 0 10px rgba(220,38,38,0.45)",
    stepperBg:        "linear-gradient(135deg, #dc2626, #ef4444)",
    stepperShadow:    "0 0 8px rgba(220,38,38,0.4)",
  };
}

// ─── SVG helper ───────────────────────────────────────────────────────────────
const Svg = ({ children, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    style={{ display: "block", flexShrink: 0 }}>
    {children}
  </svg>
);

const IC = {
  wheelchair: <Svg size={24}><circle cx="12" cy="5" r="2"/><path d="M8 12l4-7 4 7"/><path d="M8 17a4 4 0 1 0 8 0"/><line x1="12" y1="12" x2="12" y2="17"/></Svg>,
  reset:  <Svg size={13}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.54"/></Svg>,
  close:  <Svg size={13}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Svg>,
  bolt:   <Svg><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Svg>,
  eye:    <Svg><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></Svg>,
  adhd:   <Svg><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></Svg>,
  target: <Svg><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></Svg>,
  kb:     <Svg><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8"/></Svg>,
  wave:   <Svg><path d="M2 12c.5-3 2.5-5 5-5s4.5 2 5 5 2.5 5 5 5 4.5-2 5-5"/></Svg>,
  font:   <Svg><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></Svg>,
  link:   <Svg><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></Svg>,
  zoom:   <Svg><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Svg>,
  lines:  <Svg><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></Svg>,
  moon:   <Svg><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></Svg>,
  sun:    <Svg><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></Svg>,
  ctr:    <Svg><circle cx="12" cy="12" r="10"/><path d="M12 2v20"/><path d="M12 2a10 10 0 0 1 0 20z" fill="currentColor" stroke="none"/></Svg>,
  drop:   <Svg><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></Svg>,
  mute:   <Svg><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></Svg>,
  imgOff: <Svg><line x1="2" y1="2" x2="22" y2="22"/><path d="M10.41 10.41a2 2 0 1 1-2.83-2.83"/><path d="M4 4H3a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14"/><path d="M20 14.18V5a1 1 0 0 0-1-1H9"/></Svg>,
  book:   <Svg><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></Svg>,
  zap:    <Svg><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Svg>,
  mask:   <Svg><rect x="3" y="8" width="18" height="8" rx="2"/><line x1="3" y1="4" x2="21" y2="4"/><line x1="3" y1="20" x2="21" y2="20"/></Svg>,
  hover:  <Svg><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="12" y1="9" x2="12" y2="15"/></Svg>,
  alL:    <Svg><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></Svg>,
  alC:    <Svg><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></Svg>,
  alR:    <Svg><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></Svg>,
};

const SWATCHES = ["#dc2626","#b91c1c","#ef4444","#f97316","#6366f1","#3b82f6","#f8fafc","#030014"];

// ─── Portal root ──────────────────────────────────────────────────────────────
// THE CORE FIX:
// Your index.css sets `overflow-x: hidden` on both <html> and <body>.
// When overflow is set on <html>, it becomes the scroll container AND the
// containing block for `position: fixed` — meaning fixed elements are no
// longer anchored to the visual viewport, they shift with layout changes.
//
// Solution: create a portal container that itself has `position: fixed` +
// `transform: translateZ(0)`. The transform promotes it to its own compositing
// layer and makes it the new containing block for any `position: fixed` or
// `position: absolute` children — completely bypassing the broken html/body
// overflow context. Children use `position: absolute` inside this container.
function getPortalRoot() {
  let el = document.getElementById("a11y-widget-root");
  if (!el) {
    el = document.createElement("div");
    el.id = "a11y-widget-root";
    el.setAttribute("style", [
      // Fixed to viewport top-left, full size — this is OUR coordinate space
      "position: fixed",
      "top: 0",
      "left: 0",
      "width: 100%",
      "height: 100%",
      // Critical: transform creates a new stacking/containing-block context.
      // Children that are position:absolute now measure from THIS element,
      // not from the overflowed html/body. Layout changes to body don't
      // affect us at all.
      "transform: translateZ(0)",
      "will-change: transform",
      // This layer never intercepts clicks — children opt-in with pointer-events:auto
      "pointer-events: none",
      "z-index: 2147483647",
      "isolation: isolate",
    ].join("; "));
    document.body.appendChild(el);
  }
  return el;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionLabel({ children, t }) {
  return (
    <p style={{
      margin: "0 0 10px", fontSize: 10, fontWeight: 700,
      textTransform: "uppercase", letterSpacing: "0.1em",
      color: t.textSecondary, fontFamily: "Poppins,sans-serif",
    }}>{children}</p>
  );
}

function ProfileRow({ label, desc, icon, checked, onChange, t }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 0", borderBottom: `1px solid ${t.divider}`,
    }}>
      <button
        role="switch" aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          position: "relative", flexShrink: 0,
          width: 46, height: 24, borderRadius: 12,
          background: checked ? t.toggleOn : t.trackOff,
          border: "none", cursor: "pointer",
          boxShadow: checked ? t.toggleOnShadow : "none",
          transition: "background 0.2s, box-shadow 0.2s",
        }}
      >
        <span style={{
          position: "absolute", top: 3,
          left: checked ? "calc(100% - 21px)" : 3,
          width: 18, height: 18, borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.35)",
          transition: "left 0.2s",
        }}/>
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: checked ? 600 : 500,
          color: checked ? t.accent : t.textPrimary,
          fontFamily: "Poppins,sans-serif",
        }}>{label}</div>
        {desc && (
          <div style={{
            fontSize: 11, color: t.textSecondary,
            fontFamily: "Poppins,sans-serif", marginTop: 1,
          }}>{desc}</div>
        )}
      </div>
      <span style={{ color: checked ? t.accent : t.textSecondary, opacity: 0.65, flexShrink: 0 }}>
        {icon}
      </span>
    </div>
  );
}

function ToggleCard({ label, icon, checked, onChange, t }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: checked ? t.cardActive : hov ? t.cardHover : t.cardBg,
        border: `1.5px solid ${checked ? t.cardActiveBorder : t.panelBorder}`,
        borderRadius: 10, padding: "12px 8px", cursor: "pointer",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        color: checked ? t.accent : t.textSecondary,
        fontSize: 11, fontWeight: 500, fontFamily: "Poppins,sans-serif",
        transition: "all 0.15s",
        boxShadow: checked ? "0 0 12px rgba(220,38,38,0.2)" : "none",
      }}
    >
      {icon}
      <span style={{ textAlign: "center", lineHeight: 1.3 }}>{label}</span>
    </button>
  );
}

function Stepper({ label, icon, value, onChange, t, min = -3, max = 3 }) {
  const atMin = value <= min, atMax = value >= max;
  const btn = (disabled) => ({
    width: 26, height: 26, borderRadius: "50%",
    background: disabled ? t.trackOff : t.stepperBg,
    color: disabled ? t.textSecondary : "#fff",
    border: "none", cursor: disabled ? "not-allowed" : "pointer",
    fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, fontFamily: "Poppins,sans-serif", lineHeight: 1,
    boxShadow: disabled ? "none" : t.stepperShadow,
    transition: "all 0.15s",
  });
  return (
    <div style={{
      background: t.cardBg, border: `1px solid ${t.panelBorder}`,
      borderRadius: 10, padding: "11px 10px",
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        fontSize: 11, fontWeight: 500, color: t.textSecondary,
        fontFamily: "Poppins,sans-serif",
      }}>
        <span style={{ color: t.textSecondary }}>{icon}</span>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <button onClick={() => onChange(Math.max(min, value - 1))} disabled={atMin} style={btn(atMin)}>−</button>
        <span style={{
          flex: 1, textAlign: "center", fontSize: 12, fontWeight: 600,
          color: value === 0 ? t.textSecondary : t.accent,
          fontFamily: "Poppins,sans-serif",
        }}>
          {value === 0 ? "Default" : value > 0 ? `+${value}` : value}
        </span>
        <button onClick={() => onChange(Math.min(max, value + 1))} disabled={atMax} style={btn(atMax)}>+</button>
      </div>
    </div>
  );
}

function ColorPicker({ label, value, onChange, t }) {
  return (
    <div style={{
      background: t.cardBg,
      border: `1.5px solid ${value ? t.cardActiveBorder : t.panelBorder}`,
      borderRadius: 10, padding: "11px 12px", marginBottom: 8,
      boxShadow: value ? "0 0 10px rgba(220,38,38,0.15)" : "none",
    }}>
      <p style={{
        margin: "0 0 8px", fontSize: 11, fontWeight: 500,
        color: t.textSecondary, fontFamily: "Poppins,sans-serif",
      }}>{label}</p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {SWATCHES.map((c) => (
          <button key={c} onClick={() => onChange(value === c ? null : c)} aria-label={`Color ${c}`}
            style={{
              width: 23, height: 23, borderRadius: "50%", background: c, cursor: "pointer",
              border: c === "#f8fafc" ? "1px solid #cbd5e1" : c === "#030014" ? "1px solid rgba(255,255,255,0.2)" : "none",
              outline: value === c ? `2.5px solid ${t.accent}` : "2px solid transparent",
              outlineOffset: 2,
              transform: value === c ? "scale(1.18)" : "scale(1)",
              transition: "all 0.15s",
            }}
          />
        ))}
      </div>
      {value && (
        <button onClick={() => onChange(null)} style={{
          marginTop: 7, background: "none", border: "none",
          color: t.accent, cursor: "pointer", fontSize: 11,
          fontFamily: "Poppins,sans-serif", padding: 0,
        }}>Cancel</button>
      )}
    </div>
  );
}

function Section({ title, children, t }) {
  return (
    <div style={{ padding: "16px 16px 0" }}>
      <SectionLabel t={t}>{title}</SectionLabel>
      {children}
    </div>
  );
}

// ─── Main Widget ──────────────────────────────────────────────────────────────
export function AccessibilityWidget() {
  const [open, setOpen]   = useState(false);
  const [fabHov, setFH]   = useState(false);
  // Track the real visual viewport height in JS — this is the ground truth,
  // immune to anything CSS does to html/body
  const [vh, setVh] = useState(() => window.visualViewport?.height ?? window.innerHeight);
  const t = useThemeTokens();
  const { settings, updateProfile, updateContent, updateColor, updateOrientation, resetSettings } = useA11y();

  useEffect(() => {
    const update = () => setVh(window.visualViewport?.height ?? window.innerHeight);
    window.visualViewport?.addEventListener("resize", update);
    window.addEventListener("resize", update);
    return () => {
      window.visualViewport?.removeEventListener("resize", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const FAB    = 42;
  const MARGIN = 14;
  const GAP    = 10;
  const grid   = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 4 };

  // Pixel-perfect center: half the viewport minus half the button
  const fabTop    = Math.round(vh / 2 - FAB / 2);
  const panelMaxH = Math.round(vh * 0.82);

  return createPortal(
    <>
      <style>{`
        @keyframes a11yIn {
          from { opacity: 0; transform: translateX(10px) scale(0.97); }
          to   { opacity: 1; transform: translateX(0)    scale(1);    }
        }
      `}</style>

      {/* ── FAB ────────────────────────────────────────────────────────────
          position:absolute inside our portal-root (which is a fixed+transformed
          layer). `top` is computed directly from the measured viewport height,
          so it never drifts regardless of what body classes/styles change.
      ─────────────────────────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setFH(true)}
        onMouseLeave={() => setFH(false)}
        aria-label={open ? "Close accessibility settings" : "Open accessibility settings"}
        aria-expanded={open}
        style={{
          position: "absolute",
          right: MARGIN,
          top: fabTop,
          zIndex: 9,
          width: FAB, height: FAB,
          borderRadius: "50%",
          background: t.fabBg,
          color: "#fff", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: fabHov ? t.fabShadowHover : t.fabShadow,
          transform: fabHov ? "scale(1.1)" : "scale(1)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          pointerEvents: "auto",
        }}
      >
        {open ? IC.close : IC.wheelchair}
      </button>

      {/* ── Panel ──────────────────────────────────────────────────────────
          Uses a flex column-centered wrapper so the panel is always in the
          middle of our portal layer (which is always exactly the viewport).
          No transform-based centering needed on the panel itself.
      ─────────────────────────────────────────────────────────────────── */}
      {open && (
        <div style={{
          position: "absolute",
          top: 0, bottom: 0,
          right: MARGIN + FAB + GAP,
          // Flex column centers the panel child vertically
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: 8,
        }}>
          <div
            role="dialog"
            aria-label="Accessibility Adjustments"
            style={{
              pointerEvents: "auto",
              width: 355,
              maxHeight: panelMaxH,
              background: t.panelBg,
              border: `1px solid ${t.panelBorder}`,
              borderRadius: 14,
              boxShadow: t.panelShadow,
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              animation: "a11yIn 0.22s cubic-bezier(0.34,1.4,0.64,1) both",
            }}
          >
            {/* Header */}
            <div style={{
              background: t.headerBg,
              padding: "14px 16px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexShrink: 0,
              borderBottom: "1px solid rgba(255,255,255,0.07)",
            }}>
              <h2 style={{
                margin: 0, fontSize: 14, fontWeight: 700,
                color: "#fff", fontFamily: "Poppins,sans-serif",
                letterSpacing: "-0.01em",
              }}>
                Accessibility Adjustments
              </h2>
              <button
                onClick={resetSettings}
                style={{
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "#fff", borderRadius: 20, padding: "4px 12px",
                  cursor: "pointer", fontSize: 11, fontWeight: 500,
                  display: "flex", alignItems: "center", gap: 5,
                  fontFamily: "Poppins,sans-serif",
                }}
              >
                {IC.reset} Reset
              </button>
            </div>

            {/* Scrollable body */}
            <div style={{
              overflowY: "auto", flex: 1, paddingBottom: 20,
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(220,38,38,0.3) transparent",
            }}>
              <Section title="Accessibility Profiles" t={t}>
                {[
                  { k:"seizureSafe",         label:"Seizure Safe",         desc:"Clears flashes & reduces color",  icon:IC.bolt   },
                  { k:"visionImpaired",      label:"Vision Impaired",      desc:"Enhances website's visuals",      icon:IC.eye    },
                  { k:"adhdFriendly",        label:"ADHD Friendly",        desc:"More focus & fewer distractions", icon:IC.adhd   },
                  { k:"cognitiveDisability", label:"Cognitive Disability", desc:"Assists with reading & focusing", icon:IC.target },
                  { k:"keyboardNavigation",  label:"Keyboard Navigation",  desc:"Use website with the keyboard",   icon:IC.kb     },
                  { k:"blindUsers",          label:"Blind Users",          desc:"Optimise for screen-readers",     icon:IC.wave   },
                ].map(({ k, label, desc, icon }) => (
                  <ProfileRow key={k} t={t} label={label} desc={desc} icon={icon}
                    checked={settings.profiles[k]}
                    onChange={(v) => updateProfile(k, v)}
                  />
                ))}
              </Section>

              <Section title="Content Adjustments" t={t}>
                <div style={grid}>
                  <Stepper t={t} icon={IC.font}  label="Font Sizing"    value={settings.content.fontSizing}    onChange={(v) => updateContent("fontSizing", v)} />
                  <Stepper t={t} icon={IC.lines} label="Line Height"    value={settings.content.lineHeight}    onChange={(v) => updateContent("lineHeight", v)} />
                  <Stepper t={t} icon={IC.font}  label="Letter Spacing" value={settings.content.letterSpacing} onChange={(v) => updateContent("letterSpacing", v)} />
                  <ToggleCard t={t} icon={IC.font} label="Readable Font"    checked={settings.content.readableFont}    onChange={(v) => updateContent("readableFont", v)} />
                  <ToggleCard t={t} icon={IC.font} label="Highlight Titles" checked={settings.content.highlightTitles} onChange={(v) => updateContent("highlightTitles", v)} />
                  <ToggleCard t={t} icon={IC.link} label="Highlight Links"  checked={settings.content.highlightLinks}  onChange={(v) => updateContent("highlightLinks", v)} />
                  <ToggleCard t={t} icon={IC.zoom} label="Text Magnifier"   checked={settings.content.textMagnifier}   onChange={(v) => updateContent("textMagnifier", v)} />
                  <ToggleCard t={t} icon={IC.alL}  label="Align Left"   checked={settings.content.textAlign === "left"}   onChange={() => updateContent("textAlign", settings.content.textAlign === "left"   ? "default" : "left")} />
                  <ToggleCard t={t} icon={IC.alC}  label="Align Center" checked={settings.content.textAlign === "center"} onChange={() => updateContent("textAlign", settings.content.textAlign === "center" ? "default" : "center")} />
                  <ToggleCard t={t} icon={IC.alR}  label="Align Right"  checked={settings.content.textAlign === "right"}  onChange={() => updateContent("textAlign", settings.content.textAlign === "right"  ? "default" : "right")} />
                </div>
              </Section>

              <Section title="Color Adjustments" t={t}>
                <div style={{ ...grid, marginBottom: 12 }}>
                  <ToggleCard t={t} icon={IC.moon} label="Dark Contrast"   checked={settings.colors.darkContrast}   onChange={(v) => updateColor("darkContrast", v)} />
                  <ToggleCard t={t} icon={IC.sun}  label="Light Contrast"  checked={settings.colors.lightContrast}  onChange={(v) => updateColor("lightContrast", v)} />
                  <ToggleCard t={t} icon={IC.ctr}  label="High Contrast"   checked={settings.colors.highContrast}   onChange={(v) => updateColor("highContrast", v)} />
                  <ToggleCard t={t} icon={IC.drop} label="High Saturation" checked={settings.colors.highSaturation} onChange={(v) => updateColor("highSaturation", v)} />
                  <ToggleCard t={t} icon={IC.drop} label="Low Saturation"  checked={settings.colors.lowSaturation}  onChange={(v) => updateColor("lowSaturation", v)} />
                  <ToggleCard t={t} icon={IC.drop} label="Monochrome"      checked={settings.colors.monochrome}     onChange={(v) => updateColor("monochrome", v)} />
                </div>
                <ColorPicker t={t} label="Text Color"       value={settings.colors.textColor}       onChange={(v) => updateColor("textColor", v)} />
                <ColorPicker t={t} label="Title Color"      value={settings.colors.titleColor}      onChange={(v) => updateColor("titleColor", v)} />
                <ColorPicker t={t} label="Background Color" value={settings.colors.backgroundColor} onChange={(v) => updateColor("backgroundColor", v)} />
              </Section>

              <Section title="Orientation Adjustments" t={t}>
                <div style={grid}>
                  <ToggleCard t={t} icon={IC.mute}   label="Mute Sounds"     checked={settings.orientation.muteSounds}     onChange={(v) => updateOrientation("muteSounds", v)} />
                  <ToggleCard t={t} icon={IC.imgOff} label="Hide Images"     checked={settings.orientation.hideImages}     onChange={(v) => updateOrientation("hideImages", v)} />
                  <ToggleCard t={t} icon={IC.book}   label="Read Mode"       checked={settings.orientation.readMode}       onChange={(v) => updateOrientation("readMode", v)} />
                  <ToggleCard t={t} icon={IC.lines}  label="Reading Guide"   checked={settings.orientation.readingGuide}   onChange={(v) => updateOrientation("readingGuide", v)} />
                  <ToggleCard t={t} icon={IC.zap}    label="Stop Animations" checked={settings.orientation.stopAnimations} onChange={(v) => updateOrientation("stopAnimations", v)} />
                  <ToggleCard t={t} icon={IC.mask}   label="Reading Mask"    checked={settings.orientation.readingMask}    onChange={(v) => updateOrientation("readingMask", v)} />
                  <ToggleCard t={t} icon={IC.hover}  label="Highlight Hover" checked={settings.orientation.highlightHover} onChange={(v) => updateOrientation("highlightHover", v)} />
                </div>
              </Section>
            </div>
          </div>
        </div>
      )}
    </>,
    getPortalRoot()
  );
}