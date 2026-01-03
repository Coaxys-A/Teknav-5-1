"use client";

import { useState } from "react";

export function Timeline({ items }: { items: { title: string; desc: string; date: string }[] }) {
  const [active, setActive] = useState(0);
  return (
    <div className="flex gap-4">
      <div className="flex flex-col gap-3 border-slate-800 border-s rounded-xl bg-slate-900/70 p-3">
        {items.map((it, idx) => (
          <button
            key={idx}
            onClick={() => setActive(idx)}
            className={`text-right rounded-lg px-3 py-2 text-sm transition ${
              active === idx ? "bg-emerald-700 text-white" : "bg-slate-800/60 text-slate-200 hover:bg-slate-800"
            }`}
          >
            <div className="text-xs text-emerald-200">{it.date}</div>
            <div className="font-semibold">{it.title}</div>
          </button>
        ))}
      </div>
      <div className="flex-1 rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-slate-100 text-sm leading-7">
        <h4 className="text-lg font-bold mb-2">{items[active].title}</h4>
        <p className="text-slate-200">{items[active].desc}</p>
      </div>
    </div>
  );
}
