'use client';

import { Badge } from '@/components/ui/badge';
import { Check, X, AlertCircle } from 'lucide-react';

export function TenantStatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: 'default' | 'outline' | 'destructive'; icon: React.ReactNode; text: string }> = {
    ACTIVE: { variant: 'outline', icon: <Check className="h-3 w-3" />, text: 'Active' },
    DISABLED: { variant: 'destructive', icon: <X className="h-3 w-3" />, text: 'Disabled' },
    SUSPENDED: { variant: 'outline', icon: <AlertCircle className="h-3 w-3" />, text: 'Suspended' },
  };

  const config = variants[status] || variants['ACTIVE'];

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      {config.icon}
      <span className="text-xs font-medium">{config.text}</span>
    </Badge>
  );
}
