"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { flushSync } from "react-dom";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-full bg-black/10 border border-[var(--glass-border)] animate-pulse" />
    );
  }

  const isDark = theme === "dark";

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark";

    if (!document.startViewTransition) {
      setTheme(newTheme);
      return;
    }

    document.startViewTransition(() => {
      flushSync(() => {
        setTheme(newTheme);
      });
    });
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-center w-9 h-9 rounded-full glass-panel hover:bg-black/10 transition-colors border border-[var(--glass-border)] cursor-pointer"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle Theme"
    >
      <Sun
        className={`w-4 h-4 transition-all duration-300 absolute ${
          isDark ? "scale-0 opacity-0 rotate-90" : "scale-100 opacity-100 rotate-0 text-amber-500"
        }`}
      />
      <Moon
        className={`w-4 h-4 transition-all duration-300 absolute ${
          isDark ? "scale-100 opacity-100 rotate-0 text-brand-secondary" : "scale-0 opacity-0 -rotate-90"
        }`}
      />
    </button>
  );
}

export default ThemeToggle;
