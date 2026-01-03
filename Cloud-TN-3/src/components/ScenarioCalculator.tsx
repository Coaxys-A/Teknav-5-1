"use client";

import { useMemo, useState } from "react";

export function ScenarioCalculator() {
  const [entry, setEntry] = useState(100);
  const [target, setTarget] = useState(130);
  const [risk, setRisk] = useState(90);
  const [volume, setVolume] = useState(1);

  const reward = useMemo(() => ((target - entry) / entry) * 100, [target, entry]);
  const drawdown = useMemo(() => ((entry - risk) / entry) * 100, [entry, risk]);
  const positionSize = useMemo(() => (volume * 0.01 * entry).toFixed(2), [volume, entry]);

  return (
    <div className="rounded-xl border border-indigo-700 bg-slate-900/70 p-4 text-sm text-slate-100 space-y-3">
      <h3 className="text-lg font-bold text-indigo-200 text-right">ماشین‌حساب سناریو</h3>
      <div className="grid md:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs text-right">
          قیمت ورود
          <input
            type="number"
            className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
            value={entry}
            onChange={(e) => setEntry(Number(e.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-right">
          تارگت
          <input
            type="number"
            className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-right">
          حد ضرر
          <input
            type="number"
            className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
            value={risk}
            onChange={(e) => setRisk(Number(e.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-right">
          حجم (بر اساس ریسک %)
          <input
            type="number"
            className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
          />
        </label>
      </div>
      <div className="grid md:grid-cols-3 gap-3 text-xs text-right">
        <div className="rounded-lg bg-slate-800/60 border border-indigo-800 p-3">
          <div className="text-indigo-200">Reward %</div>
          <div className="text-lg font-bold">{reward.toFixed(2)}٪</div>
        </div>
        <div className="rounded-lg bg-slate-800/60 border border-rose-800 p-3">
          <div className="text-rose-200">Drawdown %</div>
          <div className="text-lg font-bold">{drawdown.toFixed(2)}٪</div>
        </div>
        <div className="rounded-lg bg-slate-800/60 border border-emerald-800 p-3">
          <div className="text-emerald-200">حجم دلاری تقریبی</div>
          <div className="text-lg font-bold">${positionSize}</div>
        </div>
      </div>
    </div>
  );
}
