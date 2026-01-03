"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ApiKeyItem = { id: number; scopes: any; rateLimit?: number; expiresAt?: string };

export default function AdminApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);

  useEffect(() => {
    fetch("/api/api-keys", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then(setKeys)
      .catch(() => setKeys([]));
  }, []);

  return (
    <main className="p-6 space-y-6" dir="rtl">
      <header className="space-y-2 text-right">
        <h1 className="text-2xl font-bold">کلیدهای API</h1>
        <p className="text-sm text-slate-400">ایجاد، مدیریت و محدودسازی دسترسی کلاینت‌ها.</p>
      </header>

      <div className="flex gap-3 flex-wrap">
        <Link href="/dashboard/admin" className="rounded-lg border px-4 py-2 text-sm">بازگشت</Link>
        <button className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm hover:bg-emerald-500">
          ایجاد کلید جدید
        </button>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-right space-y-3">
        <div className="grid grid-cols-4 gap-3 text-slate-300 font-semibold">
          <span>شناسه</span><span>سطح دسترسی</span><span>Rate Limit</span><span>انقضا</span>
        </div>
        {keys.map((k) => (
          <div key={k.id} className="grid grid-cols-4 gap-3 rounded-lg bg-slate-800/60 p-3 text-slate-100">
            <span>{k.id}</span>
            <span>{Array.isArray(k.scopes) ? k.scopes.join(", ") : "—"}</span>
            <span>{k.rateLimit ?? 1000}</span>
            <span>{k.expiresAt ? new Date(k.expiresAt).toLocaleDateString("fa-IR") : "نامحدود"}</span>
          </div>
        ))}
        {keys.length === 0 && <div className="text-slate-400 text-xs">هیچ کلیدی ثبت نشده است.</div>}
      </div>
    </main>
  );
}
