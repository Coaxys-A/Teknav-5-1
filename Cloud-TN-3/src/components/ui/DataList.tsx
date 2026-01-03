import React from "react";

interface DataListItem {
  label: string;
  value: React.ReactNode;
}

export function DataList({ items }: { items: DataListItem[] }) {
  return (
    <dl className="grid gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="space-y-1">
          <dt className="text-xs text-slate-400">{item.label}</dt>
          <dd className="text-sm font-semibold text-white">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
