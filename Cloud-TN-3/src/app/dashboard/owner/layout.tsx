import type { ReactNode } from 'react';
import { OwnerSidebar, OwnerMobileNav } from '@/components/dashboard/owner/owner-sidebar';

// Owner Layout - Control plane for platform owner
// Provides:
// - Fixed sidebar navigation (desktop)
// - Collapsible navigation (mobile)
// - Reserved regions for topbar, main content
export default function OwnerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <OwnerSidebar />

      {/* Main Content Area */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Mobile Navigation */}
        <OwnerMobileNav />

        {/* Reserved Topbar Region */}
        <header className="border-b bg-card px-4 py-3 lg:px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              کنترل پنل مالک
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>مدیریت</span>
              <span>·</span>
              <span>سیستم</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
