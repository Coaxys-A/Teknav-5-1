"use client";
import React, { useEffect, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import WidgetContainer from "@/components/ui/WidgetContainer";
import SimpleTable from "@/components/ui/SimpleTable";
import SkeletonRows from "@/components/ui/SkeletonRows";
import ErrorState from "@/components/ui/ErrorState";

export default function AiDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [a, t] = await Promise.all([
          fetch("/api/ai/agents"),
          fetch("/api/ai/tasks").catch(() => ({ ok: false, json: async () => [] })),
        ]);
        if (!a.ok) throw new Error("خطا در دریافت ایجنت‌ها");
        const agentsData = await a.json();
        const tasksData = t.ok ? await t.json() : [];
        setAgents(agentsData ?? []);
        setTasks(tasksData ?? []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="داشبورد هوش مصنوعی" description="نمای کلی ایجنت‌ها و وظایف" actions={
        <a className="rounded-lg bg-slate-900 px-3 py-2 text-white" href="/dashboard/ai/studio">ورود به استودیو</a>
      } />
      {loading && <SkeletonRows rows={3} />}
      {error && <ErrorState message={error} />}
      {!loading && !error && (
        <>
          <WidgetContainer title="ایجنت‌ها">
            <SimpleTable
              columns={[
                { key: "name", header: "نام" },
                { key: "kind", header: "نوع" },
                { key: "enabled", header: "فعال", render: (r: any) => (r.enabled ? "بله" : "خیر") },
              ]}
              rows={agents as any[]}
            />
          </WidgetContainer>
          <WidgetContainer title="آخرین وظایف">
            <SimpleTable
              columns={[
                { key: "type", header: "نوع" },
                { key: "status", header: "وضعیت" },
                { key: "createdAt", header: "تاریخ" },
              ]}
              rows={tasks as any[]}
            />
          </WidgetContainer>
        </>
      )}
    </div>
  );
}
