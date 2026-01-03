import type { ReactNode } from 'react';
import { AppShell } from '@/components/dashboard/AppShell';

// Dashboard Layout - Extensible shell for all dashboard routes
// Provides global navigation and main container
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      {children}
    </AppShell>
  );
}
