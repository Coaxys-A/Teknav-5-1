"use client";

import { useEffect, useState } from "react";

type Plugin = {
  key: string;
  name: string;
  slot: string;
  type: string;
  description?: string;
  isEnabled: boolean;
  config?: any;
};

export default function AdminPluginsPage() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [form, setForm] = useState<Partial<Plugin>>({ type: "banner", slot: "article_sidebar", isEnabled: true });
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/plugins", { cache: "no-store" });
    const json = await res.json();
    if (!json.ok) {
      setMessage(json.error || "دریافت لیست پلاگین‌ها با خطا مواجه شد");
      return;
    }
    setPlugins(json.plugins ?? []);
    setMessage(null);
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    setLoading(true);
    const res = await fetch("/api/admin/plugins", {
      method: "POST",
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setLoading(false);
    if (!json.ok) {
      setMessage(json.error || "ثبت پلاگین با خطا مواجه شد");
      return;
    }
    setMessage("پلاگین ثبت شد");
    setForm({ type: "banner", slot: "article_sidebar", isEnabled: true });
    load();
  }

  async function toggle(key: string, enabled: boolean) {
    await fetch(`/api/admin/plugins/${key}/toggle?enabled=${enabled}`, { method: "POST" });
    load();
  }

  return (
    <div className="space-y-6 px-6 py-10" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold">مدیریت پلاگین‌ها</h1>
        <p className="text-sm text-muted-foreground">تعریف، فعال‌سازی، اسلات و پیکربندی پلاگین‌ها</p>
      </div>
      {message ? <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm">{message}</div> : null}

      <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">کلید</label>
            <input className="w-full rounded-md border px-3 py-2" value={form.key ?? ""} onChange={(e) => setForm({ ...form, key: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">نام</label>
            <input className="w-full rounded-md border px-3 py-2" value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">محل قرارگیری</label>
            <select className="w-full rounded-md border px-3 py-2" value={form.slot} onChange={(e) => setForm({ ...form, slot: e.target.value })}>
              <option value="article_sidebar">سایدبار مقاله</option>
              <option value="article_footer">فوتر مقاله</option>
              <option value="dashboard_right">سایدبار داشبورد</option>
              <option value="news_sidebar">سایدبار اخبار</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">نوع</label>
            <select className="w-full rounded-md border px-3 py-2" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="banner">بنر</option>
              <option value="card">کارت</option>
              <option value="widget">ویجت</option>
            </select>
          </div>
          <div className="space-y-2 flex items-end gap-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">وضعیت</label>
              <input type="checkbox" checked={form.isEnabled ?? true} onChange={(e) => setForm({ ...form, isEnabled: e.target.checked })} />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">توضیحات</label>
          <textarea className="w-full rounded-md border px-3 py-2" rows={2} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">پیکربندی (JSON)</label>
          <textarea
            className="w-full rounded-md border px-3 py-2 font-mono text-xs"
            rows={4}
            value={form.config ? JSON.stringify(form.config, null, 2) : ""}
            onChange={(e) => {
              try {
                const parsed = e.target.value ? JSON.parse(e.target.value) : undefined;
                setForm({ ...form, config: parsed });
                setMessage(null);
              } catch {
                setMessage("JSON نامعتبر است");
              }
            }}
          />
        </div>
        <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50" onClick={save} disabled={loading}>
          ثبت پلاگین
        </button>
      </div>

      <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold">فهرست پلاگین‌ها</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {plugins.map((p) => (
            <div key={p.key} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.key}</p>
                </div>
                <input type="checkbox" checked={p.isEnabled} onChange={(e) => toggle(p.key, e.target.checked)} />
              </div>
              <p className="text-sm text-muted-foreground">{p.description}</p>
              <div className="text-xs text-muted-foreground">اسلات: {p.slot} | نوع: {p.type}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
