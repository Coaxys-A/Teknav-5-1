"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

type NavItem = { href: string; label: string };

interface MobileMenuProps {
  id: string;
  open: boolean;
  onClose: () => void;
  items: NavItem[];
  showLogin?: boolean;
}

const focusableSelectors = ["a[href]", "button:not([disabled])", "[tabindex]:not([tabindex='-1'])"].join(",");

export default function MobileMenu({ id, open, onClose, items, showLogin = true }: MobileMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;

    previousFocus.current = document.activeElement;
    const node = containerRef.current;
    const focusable = node?.querySelectorAll<HTMLElement>(focusableSelectors);
    focusable?.[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "Tab" && focusable && focusable.length > 0) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocus.current instanceof HTMLElement) {
        previousFocus.current.focus();
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div role="presentation" className="fixed inset-0 z-50 bg-black/40" onClick={onClose}>
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-menu-title"
        id={id}
        tabIndex={-1}
        className="fixed inset-y-0 right-0 w-80 max-w-full overflow-y-auto bg-white p-6 shadow-xl focus:outline-none"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <span id="mobile-menu-title" className="text-lg font-bold text-slate-900">
            ناوبری
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 px-3 py-1 text-sm text-slate-700 transition-colors hover:text-[color:var(--color-brand)]"
          >
            بستن
          </button>
        </div>
        <nav className="flex flex-col gap-4 text-slate-700" aria-label="ناوبری موبایل">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="text-base transition-colors hover:text-[color:var(--color-brand)] focus-visible:text-[color:var(--color-brand)]"
            >
              {item.label}
            </Link>
          ))}
          {showLogin && (
            <Link
              href="/auth/login"
              onClick={onClose}
              className="text-base font-semibold text-[color:var(--color-brand)] transition-colors hover:text-[color:var(--color-brand)]"
            >
              ورود
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
