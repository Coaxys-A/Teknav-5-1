"use client";

import { useState } from "react";

export function DecoderSidebar() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const decode = () => {
    try {
      const raw = atob(input.trim());
      setOutput(raw);
    } catch {
      try {
        const hex = input.replace(/[^0-9a-fA-F]/g, "");
        const bytes = hex.match(/.{1,2}/g)?.map((b) => String.fromCharCode(parseInt(b, 16))) ?? [];
        setOutput(bytes.join(""));
      } catch {
        setOutput("ورودی نامعتبر");
      }
    }
  };

  const encode = () => {
    try {
      setOutput(btoa(input));
    } catch {
      setOutput("خطا در کدگذاری");
    }
  };

  return (
    <div className="sticky top-6 w-full rounded-xl border border-cyan-700 bg-slate-900/80 text-slate-50 p-4 space-y-3">
      <h3 className="text-sm font-bold text-cyan-300">رمزگشا / رمزگذار فوری</h3>
      <textarea
        className="w-full rounded-lg bg-slate-800/70 border border-cyan-800 px-3 py-2 text-sm focus:outline-none"
        rows={4}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Base64 یا Hex را وارد کنید..."
      />
      <div className="flex gap-2 text-xs">
        <button onClick={decode} className="flex-1 rounded bg-cyan-600 hover:bg-cyan-500 py-2 text-white">Decode</button>
        <button onClick={encode} className="flex-1 rounded bg-emerald-600 hover:bg-emerald-500 py-2 text-white">Encode</button>
      </div>
      <div className="text-[12px] text-slate-200 break-all min-h-[60px] border border-cyan-800 rounded-lg p-2 bg-slate-900/60">
        {output || "خروجی اینجا نمایش داده می‌شود."}
      </div>
    </div>
  );
}
