"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const STORAGE_KEY = "teknav_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const stored = (typeof window !== "undefined" && (localStorage.getItem(STORAGE_KEY) as Theme | null)) || null;
    const preferred: Theme =
      stored ??
      (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setThemeState(preferred);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    document.body.classList.remove("light", "dark");
    document.body.classList.add(theme);
    document.documentElement.style.colorScheme = theme === "dark" ? "dark" : "light";
    localStorage.setItem(STORAGE_KEY, theme);

    const faviconPath = theme === "dark" ? "/facicon2.ico" : "/favicon.ico";
    const linkEl = (document.querySelector('link[rel~="icon"]') as HTMLLinkElement | null) || document.createElement("link");
    linkEl.rel = "icon";
    linkEl.href = faviconPath;
    if (!linkEl.parentElement) {
      document.head.appendChild(linkEl);
    }
  }, [theme]);

  const toggle = () => setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  const setTheme = (next: Theme) => setThemeState(next);

  return <ThemeContext.Provider value={{ theme, toggle, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
