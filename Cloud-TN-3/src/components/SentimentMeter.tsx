"use client";

export function SentimentMeter({ sentiment = 0.5, reliability = 0.7 }: { sentiment?: number; reliability?: number }) {
  const s = Math.min(1, Math.max(0, sentiment));
  const r = Math.min(1, Math.max(0, reliability));
  return (
    <div className="grid gap-3 md:grid-cols-2 rounded-xl border border-amber-700 bg-slate-900/70 p-4 text-sm text-slate-100">
      <div>
        <div className="flex items-center justify-between text-amber-200">
          <span>حس‌سنج خبر</span>
          <span>{Math.round(s * 100)}٪</span>
        </div>
        <div className="h-2 rounded-full bg-slate-800 overflow-hidden mt-2">
          <div className="h-full bg-amber-400" style={{ width: `${s * 100}%` }} />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between text-emerald-200">
          <span>شاخص اعتبار منبع</span>
          <span>{Math.round(r * 100)}٪</span>
        </div>
        <div className="h-2 rounded-full bg-slate-800 overflow-hidden mt-2">
          <div className="h-full bg-emerald-400" style={{ width: `${r * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
