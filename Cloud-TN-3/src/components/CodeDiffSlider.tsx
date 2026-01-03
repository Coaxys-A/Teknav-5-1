"use client";

import { useState } from "react";

export function CodeDiffSlider({
  before,
  after,
}: {
  before: string;
  after: string;
}) {
  const [ratio, setRatio] = useState(50);
  return (
    <div className="rounded-xl border border-indigo-700 bg-slate-900/80 p-4 shadow-lg space-y-3">
      <div className="flex items-center justify-between text-xs text-indigo-200">
        <span>قبل</span>
        <input
          type="range"
          min={0}
          max={100}
          value={ratio}
          onChange={(e) => setRatio(Number(e.target.value))}
          className="flex-1 mx-4 accent-indigo-400"
        />
        <span>بعد</span>
      </div>
      <div className="grid md:grid-cols-2 gap-3 text-[12px] font-mono leading-6">
        <pre className="bg-slate-950/80 rounded-lg p-3 overflow-auto border border-slate-800">
          {before}
        </pre>
        <pre className="bg-slate-950/80 rounded-lg p-3 overflow-auto border border-slate-800 opacity-90">
          {after.slice(0, Math.max(10, Math.floor((after.length * ratio) / 100)))}
          {ratio < 100 ? "\n...\n" : ""}
        </pre>
      </div>
    </div>
  );
}
