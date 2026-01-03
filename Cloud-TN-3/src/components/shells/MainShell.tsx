"use client";

import React from "react";
import Link from "next/link";

type MainShellProps = {
  children: React.ReactNode;
  hero?: React.ReactNode;
};

const nav = [
  { href: "/", label: "خانه" },
  { href: "/tech", label: "فناوری" },
  { href: "/cyber", label: "امنیت" },
  { href: "/analysis", label: "تحلیل" },
  { href: "/dashboard", label: "داشبورد" },
];

export default function MainShell({ children, hero }: MainShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900" dir="rtl">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-lg font-bold text-slate-900">
            Teknav
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-blue-600">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      {hero && <div className="border-b border-slate-200 bg-gradient-to-l from-slate-100 to-white">{hero}</div>}
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      <footer className="mt-12 border-t border-slate-200 bg-white/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-slate-500">
          <div className="flex gap-3">
            <Link href="/about" className="hover:text-blue-600">
              درباره
            </Link>
            <Link href="/contact" className="hover:text-blue-600">
              تماس
            </Link>
            <Link href="/dashboard" className="hover:text-blue-600">
              داشبورد
            </Link>
          </div>
          <p>© {new Date().getFullYear()} Teknav</p>
        </div>
      </footer>
    </div>
  );
}
