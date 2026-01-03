"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Agent = { id: number; key: string; status: string; description?: string };

export default function AdminAiPage() {
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    fetch("/api/agents", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then(setAgents)
      .catch(() => setAgents([]));
  }, []);

  return (
    <main className="p-6 space-y-6" dir="rtl">
      <header className="space-y-2 text-right">
        <h1 className="text-2xl font-bold">مدیریت هوش مصنوعی و Agentها</h1>
        <p className="text-sm text-slate-400">فعال‌سازی/غیرفعال‌سازی عامل‌ها، پیگیری اجرا و تنظیم ورودی‌ها.</p>
      </header>

      <div className="flex gap-3 flex-wrap">
        <Link href="/dashboard/admin" className="rounded-lg border px-4 py-2 text-sm">بازگشت</Link>
        <button className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm hover:bg-emerald-500">
          ایجاد ورک‌فلو جدید
        </button>
        <Link href="/dashboard/admin/workflows" className="rounded-lg border px-4 py-2 text-sm">گردش‌کارها</Link>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3 text-sm text-right">
        <div className="grid grid-cols-4 gap-3 font-semibold text-slate-200">
          <span>شناسه</span><span>کلید</span><span>وضعیت</span><span>توضیح</span>
        </div>
        {agents.map((a) => (
          <div key={a.id} className="grid grid-cols-4 gap-3 rounded-lg bg-slate-800/60 p-3 text-slate-100">
            <span>{a.id}</span>
            <span className="font-mono">{a.key}</span>
            <span>{a.status}</span>
            <span>{a.description ?? "—"}</span>
          </div>
        ))}
        {agents.length === 0 && <div className="text-xs text-slate-400">هیچ Agent فعالی ثبت نشده است.</div>}
      </div>
    </main>
  );
}
