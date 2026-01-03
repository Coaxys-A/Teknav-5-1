"use client";

import React, { useEffect, useState } from "react";
import DashboardShell from "@/components/shells/DashboardShell";
import { PageHeader } from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import SimpleTable from "@/components/ui/SimpleTable";
import TabBar from "@/components/ui/TabBar";
import SkeletonRows from "@/components/ui/SkeletonRows";

export default function AiStudioPage() {
  const [tab, setTab] = useState("chat");
  const [agents, setAgents] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [memory, setMemory] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const resA = await fetch("/api/ai/agents", { cache: "no-store" });
        const jsonA = await resA.json();
        setAgents(Array.isArray(jsonA) ? jsonA : jsonA?.items ?? []);
      } catch {
        setAgents([]);
      }
      try {
        const resT = await fetch("/api/ai/tasks?limit=20", { cache: "no-store" });
        const jsonT = await resT.json();
        setTasks(Array.isArray(jsonT) ? jsonT : jsonT?.items ?? []);
      } catch {
        setTasks([]);
      }
      try {
        const resM = await fetch("/api/ai/memory?scope=long", { cache: "no-store" });
        const jsonM = await resM.json();
        setMemory(Array.isArray(jsonM) ? jsonM : jsonM?.items ?? []);
      } catch {
        setMemory([]);
      }
      try {
        const resModel = await fetch("/api/ai/models", { cache: "no-store" });
        const jsonModel = await resModel.json();
        setModels(Array.isArray(jsonModel) ? jsonModel : jsonModel?.items ?? []);
      } catch {
        setModels([]);
      }
    })();
  }, []);

  return (
    <DashboardShell title="AI Studio" description="مرکز مدیریت Agentها، ابزارها و مدل‌ها">
      <PageHeader title="AI Studio" description="پایش و اجرای وظایف هوش مصنوعی" />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Agentها" value={agents.length.toString()} />
        <StatCard label="تسک‌ها" value={tasks.length.toString()} />
        <StatCard label="حافظه" value={memory.length.toString()} />
        <StatCard label="مدل‌ها" value={models.length.toString()} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <TabBar
            tabs={[
              { key: "chat", label: "چت" },
              { key: "tasks", label: "تسک‌ها" },
              { key: "agents", label: "Agentها" },
            ]}
            active={tab}
            onChange={(k) => setTab(k)}
          />
          <div className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
            <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              {tab === "chat" ? "چت زنده" : tab === "tasks" ? "تسک‌ها" : "Agentها"}
            </h3>
            {tab === "chat" && <SkeletonRows rows={4} cols={1} />}
            {tab === "tasks" && (
              <SimpleTable
                columns={["نوع", "وضعیت", "زمان"]}
                rows={tasks.map((t: any) => [t.type, t.status, t.updatedAt ?? "-"])}
                emptyText="تسکی یافت نشد"
              />
            )}
            {tab === "agents" && (
              <SimpleTable
                columns={["نام", "نوع", "وضعیت"]}
                rows={agents.map((a: any) => [a.name, a.kind, a.enabled ? "فعال" : "غیرفعال"])}
                emptyText="Agentی یافت نشد"
              />
            )}
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
            <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">حافظه</h3>
            <SimpleTable
              columns={["برچسب", "اهمیت", "به‌روزرسانی"]}
              rows={memory.map((m: any) => [m.tags?.join(",") ?? "-", m.importance ?? "-", m.updatedAt ?? "-"])}
              emptyText="حافظه‌ای ثبت نشده"
            />
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
            <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">مدل‌های در دسترس</h3>
            <SimpleTable
              columns={["مدل", "سرویس", "وضعیت"]}
              rows={models.map((m: any) => [m.name, m.provider, m.status])}
              emptyText="مدلی یافت نشد"
            />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
            <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Agentها</h3>
            <SimpleTable
              columns={["نام", "وضعیت"]}
              rows={agents.slice(0, 5).map((a: any) => [a.name, a.enabled ? "فعال" : "غیرفعال"])}
              emptyText="Agentی نیست"
            />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
            <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">تسک‌های اخیر</h3>
            <SimpleTable
              columns={["نوع", "وضعیت", "زمان"]}
              rows={tasks.slice(0, 5).map((t: any) => [t.type, t.status, t.updatedAt ?? "-"])}
              emptyText="تسکی نیست"
            />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
