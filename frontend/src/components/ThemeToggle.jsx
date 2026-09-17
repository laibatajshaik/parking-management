import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ showLabel = false, className = "" }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("shnoor_theme") || "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    try {
      document.documentElement.setAttribute("data-theme", theme);
      if (theme === "dark") {
        document.body.classList.add("dark-theme");
        document.body.classList.remove("light-theme");
      } else {
        document.body.classList.add("light-theme");
        document.body.classList.remove("dark-theme");
      }
      localStorage.setItem("shnoor_theme", theme);
    } catch {
      void 0;
    }

    const handleSync = (e) => {
      if (e.detail && e.detail.theme && e.detail.theme !== theme) {
        setTheme(e.detail.theme);
      }
    };

    window.addEventListener("theme-change", handleSync);
    return () => window.removeEventListener("theme-change", handleSync);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    try {
      window.dispatchEvent(new CustomEvent("theme-change", { detail: { theme: nextTheme } }));
    } catch {
      void 0;
    }
  };

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className={`pw-theme-toggle-btn ${isDark ? "is-dark" : "is-light"} ${className}`}
      onClick={toggleTheme}
      title={isDark ? "Switch to Normal Mode (Light)" : "Switch to Dark Mode"}
      aria-label={isDark ? "Switch to Normal Mode" : "Switch to Dark Mode"}
    >
      <div className="pw-theme-toggle-icon-wrap">
        {isDark ? <Moon size={16} className="pw-theme-icon-moon" /> : <Sun size={16} className="pw-theme-icon-sun" />}
      </div>
      {showLabel && (
        <span className="pw-theme-toggle-text">
          {isDark ? "Dark" : "Light"}
        </span>
      )}
    </button>
  );
}
