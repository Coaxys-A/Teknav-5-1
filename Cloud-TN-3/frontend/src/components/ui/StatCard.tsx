import React from 'react';

type Props = { title: string; value: string; trend?: string };

export default function StatCard({ title, value, trend }: Props) {
  return (
    <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 shadow-sm p-4 flex flex-col gap-1">
      <div className="text-xs text-slate-500">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
      {trend && <div className="text-xs text-emerald-600 dark:text-emerald-400">{trend}</div>}
    </div>
  );
}
