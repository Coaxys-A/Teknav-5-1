"use client";

import { motion } from "framer-motion";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      className="glass inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-[color:var(--color-brand)] dark:border-slate-700 dark:text-slate-100"
      aria-label="تغییر تم"
    >
      <motion.span
        key={theme}
        initial={{ y: -6, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {theme === "dark" ? "تم روشن" : "تم تاریک"}
      </motion.span>
      <span
        aria-hidden
        className="h-3 w-6 rounded-full border border-slate-200 bg-slate-100 transition-colors dark:border-slate-600 dark:bg-slate-800 flex items-center px-[2px]"
      >
        <span
          className="h-2.5 w-2.5 rounded-full bg-slate-900 transition-all dark:bg-slate-100"
          style={{ transform: theme === "dark" ? "translateX(10px)" : "translateX(0px)" }}
        />
      </span>
    </button>
  );
}
