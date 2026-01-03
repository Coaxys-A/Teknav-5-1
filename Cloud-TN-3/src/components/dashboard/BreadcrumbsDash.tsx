import Link from "next/link";

const DASH_LINKS = [
  { href: "/dashboard", label: "خانه" },
  { href: "/dashboard/admin", label: "ادمین" },
  { href: "/dashboard/writer", label: "نویسنده" },
  { href: "/dashboard/owner", label: "مالک" },
  { href: "/dashboard/ai", label: "AI" },
  { href: "/dashboard/plugins", label: "پلاگین‌ها" },
  { href: "/dashboard/articles", label: "مقالات" },
  { href: "/dashboard/analytics", label: "آنالیتیکس" },
  { href: "/dashboard/store", label: "فروشگاه" },
  { href: "/dashboard/workflows", label: "Workflow" },
];

// Pass currentPath from caller; no usePathname here (server-safe)
export function BreadcrumbsDash({ currentPath }: { currentPath: string }) {
  const active = DASH_LINKS.find((l) => currentPath.startsWith(l.href));
  return (
    <div className="text-xs text-slate-400 flex gap-2 items-center">
      <Link href="/dashboard" className="hover:text-slate-200">داشبورد</Link>
      {active && active.href !== "/dashboard" && (
        <>
          <span>/</span>
          <span className="text-slate-200">{active.label}</span>
        </>
      )}
    </div>
  );
}
