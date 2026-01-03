import React from "react";
import DashboardShell from "@/components/shells/DashboardShell";
import { PageHeader } from "@/components/ui/PageHeader";
import SimpleTable from "@/components/ui/SimpleTable";
import TabBar from "@/components/ui/TabBar";
import ErrorState from "@/components/ui/ErrorState";

async function fetchPlugin(key: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL ?? ''}/api/admin/plugins?key=${key}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    if (Array.isArray(json)) return json.find((p: any) => p.key === key);
    return json;
  } catch {
    return null;
  }
}

async function fetchLogs(pluginId: number) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL ?? ''}/api/plugins/logs?pluginId=${pluginId}`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function PluginDetailPage({ params }: { params: { key: string } }) {
  const plugin = await fetchPlugin(params.key);
  const logs = plugin?.id ? await fetchLogs(plugin.id) : [];

  if (!plugin) {
    return (
      <DashboardShell title="پلاگین">
        <ErrorState message="پلاگین یافت نشد" />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title={`پلاگین: ${plugin.name}`} description={plugin.description}>
      <PageHeader title={plugin.name} description={plugin.description} />
      <TabBar tabs={[{ key: "info", label: "اطلاعات" }, { key: "logs", label: "لاگ‌ها" }]} active="info" onChange={() => {}} />

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">جزئیات</h3>
          <SimpleTable
            columns={["کلید", "نوع", "وضعیت", "دسته"]}
            rows={[[plugin.key, plugin.type, plugin.isEnabled ? "فعال" : "غیرفعال", plugin.category?.name ?? "-"]]}
          />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">نسخه‌ها</h3>
          <SimpleTable
            columns={["نسخه", "وضعیت", "تاریخ انتشار"]}
            rows={plugin.versions?.map((v: any) => [v.version, v.status ?? "published", v.publishedAt ?? "-"]) ?? []}
            emptyText="نسخه‌ای نیست"
          />
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">لاگ‌های اجرا</h3>
        <SimpleTable
          columns={["وضعیت", "پیام", "زمان"]}
          rows={logs?.map((l: any) => [l.status, l.message ?? "-", l.createdAt ?? "-"]) ?? []}
          emptyText="لاگی ثبت نشده است"
        />
      </div>
    </DashboardShell>
  );
}
