"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/shells/DashboardShell";
import { PageHeader } from "@/components/ui";

export default function WriterNewArticle() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [status, setStatus] = useState("draft");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nav = [
    { href: "/dashboard/writer", label: "مقاله‌های من" },
    { href: "/dashboard/writer/new", label: "مقاله جدید" },
  ];

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/articles/add", {
        method: "POST",
        body: JSON.stringify({
          title,
          content,
          status,
          metaTitle: seoTitle,
          metaDescription: seoDescription,
        }),
      });
      const json = await res.json();
      if (!json?.ok) throw new Error(json?.error || "خطا در ذخیره");
      router.push("/dashboard/writer");
    } catch (e: any) {
      setError(e?.message || "خطا در ذخیره");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardShell title="مقاله جدید" description="ثبت و ارسال" navItems={nav}>
      <PageHeader title="مقاله جدید" description="عنوان، محتوا و متادیتا را تکمیل کنید." />
      {error && <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{error}</div>}
      <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
        <div className="space-y-1">
          <label className="text-sm text-slate-200">عنوان</label>
          <input
            className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان مقاله"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-slate-200">محتوا</label>
          <textarea
            className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
            rows={12}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="متن مقاله..."
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm text-slate-200">متا عنوان</label>
            <input
              className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="Meta Title"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-slate-200">متا توضیحات</label>
            <input
              className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="Meta Description"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm text-slate-200">وضعیت</label>
          <select
            className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="draft">پیش‌نویس</option>
            <option value="pending">در انتظار</option>
            <option value="published">انتشار</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={submit}
            disabled={saving}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-60"
          >
            ذخیره و ارسال
          </button>
          <Link href="/dashboard/writer" className="text-sm text-slate-200 hover:text-white">
            لغو
          </Link>
        </div>
      </div>
    </DashboardShell>
  );
}
