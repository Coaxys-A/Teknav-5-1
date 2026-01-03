"use client";

import { useMemo, useState } from "react";

function generateSeries(len = 40) {
  const data: number[] = [];
  let v = 100;
  for (let i = 0; i < len; i++) {
    v += (Math.random() - 0.5) * 4;
    data.push(Math.round(v * 100) / 100);
  }
  return data;
}

export function LiveChart() {
  const [series] = useState(generateSeries());
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState(0);

  const view = useMemo(() => {
    const size = Math.max(10, Math.floor(series.length / zoom));
    return series.slice(offset, offset + size);
  }, [series, zoom, offset]);

  const max = Math.max(...view);
  const min = Math.min(...view);
  const scale = max === min ? 1 : max - min;

  return (
    <div className="rounded-xl border border-indigo-700 bg-slate-900/70 p-4 space-y-3 text-right text-slate-100">
      <div className="flex items-center justify-between text-xs">
        <span>چارت زنده (نمونه)</span>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1">
            زوم
            <input
              type="range"
              min={1}
              max={4}
              step={0.5}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="accent-indigo-400"
            />
          </label>
          <label className="flex items-center gap-1">
            جابه‌جایی
            <input
              type="range"
              min={0}
              max={Math.max(0, series.length - 10)}
              value={offset}
              onChange={(e) => setOffset(Number(e.target.value))}
              className="accent-indigo-400"
            />
          </label>
        </div>
      </div>
      <svg viewBox="0 0 100 40" className="w-full h-40 bg-slate-950/60 rounded-lg border border-slate-800">
        {view.map((v, i) => {
          const x = (i / Math.max(1, view.length - 1)) * 100;
          const y = 40 - ((v - min) / (scale || 1)) * 36 - 2;
          return <circle key={i} cx={x} cy={y} r={0.9} fill="#7dd3fc" />;
        })}
        {view.length > 1 && (
          <polyline
            fill="none"
            stroke="#a855f7"
            strokeWidth="0.7"
            points={view
              .map((v, i) => {
                const x = (i / Math.max(1, view.length - 1)) * 100;
                const y = 40 - ((v - min) / (scale || 1)) * 36 - 2;
                return `${x},${y}`;
              })
              .join(" ")}
          />
        )}
      </svg>
      <div className="text-xs text-slate-400 flex items-center justify-between">
        <span>High: {max.toFixed(2)}</span>
        <span>Low: {min.toFixed(2)}</span>
        <span>Length: {view.length}</span>
      </div>
    </div>
  );
}
