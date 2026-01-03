"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { ThemeToggle } from "../ThemeToggle";

type NavItem = { href: string; label: string; badge?: string };

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "خانه" },
  { href: "/dashboard/writer", label: "نویسنده" },
  { href: "/dashboard/admin", label: "ادمین" },
  { href: "/dashboard/owner", label: "مالک" },
  { href: "/dashboard/plugins", label: "پلاگین‌ها" },
  { href: "/dashboard/ai", label: "AI" },
  { href: "/dashboard/analytics", label: "آنالیتیکس" },
  { href: "/dashboard/workflows", label: "Workflow" },
  { href: "/dashboard/store", label: "فروشگاه" },
  { href: "/dashboard/docs", label: "مستندات" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const active = useMemo(() => {
    const current = NAV_ITEMS.find((item) => pathname.startsWith(item.href));
    return current?.href ?? "/dashboard";
  }, [pathname]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
        <div className="container-xl flex items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[color:var(--color-brand)]/10 px-3 py-1 text-xs font-semibold text-[color:var(--color-brand)]">
              Teknav Dash
            </span>
            <span className="text-sm text-slate-600">مرکز کنترل و مدیریت Teknav</span>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <ThemeToggle />
            <Link href="/dashboard/owner" className="rounded-md border px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">
              پنل مالک
            </Link>
            <Link
              href="/auth/logout"
              className="rounded-md bg-[color:var(--color-brand)] px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-[color:var(--color-brand-dark)]"
            >
              خروج
            </Link>
          </div>
          <button
            type="button"
            className="md:hidden rounded-md border px-3 py-1.5 text-sm"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "بستن" : "منو"}
          </button>
        </div>
        <nav className="hidden border-t border-slate-200 bg-white md:block">
          <div className="container-xl flex items-center gap-1 overflow-x-auto py-2 text-sm text-slate-700">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-md px-3 py-2 transition-colors ${
                  active === item.href
                    ? "bg-[color:var(--color-brand)]/10 text-[color:var(--color-brand)]"
                    : "hover:bg-slate-100"
                }`}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </nav>
        {open && (
          <nav className="border-t border-slate-200 bg-white md:hidden">
            <div className="container-xl flex flex-col gap-1 py-2 text-sm text-slate-700">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 transition-colors ${
                    active === item.href
                      ? "bg-[color:var(--color-brand)]/10 text-[color:var(--color-brand)]"
                      : "hover:bg-slate-100"
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>
      <main className="container-xl py-8">{children}</main>
    </div>
  );
}

export default AppShell;
