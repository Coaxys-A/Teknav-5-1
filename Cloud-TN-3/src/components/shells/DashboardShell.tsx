"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

type NavItem = { href: string; label: string; icon?: React.ReactNode };

interface DashboardShellProps {
  title?: string;
  description?: string;
  navItems?: NavItem[];
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function DashboardShell({
  title = "داشبورد",
  description,
  navItems = [],
  children,
  actions,
}: DashboardShellProps) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(59,130,246,0.08),transparent_32%),radial-gradient(circle_at_75%_10%,rgba(16,185,129,0.08),transparent_28%),radial-gradient(circle_at_50%_85%,rgba(236,72,153,0.06),transparent_30%)] pointer-events-none" />
      <div className="relative z-10 flex min-h-screen">
        <aside className="hidden w-64 flex-shrink-0 border-l border-white/5 bg-slate-900/60 backdrop-blur lg:block">
          <div className="p-5 text-lg font-bold text-cyan-200">Teknav Console</div>
          <nav className="flex flex-col px-3 text-sm">
            {navItems.map((item) => {
              const active = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`mb-1 flex items-center gap-2 rounded-lg px-3 py-2 transition ${
                    active
                      ? "bg-cyan-500/10 text-cyan-100 border border-cyan-500/40"
                      : "text-slate-200 hover:text-cyan-100 hover:bg-white/5"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="flex-1">
          <header className="sticky top-0 z-20 border-b border-white/5 bg-slate-900/70 px-6 py-4 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-white">{title}</h1>
                {description && <p className="mt-1 text-sm text-slate-300">{description}</p>}
              </div>
              <div className="flex items-center gap-3">{actions}</div>
            </div>
          </header>
          <main className="p-6 space-y-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

export default DashboardShell;
