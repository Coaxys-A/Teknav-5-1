import type { ReactNode } from 'react';

// Placeholder components for future data integration
// These provide extensible structure without implementing logic

export function PlaceholderSlot({
  type = 'content',
  className = '',
}: {
  type?: 'chart' | 'table' | 'filter' | 'content';
  className?: string;
}) {
  return (
    <div
      data-placeholder={type}
      className={`min-h-32 rounded-lg border-2 border-dashed bg-muted/50 flex items-center justify-center ${className}`}
    >
      <span className="text-sm text-muted-foreground">
        {type === 'chart' && 'نمای نمودار'}
        {type === 'table' && 'جدول داده‌ها'}
        {type === 'filter' && 'فیلترها'}
        {type === 'content' && 'محتوا'}
      </span>
    </div>
  );
}

export function PlaceholderStatCard() {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      <div className="mt-2 h-8 w-32 animate-pulse rounded bg-muted/50" />
    </div>
  );
}

export function PlaceholderTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-lg border">
      <div className="h-12 border-b bg-muted/50" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex h-12 border-b last:border-0 animate-pulse">
          <div className="w-8 mx-4 h-4 rounded bg-muted" />
          <div className="flex-1 h-4 mx-4 rounded bg-muted/30" />
          <div className="w-20 mx-4 h-4 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

export function PlaceholderFilterBar() {
  return (
    <div className="flex gap-4 items-center">
      <div className="flex-1 h-10 animate-pulse rounded bg-muted" />
      <div className="h-10 w-32 animate-pulse rounded bg-muted" />
      <div className="h-10 w-24 animate-pulse rounded bg-muted" />
    </div>
  );
}

export function PlaceholderTabs({ count = 3 }: { count?: number }) {
  return (
    <div className="flex gap-2 border-b">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={i === 0 ? 'h-10 w-24 border-b-2 border-primary' : 'h-10 w-24 animate-pulse border-muted'}
        />
      ))}
    </div>
  );
}
