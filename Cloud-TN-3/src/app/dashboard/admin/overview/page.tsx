"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/shells/DashboardShell";
import { StatCard, SectionHeader, SimpleTable, ChartContainer, PillBadge, WidgetContainer } from "@/components/ui";

type OverviewStats = {
  traffic?: number;
  articles?: number;
  plugins?: number;
  systemsOk?: boolean;
  realtimeUsers?: number;
};

type Flag = { key: string; description?: string; enabled: boolean };
type Experiment = { key: string; status: string; variants?: any };

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<OverviewStats>({});
  const [flags, setFlags] = useState<Flag[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);

  useEffect(() => {
    // Fetch summaries (best effort; ignore failures)
    (async () => {
      try {
        const res = await fetch("/api/analytics/summary", { cache: "no-store" });
        const json = await res.json();
        if (json?.ok) {
          setStats({
            traffic: json?.traffic ?? 0,
            articles: json?.articles ?? 0,
            plugins: json?.plugins ?? 0,
            systemsOk: true,
            realtimeUsers: json?.realtime ?? 0,
          });
        }
      } catch {
        setStats((s) => ({ ...s, systemsOk: false }));
      }
      try {
        const res = await fetch("/api/feature-flags", { cache: "no-store" });
        const json = await res.json();
        if (Array.isArray(json)) setFlags(json);
      } catch {}
      try {
        const res = await fetch("/api/experiments", { cache: "no-store" });
        const json = await res.json();
        if (Array.isArray(json)) setExperiments(json);
      } catch {}
    })();
  }, []);

  const nav = [
    { href: "/dashboard/admin", label: "Overview" },
    { href: "/dashboard/admin/plugins", label: "Plugins" },
    { href: "/dashboard/admin/feature-flags", label: "Feature Flags" },
    { href: "/dashboard/admin/experiments", label: "Experiments" },
    { href: "/dashboard/admin/workflows", label: "Workflows" },
    { href: "/dashboard/admin/store", label: "Store" },
  ];

  return (
    <DashboardShell
      title="نمای کلی ادمین"
      description="نمای وضعیت ترافیک، محتوای منتشرشده، افزونه‌ها و سلامت سیستم"
      navItems={nav}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="بازدید امروز" value={stats.traffic ?? "—"} trend={stats.realtimeUsers ? `کاربر زنده: ${stats.realtimeUsers}` : undefined} />
        <StatCard label="مقالات کل" value={stats.articles ?? "—"} />
        <StatCard label="افزونه‌های فعال" value={stats.plugins ?? "—"} trend={stats.systemsOk ? "سیستم OK" : "هشدار سیستم"} />
      </div>

      <SectionHeader title="تحلیل ترافیک" description="روند کلی بازدید و تعامل" />
      <ChartContainer title="ترافیک روزانه" description="به‌روز از /api/analytics/summary">
        <div className="flex h-48 items-center justify-center text-sm text-slate-300">جایگاه چارت (hook to analytics API)</div>
      </ChartContainer>

      <div className="grid gap-4 md:grid-cols-2">
        <WidgetContainer title="Feature Flags" actions={<Link href="/dashboard/admin/feature-flags" className="text-cyan-200 text-xs">مدیریت</Link>}>
          {flags.length === 0 && <div className="text-sm text-slate-400">پرچمی یافت نشد</div>}
          {flags.map((f) => (
            <div key={f.key} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2">
              <div>
                <p className="text-sm text-white">{f.key}</p>
                <p className="text-xs text-slate-400">{f.description}</p>
              </div>
              <PillBadge text={f.enabled ? "فعال" : "غیرفعال"} color={f.enabled ? "emerald" : "rose"} />
            </div>
          ))}
        </WidgetContainer>

        <WidgetContainer title="Experiments" actions={<Link href="/dashboard/admin/experiments" className="text-cyan-200 text-xs">مدیریت</Link>}>
          {experiments.length === 0 && <div className="text-sm text-slate-400">آزمایشی یافت نشد</div>}
          {experiments.map((e) => (
            <div key={e.key} className="rounded-lg border border-white/5 bg-white/5 px-3 py-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white">{e.key}</p>
                <PillBadge text={e.status} color={e.status === "running" ? "emerald" : "slate"} />
              </div>
              <p className="text-xs text-slate-400">واریانت‌ها: {e.variants ? JSON.stringify(e.variants) : "—"}</p>
            </div>
          ))}
        </WidgetContainer>
      </div>

      <SectionHeader title="مقالات اخیر" description="نمای سریع محتوا" />
      <SimpleTable
        columns={[
          { key: "title", header: "عنوان" },
          { key: "status", header: "وضعیت" },
          { key: "author", header: "نویسنده" },
        ]}
        data={[]}
        emptyText="در این نمای سریع داده‌ای بارگذاری نشده"
      />

      <SectionHeader title="سیستم و سلامت" />
      <div className="grid gap-4 md:grid-cols-2">
        <WidgetContainer title="سرورها / Queue" >
          <div className="text-sm text-slate-300">برای اتصال به /api/admin/health یا مانیتور، اینجا خروجی وضعیت را رندر کنید.</div>
        </WidgetContainer>
        <WidgetContainer title="نوتیفیکیشن‌ها">
          <div className="text-sm text-slate-300">نشانگر وضعیت ارسال ایمیل/وب‌پوش در اینجا.</div>
        </WidgetContainer>
      </div>
    </DashboardShell>
  );
}
