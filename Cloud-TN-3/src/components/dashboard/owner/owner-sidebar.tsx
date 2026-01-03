'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { OWNER_NAV_ITEMS, ALL_OWNER_ROUTES } from './config';
import type { NavGroup, NavItem } from './config';

export function OwnerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col border-l bg-card lg:flex">
      <div className="flex h-16 items-center border-b px-4">
        <span className="text-lg font-bold text-foreground">پنل مالک</span>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {OWNER_NAV_ITEMS.map((group: NavGroup) => (
          <div key={group.title} className="space-y-2">
            <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.items.map((item: NavItem) => {
                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t p-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <span>← بازگشت به داشبورد</span>
        </Link>
      </div>
    </aside>
  );
}

export function OwnerMobileNav() {
  const pathname = usePathname();

  return (
    <div className="flex h-16 items-center justify-between border-b bg-card px-4 lg:hidden">
      <div className="flex items-center gap-2">
        <span className="text-base font-bold text-foreground">پنل مالک</span>
      </div>

      <div className="flex gap-2">
        {ALL_OWNER_ROUTES.slice(0, 4).map((item: NavItem) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
