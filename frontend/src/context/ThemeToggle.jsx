import { createPortal } from "react-dom";
import { useTheme } from "../context/ThemeContect.jsx";

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return createPortal(
        <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            style={{
                position: "fixed",
                bottom: "20px",
                right: "20px",
                zIndex: 99999,
                padding: "12px 14px",
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.25)",
                background: theme === "dark"
                    ? "rgba(0,0,0,0.6)"
                    : "rgba(255,255,255,0.8)",
                backdropFilter: "blur(10px)",
                color: theme === "dark" ? "white" : "black",
                cursor: "pointer",
                fontSize: "18px"
            }}
        >
            {theme === "dark" ? "🌙" : "☀️"}
        </button>,
        document.body
    );
}
