"use client";

import { useI18n } from "@/app/providers";

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        onClick={() => setLocale("fa")}
        className={`rounded px-2 py-1 ${locale === "fa" ? "bg-slate-900 text-white" : "border border-slate-200"}`}
      >
        فارسی
      </button>
      <button
        onClick={() => setLocale("en")}
        className={`rounded px-2 py-1 ${locale === "en" ? "bg-slate-900 text-white" : "border border-slate-200"}`}
      >
        EN
      </button>
    </div>
  );
}
