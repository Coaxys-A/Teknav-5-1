'use client';

import { ReactNode } from 'react';
import { OwnerPageHeader } from '@/components/owner/owner-page-header';

export function OwnerPageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-8">
      <OwnerPageHeader
        title={title}
        subtitle={subtitle}
      />
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}
