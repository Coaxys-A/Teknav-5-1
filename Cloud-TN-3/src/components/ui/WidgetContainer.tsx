import React from "react";

interface WidgetContainerProps {
  title?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function WidgetContainer({ title, actions, children }: WidgetContainerProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-sm shadow-cyan-500/10">
      {(title || actions) && (
        <header className="mb-3 flex items-center justify-between">
          {title && <h4 className="text-sm font-semibold text-white">{title}</h4>}
          {actions}
        </header>
      )}
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export default WidgetContainer;
