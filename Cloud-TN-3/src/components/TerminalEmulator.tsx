"use client";

import { useState } from "react";

export function TerminalEmulator() {
  const [history, setHistory] = useState<string[]>([
    "nmap -sV 10.10.10.5",
    "python exploit.py --rhost 10.10.10.5 --lhost 10.0.0.2",
  ]);
  const [input, setInput] = useState("");

  const run = () => {
    if (!input.trim()) return;
    setHistory((h) => [...h, `$ ${input}`, "خروجی شبیه‌سازی‌شده: فرمان دریافت شد."]);
    setInput("");
  };

  return (
    <div className="rounded-xl border border-emerald-600 bg-slate-900/80 text-emerald-100 font-mono text-sm overflow-hidden shadow-lg">
      <div className="bg-emerald-800/40 px-4 py-2 flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-red-400" />
        <span className="w-3 h-3 rounded-full bg-yellow-400" />
        <span className="w-3 h-3 rounded-full bg-green-400" />
        <span className="text-xs text-emerald-50 ms-auto">ترمینال ایمن (Sandbox)</span>
      </div>
      <div className="px-4 py-3 space-y-1 max-h-64 overflow-auto">
        {history.map((line, idx) => (
          <div key={idx} className="whitespace-pre-wrap">{line}</div>
        ))}
      </div>
      <div className="border-t border-emerald-800 px-4 py-2 flex items-center gap-2">
        <span>$</span>
        <input
          className="flex-1 bg-transparent outline-none text-emerald-50 placeholder:text-emerald-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="nmap -sV 10.10.10.5"
          onKeyDown={(e) => e.key === "Enter" && run()}
        />
        <button onClick={run} className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs">
          اجرا
        </button>
      </div>
    </div>
  );
}
