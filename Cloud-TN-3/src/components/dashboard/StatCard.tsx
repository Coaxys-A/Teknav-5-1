interface StatCardProps {
  title: string;
  value: string;
  trend?: string;
  hint?: string;
  change?: 'positive' | 'negative' | 'neutral';
}

export function StatCard({ title, value, trend, hint, change }: StatCardProps) {
  const trendColor = change === 'positive' ? 'text-green-600' : change === 'negative' ? 'text-red-600' : 'text-gray-600';

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
      {trend && <p className={`mt-1 text-xs ${trendColor}`}>{trend}</p>}
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
