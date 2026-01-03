'use client';

import Link from "next/link";
import { ownerNav } from "./nav";

export function Topbar() {
  return (
    <header className="flex items-center justify-between border-b bg-background px-4 py-3">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/owner" className="text-base font-semibold">
          Owner Panel
        </Link>
        <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
          <span>Control</span>
          <span>·</span>
          <span>System</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="search"
          placeholder="Search"
          className="h-9 rounded-md border bg-muted px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="hidden items-center gap-1 md:flex">
          {ownerNav.slice(0, 3).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1 text-sm text-muted-foreground hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
