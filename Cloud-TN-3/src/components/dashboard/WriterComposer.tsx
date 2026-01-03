"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cx } from "@/lib/utils";
import useSWR from "swr";

interface WriterComposerProps {
  csrfToken: string;
}

export function WriterComposer({ csrfToken }: WriterComposerProps) {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [mainKeyword, setMainKeyword] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [coverImageId, setCoverImageId] = useState<number | undefined>(undefined);
  const [seoScore, setSeoScore] = useState<number | null>(null);
  const [readability, setReadability] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/articles/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          excerpt,
          csrfToken,
          metaTitle,
          metaDescription,
          mainKeyword,
          categoryId,
          tagIds,
          coverImageId,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "FAILED");
      }
      setStatusMessage("مقاله با موفقیت ثبت شد.");
      setTitle("");
      setExcerpt("");
      setContent("");
      setMetaTitle("");
      setMetaDescription("");
      setMainKeyword("");
      setCategoryId(undefined);
      setTagIds([]);
      setCoverImageId(undefined);
      setSeoScore(null);
      setReadability(null);
    } catch (error) {
      setStatusMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSuggestMeta() {
    if (!content) {
      setStatusMessage("ابتدا محتوا را بنویسید.");
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/suggest-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "خطا در پیشنهاد متا");
      }
      setTitle((prev) => prev || json.title);
      setMetaTitle(json.title);
      setMetaDescription(json.metaDescription);
      setMainKeyword(json.keywords?.[0] ?? "");
      setStatusMessage("پیشنهادهای سئو اعمال شد.");
      if (json.seoScore) setSeoScore(json.seoScore);
    } catch (error) {
      setStatusMessage((error as Error).message);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="title">
          عنوان مقاله
        </label>
        <input
          id="title"
          className="w-full rounded-lg border px-3 py-2"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="موضوع اصلی مقاله"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="excerpt">
          خلاصه ۳ خطی
        </label>
        <textarea
          id="excerpt"
          className="h-20 w-full rounded-lg border px-3 py-2"
          value={excerpt}
          onChange={(event) => setExcerpt(event.target.value)}
          placeholder="خلاصه کوتاه که به سئو هم کمک کند"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="content">
          متن مقاله
        </label>
        <textarea
          id="content"
          className="h-48 w-full rounded-lg border px-3 py-2"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="مقدمه، بدنه و جمع‌بندی را اینجا بنویسید"
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="category">
            دسته
          </label>
          <select
            id="category"
            className="w-full rounded-lg border px-3 py-2"
            value={categoryId ?? ""}
            onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">انتخاب نشده</option>
            {(categories?.categories ?? []).map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="metaTitle">
            عنوان سئو (Meta Title)
          </label>
          <input
            id="metaTitle"
            className="w-full rounded-lg border px-3 py-2"
            value={metaTitle}
            onChange={(event) => setMetaTitle(event.target.value)}
            placeholder="حداکثر ۷۰ کاراکتر"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="mainKeyword">
            کلمه کلیدی اصلی
          </label>
          <input
            id="mainKeyword"
            className="w-full rounded-lg border px-3 py-2"
            value={mainKeyword}
            onChange={(event) => setMainKeyword(event.target.value)}
            placeholder="مثلاً امنیت سایبری"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">تگ‌ها</label>
          <div className="flex flex-wrap gap-2">
            {(tags?.tags ?? []).map((t: any) => {
              const active = tagIds.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() =>
                    setTagIds((prev) => (active ? prev.filter((id) => id !== t.id) : [...prev, t.id]))
                  }
                  className={cx(
                    "rounded-full border px-3 py-1 text-xs",
                    active
                      ? "border-[color:var(--color-brand)] bg-[color:var(--color-brand)]/10 text-[color:var(--color-brand)]"
                      : "border-slate-300 text-slate-600",
                  )}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="metaDescription">
          توضیح متا
        </label>
        <textarea
          id="metaDescription"
          className="h-24 w-full rounded-lg border px-3 py-2"
          value={metaDescription}
          onChange={(event) => setMetaDescription(event.target.value)}
          placeholder="حداکثر ۱۶۰ کاراکتر برای سئو"
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className={cx(
            "rounded-lg border px-4 py-2 text-sm font-semibold",
            aiLoading ? "opacity-70" : "hover:border-[color:var(--color-brand)]",
          )}
          onClick={handleSuggestMeta}
          disabled={aiLoading}
        >
          {aiLoading ? "در حال دریافت..." : "پیشنهاد عنوان/متا/کلمه کلیدی"}
        </button>
        <label className="cursor-pointer rounded-lg border px-4 py-2 text-sm font-semibold hover:border-[color:var(--color-brand)]">
          انتخاب کاور
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const fd = new FormData();
              fd.append("file", file);
              setLoading(true);
              try {
                const res = await fetch("/api/media/upload", { method: "POST", body: fd });
                const json = await res.json();
                if (!res.ok || json.ok === false) throw new Error(json.error ?? "UPLOAD_FAILED");
                setCoverImageId(json.file?.id);
                setStatusMessage("کاور آپلود شد");
              } catch (err) {
                setStatusMessage((err as Error).message);
              } finally {
                setLoading(false);
              }
            }}
          />
        </label>
        {coverImageId && (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            کاور ثبت شد (ID {coverImageId})
          </span>
        )}
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {loading ? "در حال ارسال..." : "ارسال برای بررسی"}
      </button>
      {statusMessage && (
        <motion.p className="text-sm text-muted-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {statusMessage}
        </motion.p>
      )}
    </form>
  );
}
  const { data: categories } = useSWR("/api/categories/list", (url) => fetch(url).then((r) => r.json()));
  const { data: tags } = useSWR("/api/tags/list", (url) => fetch(url).then((r) => r.json()));
