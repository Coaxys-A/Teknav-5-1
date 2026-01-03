"use client";

import { useState } from "react";

const defaultStack = [
  { addr: "0x0012FF70", val: "RET -> 0x401200" },
  { addr: "0x0012FF74", val: "EBP -> 0x0012FFA0" },
  { addr: "0x0012FF78", val: "SHELLCODE PTR" },
  { addr: "0x0012FF7C", val: "0x90909090" },
  { addr: "0x0012FF80", val: "0xCC90CC90" },
];

const defaultHeap = [
  { addr: "0x10020000", val: "\\x90\\x90\\x90\\x90" },
  { addr: "0x10020010", val: "\\x31\\xC0\\x50\\x68" },
  { addr: "0x10020020", val: "\\x2F\\x2F\\x73\\x68" },
  { addr: "0x10020030", val: "\\x68\\x2F\\x62\\x69" },
  { addr: "0x10020040", val: "\\x6E\\x89\\xE3\\x50" },
];

export function ShellcodeVisualizer() {
  const [selected, setSelected] = useState<{ region: "stack" | "heap"; idx: number } | null>(null);
  const stack = defaultStack;
  const heap = defaultHeap;
  const current =
    selected?.region === "stack"
      ? stack[selected.idx]
      : selected?.region === "heap"
      ? heap[selected.idx]
      : null;

  return (
    <div className="grid gap-4 lg:grid-cols-3 rounded-xl border border-amber-700 bg-slate-900/80 p-4 text-slate-100">
      <div>
        <div className="text-amber-300 text-sm font-bold mb-2">Stack</div>
        <div className="space-y-2">
          {stack.map((row, idx) => (
            <button
              key={row.addr}
              onClick={() => setSelected({ region: "stack", idx })}
              className={`w-full text-left px-3 py-2 rounded-lg border ${
                selected?.region === "stack" && selected.idx === idx
                  ? "border-amber-400 bg-amber-900/40"
                  : "border-slate-700 bg-slate-800/60 hover:bg-slate-800"
              } font-mono text-xs`}
            >
              <div className="text-amber-200">{row.addr}</div>
              <div className="text-slate-200">{row.val}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-emerald-300 text-sm font-bold mb-2">Heap (Shellcode)</div>
        <div className="space-y-2">
          {heap.map((row, idx) => (
            <button
              key={row.addr}
              onClick={() => setSelected({ region: "heap", idx })}
              className={`w-full text-left px-3 py-2 rounded-lg border ${
                selected?.region === "heap" && selected.idx === idx
                  ? "border-emerald-400 bg-emerald-900/40"
                  : "border-slate-700 bg-slate-800/60 hover:bg-slate-800"
              } font-mono text-xs`}
            >
              <div className="text-emerald-200">{row.addr}</div>
              <div className="text-slate-200">{row.val}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4 text-sm">
        <div className="text-xs text-slate-400 mb-2">پیش‌نمایش / تفسیر</div>
        {current ? (
          <div className="space-y-2">
            <div className="font-mono text-emerald-200">{current.addr}</div>
            <div className="font-mono text-slate-50">{current.val}</div>
            <p className="text-slate-300 leading-6">
              روی هر آدرس در Stack یا Heap کلیک کنید تا مقدار و مسیر اجرای احتمالی را ببینید. این بلوک برای تمرین شناسایی
              Pivot و تحلیل جریان اجرای شل‌کد شبیه‌سازی شده است.
            </p>
          </div>
        ) : (
          <p className="text-slate-400">یک آدرس را انتخاب کنید.</p>
        )}
      </div>
    </div>
  );
}
