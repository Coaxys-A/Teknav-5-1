"use client";

import { useState } from "react";

interface Props {
  content: string;
  onApply: (text: string) => void;
}

export function AiToolsPanel({ content, onApply }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<{ title?: string; metaDescription?: string; keywords?: string[] }>({});

  async function call(path: string) {
    setLoading(path);
    setMessage(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      }).then((r) => r.json());
      if (!res || res.error) throw new Error(res.error || "خطا");
      if (res.summary) {
        onApply(res.summary);
        setMessage("خلاصه آماده شد و اعمال شد.");
      } else if (res.text) {
        onApply(res.text);
        setMessage("بازنویسی اعمال شد.");
      } else if (res.title || res.metaDescription) {
        setMetadata({ title: res.title, metaDescription: res.metaDescription, keywords: res.keywords });
        setMessage("متادیتا پیشنهاد شد.");
      }
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" dir="rtl">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">دستیار هوش مصنوعی</h3>
        {message && <span className="text-xs text-slate-600">{message}</span>}
      </div>
      <div className="grid gap-2 text-sm">
        <button
          disabled={!!loading}
          onClick={() => call("/api/ai/summarize")}
          className="rounded-lg border px-3 py-2 text-right hover:bg-slate-50 disabled:opacity-60"
        >
          {loading === "/api/ai/summarize" ? "در حال خلاصه‌سازی..." : "خلاصه‌سازی سریع"}
        </button>
        <button
          disabled={!!loading}
          onClick={() => call("/api/ai/rewrite")}
          className="rounded-lg border px-3 py-2 text-right hover:bg-slate-50 disabled:opacity-60"
        >
          {loading === "/api/ai/rewrite" ? "در حال بازنویسی..." : "بازنویسی و بهبود لحن"}
        </button>
        <button
          disabled={!!loading}
          onClick={() => call("/api/ai/suggest-metadata")}
          className="rounded-lg border px-3 py-2 text-right hover:bg-slate-50 disabled:opacity-60"
        >
          {loading === "/api/ai/suggest-metadata" ? "در حال پیشنهاد متا..." : "پیشنهاد عنوان و متای سئو"}
        </button>
      </div>
      {metadata.title && (
        <div className="rounded-lg bg-slate-50 p-3 text-xs text-right text-slate-700">
          <div>عنوان پیشنهادی: {metadata.title}</div>
          <div className="mt-1">متا: {metadata.metaDescription}</div>
          {metadata.keywords && <div className="mt-1">کلیدواژه‌ها: {metadata.keywords.join("، ")}</div>}
        </div>
      )}
    </div>
  );
}
