'use client';

import { ownerNav } from "./nav";
import { NavLink } from "./nav-link";

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card lg:flex lg:flex-col">
      <div className="px-4 py-5 text-lg font-semibold">Teknav Owner</div>
      <nav className="flex flex-1 flex-col gap-1 px-2 pb-4">
        {ownerNav.map((item) => (
          <NavLink key={item.href} href={item.href} label={item.label} />
        ))}
      </nav>
    </aside>
  );
}
