"use client";

import React, { useMemo, useState } from "react";

type Mode = "base64" | "hex";

export function DecoderBlock() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("base64");

  const output = useMemo(() => {
    if (!input.trim()) return "";
    try {
      if (mode === "base64") {
        return atob(input.trim());
      }
      return Buffer.from(input.trim(), "hex").toString("utf-8");
    } catch {
      return "خطا در تبدیل";
    }
  }, [input, mode]);

  return (
    <div className="space-y-2 rounded-xl border border-white/10 bg-slate-900/70 p-4">
      <div className="flex items-center gap-3 text-sm text-slate-200">
        <span>دیکدر</span>
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setMode("base64")}
            className={`rounded-full px-3 py-1 ${mode === "base64" ? "bg-cyan-500/20 text-cyan-100" : "bg-white/5 text-slate-200"}`}
          >
            Base64
          </button>
          <button
            type="button"
            onClick={() => setMode("hex")}
            className={`rounded-full px-3 py-1 ${mode === "hex" ? "bg-cyan-500/20 text-cyan-100" : "bg-white/5 text-slate-200"}`}
          >
            Hex
          </button>
        </div>
      </div>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="h-28 w-full rounded-lg border border-white/10 bg-slate-950/60 p-3 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
        placeholder="رشته را وارد کنید..."
      />
      <div className="rounded-lg border border-white/10 bg-slate-950/70 p-3 text-sm text-emerald-100">
        {output || "خروجی اینجا نمایش داده می‌شود"}
      </div>
    </div>
  );
}
