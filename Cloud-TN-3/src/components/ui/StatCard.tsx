import React from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  icon?: React.ReactNode;
}

export function StatCard({ label, value, trend, icon }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-sm shadow-cyan-500/10">
      <div className="flex items-center gap-3 text-slate-300">
        {icon && <div className="text-cyan-300">{icon}</div>}
        <div className="text-xs">{label}</div>
      </div>
      <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
      {trend && <div className="mt-1 text-xs text-emerald-300">{trend}</div>}
    </div>
  );
}

export default StatCard;
