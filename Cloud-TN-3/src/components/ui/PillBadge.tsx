import React from "react";

interface PillBadgeProps {
  text: string;
  color?: "cyan" | "emerald" | "rose" | "slate";
}

export function PillBadge({ text, color = "cyan" }: PillBadgeProps) {
  const palette: Record<string, string> = {
    cyan: "bg-cyan-500/15 text-cyan-200 border-cyan-500/30",
    emerald: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
    rose: "bg-rose-500/15 text-rose-200 border-rose-500/30",
    slate: "bg-slate-500/15 text-slate-200 border-slate-500/30",
  };
  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${palette[color]}`}>{text}</span>;
}
