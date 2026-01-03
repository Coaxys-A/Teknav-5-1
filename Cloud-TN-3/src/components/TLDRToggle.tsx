"use client";

import { useState } from "react";

export function TLDRToggle({ bullets }: { bullets: string[] }) {
  const [show, setShow] = useState(false);
  return (
    <div className="rounded-xl border border-amber-600 bg-amber-50 text-amber-900 p-3 text-right space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-sm">خلاصه مدیریتی (TL;DR)</span>
        <button
          className="rounded-lg px-3 py-1 text-xs bg-amber-600 text-white hover:bg-amber-500"
          onClick={() => setShow((s) => !s)}
        >
          {show ? "نمایش متن کامل" : "نمایش ۳ گلوله‌ای"}
        </button>
      </div>
      {show && (
        <ul className="list-disc list-inside space-y-1 text-sm">
          {bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
