import React from "react";

interface SkeletonRowsProps {
  rows?: number;
  cols?: number;
}

export default function SkeletonRows({ rows = 5, cols = 3 }: SkeletonRowsProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-8 animate-pulse rounded bg-slate-200/80 dark:bg-slate-800/80" />
          ))}
        </div>
      ))}
    </div>
  );
}
