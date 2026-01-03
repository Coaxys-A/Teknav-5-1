"use client";

import { useEffect, useState } from "react";

type Workspace = { workspace: { id: number; name: string; slug: string } };

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/workspaces", { cache: "no-store" });
    const json = await res.json();
    if (!json.ok) {
      setMessage(json.error || "دریافت ورک‌اسپیس‌ها ناموفق بود");
      return;
    }
    setWorkspaces(json.workspaces ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    const res = await fetch("/api/workspaces", { method: "POST", body: JSON.stringify({ name, slug }) });
    const json = await res.json();
    if (!json.ok) {
      setMessage(json.error || "ایجاد ناموفق بود");
      return;
    }
    setMessage("ایجاد شد");
    setName("");
    setSlug("");
    load();
  }

  return (
    <div className="space-y-6 px-6 py-10" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold">ورک‌اسپیس‌ها</h1>
        <p className="text-sm text-muted-foreground">مدیریت چندتایی فضاها/برندها.</p>
      </div>
      {message ? <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm">{message}</div> : null}

      <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">نام</label>
            <input className="w-full rounded-md border px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">اسلاگ</label>
            <input className="w-full rounded-md border px-3 py-2" value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>
        </div>
        <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground" onClick={create}>
          ایجاد ورک‌اسپیس
        </button>
      </div>

      <div className="rounded-xl border bg-card p-4 shadow-sm space-y-2">
        <h2 className="text-lg font-semibold">فهرست</h2>
        {workspaces.map((w) => (
          <div key={w.workspace.id} className="rounded-md border p-3 text-sm">
            <div className="font-semibold">{w.workspace.name}</div>
            <div className="text-xs text-muted-foreground">{w.workspace.slug}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
