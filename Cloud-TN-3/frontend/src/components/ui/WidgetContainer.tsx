import React from "react";

type Props = { title?: string; actions?: React.ReactNode; children?: React.ReactNode };

export default function WidgetContainer({ title, actions, children }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <div className="flex items-start justify-between">
        {title && <div className="font-semibold text-slate-900">{title}</div>}
        {actions}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}
