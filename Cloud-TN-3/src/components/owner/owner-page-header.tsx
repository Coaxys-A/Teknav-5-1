'use client';

import { Button } from '@/components/ui/button';
import { Plus, Filter } from 'lucide-react';

export function OwnerPageHeader({
  title,
  subtitle,
  actionLabel,
  actionIcon: ActionIcon,
  onAction,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionIcon?: React.ElementType<React.SVGProps<never>>;
  onAction?: () => void;
}) {
  return (
    <div className="mb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {actionLabel && onAction && (
          <Button onClick={onAction} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {actionLabel}
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2 border-b pb-4">
        <Button variant="ghost" size="sm">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>
    </div>
  );
}
