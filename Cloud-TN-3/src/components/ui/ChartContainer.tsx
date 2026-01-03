import React from "react";

interface ChartContainerProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function ChartContainer({ title, description, children }: ChartContainerProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-sm shadow-cyan-500/10">
      <div className="mb-3 space-y-1">
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        {description && <p className="text-xs text-slate-400">{description}</p>}
      </div>
      <div className="min-h-[240px]">{children}</div>
    </section>
  );
}
