"use client";

import React from "react";

interface TerminalBlockProps {
  title?: string;
  children: React.ReactNode;
}

export function TerminalBlock({ title = "Terminal", children }: TerminalBlockProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/80 text-green-200 shadow-inner shadow-emerald-500/10">
      <div className="flex items-center gap-2 border-b border-white/5 px-3 py-2 text-xs text-slate-300">
        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-rose-400" />
        <span className="ml-2">{title}</span>
      </div>
      <div className="overflow-x-auto px-4 py-3 font-mono text-sm leading-7">{children}</div>
    </div>
  );
}
