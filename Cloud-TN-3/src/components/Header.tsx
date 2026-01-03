"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import MobileMenu from "./MobileMenu";
import { site } from "@/lib/seo";
import SrOnly from "./SrOnly";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Globe2, Search } from "lucide-react";
import { NotificationBell } from "./notifications/NotificationBell";

const navItems = [
  { href: "/news", label: "اخبار" },
  { href: "/cyber", label: "امنیت سایبری" },
  { href: "/tech", label: "فناوری" },
  { href: "/tutorials", label: "آموزش‌ها" },
  { href: "/analysis", label: "تحلیل‌ها" },
  { href: "/dashboard", label: "داشبورد" },
  { href: "/about", label: "درباره ما" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);
  const menuId = "mobile-navigation";

  useEffect(() => {
    if (typeof document === "undefined") return;
    const hasToken = document.cookie.split(";").some((c) => c.trim().startsWith("teknav_token="));
    setAuthed(hasToken);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-slate-800 dark:bg-slate-900/80">
      <div className="container-xl flex items-center justify-between gap-4 py-3">
        <Link href="/" className="text-2xl font-extrabold text-[color:var(--color-brand)]" aria-label={`لوگوی ${site.name}`}>
          {site.name}
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-700 dark:text-slate-200" aria-label="ناوبری اصلی">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-[color:var(--color-brand)] focus-visible:text-[color:var(--color-brand)]"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/search?q="
            className="flex items-center justify-center text-lg transition-colors hover:text-[color:var(--color-brand)] focus-visible:text-[color:var(--color-brand)]"
            aria-label="جستجو"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            <SrOnly>جستجو</SrOnly>
          </Link>
          {!authed && (
            <Link
              href="/auth/login"
              className="rounded-lg border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-700 transition-colors hover:text-[color:var(--color-brand)] hover:border-[color:var(--color-brand)]"
            >
              ورود
            </Link>
          )}
        </nav>
        <div className="md:hidden">
          <button
            type="button"
            aria-label="باز کردن منو"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={handleOpen}
            className="rounded-md border border-slate-200 bg-white p-2 text-xl text-slate-700 shadow-sm transition-colors hover:text-[color:var(--color-brand)]"
          >
            ☰
          </button>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <NotificationBell />
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") window.location.href = "https://www.teknavglobal.com";
            }}
            className="rounded-md border border-slate-200 p-2 text-slate-700 transition-colors hover:text-[color:var(--color-brand)]"
            aria-label="Language"
          >
            <Globe2 className="h-4 w-4" />
          </button>
          <ThemeToggle />
        </div>
      </div>
      <MobileMenu id={menuId} open={open} onClose={handleClose} items={navItems} showLogin={!authed} />
    </header>
  );
}
