import React from "react";
import "../../globals.css";

export const metadata = {
  title: "Teknav Dashboard",
  description: "Teknav admin dashboard",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="bg-slate-50 text-slate-900">
        <div className="flex min-h-screen">
          <aside className="w-64 border-l border-slate-200 bg-white p-4">
            <div className="text-lg font-bold mb-4">Teknav</div>
            <nav className="space-y-2 text-sm">
              <a className="block rounded-lg px-3 py-2 hover:bg-slate-100" href="/dashboard/admin">ادمین</a>
              <a className="block rounded-lg px-3 py-2 hover:bg-slate-100" href="/dashboard/writer">نویسنده</a>
              <a className="block rounded-lg px-3 py-2 hover:bg-slate-100" href="/dashboard/owner">مالک</a>
              <a className="block rounded-lg px-3 py-2 hover:bg-slate-100" href="/dashboard/admin/plugins">پلاگین‌ها</a>
              <a className="block rounded-lg px-3 py-2 hover:bg-slate-100" href="/dashboard/admin/feature-flags">Feature Flags</a>
              <a className="block rounded-lg px-3 py-2 hover:bg-slate-100" href="/dashboard/admin/experiments">Experiments</a>
              <a className="block rounded-lg px-3 py-2 hover:bg-slate-100" href="/dashboard/analytics">آنالیتیکس</a>
              <a className="block rounded-lg px-3 py-2 hover:bg-slate-100" href="/dashboard/workflows">گردش‌کار</a>
              <a className="block rounded-lg px-3 py-2 hover:bg-slate-100" href="/dashboard/store">فروشگاه</a>
              <a className="block rounded-lg px-3 py-2 hover:bg-slate-100" href="/dashboard/articles">مقالات</a>
              <a className="block rounded-lg px-3 py-2 hover:bg-slate-100" href="/dashboard/ai">داشبورد هوش</a>
              <a className="block rounded-lg px-3 py-2 hover:bg-slate-100" href="/dashboard/ai/studio">استودیو هوش</a>
            </nav>
          </aside>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
