"use client";

import { useEffect, useMemo, useState } from "react";

type Article = { id: number; title: string; slug: string };
type Locale = { code: string; name: string; direction: string; isDefault: boolean };

export default function AdminTranslationsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [locales, setLocales] = useState<Locale[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<string>("");
  const [selectedLocale, setSelectedLocale] = useState<string>("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [translations, setTranslations] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  async function loadLocales() {
    const res = await fetch("/api/locales");
    const json = await res.json();
    if (!json.ok) {
      setMessage(json.error || "عدم دریافت زبان‌ها");
      return;
    }
    setLocales(json.locales ?? []);
    if (json.locales?.length && !selectedLocale) setSelectedLocale(json.locales[0].code);
  }

  async function loadArticles() {
    const res = await fetch("/api/articles/list", { cache: "no-store" });
    const json = await res.json();
    if (!json.ok) {
      setMessage(json.error || "عدم دریافت مقالات");
      return;
    }
    setArticles(json.articles ?? []);
  }

  async function loadTranslations(articleId: string) {
    if (!articleId) return;
    const res = await fetch(`/api/translations/${articleId}`, { cache: "no-store" });
    const json = await res.json();
    if (!json.ok) {
      setMessage(json.error || "عدم دریافت ترجمه‌ها");
      return;
    }
    setTranslations(json.translations ?? []);
  }

  useEffect(() => {
    loadArticles();
    loadLocales();
  }, []);

  useEffect(() => {
    if (selectedArticle) loadTranslations(selectedArticle);
  }, [selectedArticle]);

  const currentArticle = useMemo(() => articles.find((a) => String(a.id) === selectedArticle), [articles, selectedArticle]);

  async function submit() {
    if (!selectedArticle || !selectedLocale) {
      setMessage("مقاله و زبان را انتخاب کنید");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/translations/${selectedArticle}`, {
      method: "POST",
      body: JSON.stringify({
        localeCode: selectedLocale,
        title,
        slug,
        summary,
        content,
        metaTitle,
        metaDescription,
        status: "draft",
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!json.ok) {
      setMessage(json.error || "ثبت ترجمه ناموفق بود");
      return;
    }
    setMessage("ترجمه ذخیره شد");
    await loadTranslations(selectedArticle);
  }

  return (
    <div className="space-y-8 px-6 py-10" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">مدیریت ترجمه مقالات</h1>
          <p className="text-sm text-muted-foreground">ایجاد و ویرایش ترجمه‌ها برای زبان‌های فعال</p>
        </div>
        <button className="rounded-md border px-4 py-2 text-sm" onClick={() => { loadArticles(); loadLocales(); }}>
          تازه‌سازی
        </button>
      </div>

      {message ? <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm">{message}</div> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <label className="text-sm font-medium">مقاله</label>
          <select className="w-full rounded-md border px-3 py-2" value={selectedArticle} onChange={(e) => setSelectedArticle(e.target.value)}>
            <option value="">انتخاب مقاله</option>
            {articles.map((a) => (
              <option key={a.id} value={String(a.id)}>
                {a.title}
              </option>
            ))}
          </select>
          {currentArticle ? <p className="text-xs text-muted-foreground">اسلاگ اصلی: {currentArticle.slug}</p> : null}
        </div>
        <div className="space-y-3">
          <label className="text-sm font-medium">زبان</label>
          <select className="w-full rounded-md border px-3 py-2" value={selectedLocale} onChange={(e) => setSelectedLocale(e.target.value)}>
            <option value="">انتخاب زبان</option>
            {locales.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name} ({l.code}) {l.isDefault ? "★" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">عنوان</label>
          <input className="w-full rounded-md border px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">اسلاگ</label>
          <input className="w-full rounded-md border px-3 py-2" value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">خلاصه</label>
        <textarea className="w-full rounded-md border px-3 py-2" rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">محتوا</label>
        <textarea className="w-full rounded-md border px-3 py-2" rows={8} value={content} onChange={(e) => setContent(e.target.value)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">متا عنوان</label>
          <input className="w-full rounded-md border px-3 py-2" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">متا توضیح</label>
          <textarea className="w-full rounded-md border px-3 py-2" rows={3} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
        </div>
      </div>

      <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50" onClick={submit} disabled={loading}>
        ذخیره ترجمه
      </button>

      <div className="rounded-xl border bg-card p-4">
        <h3 className="font-semibold mb-3">ترجمه‌های موجود</h3>
        <div className="space-y-2">
          {translations.map((t) => (
            <div key={t.id} className="rounded border p-3 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t.localeCode}</p>
                  <p className="text-muted-foreground">وضعیت: {t.status}</p>
                </div>
                <div className="text-xs text-muted-foreground">به‌روزرسانی: {new Date(t.updatedAt).toLocaleString()}</div>
              </div>
              <div className="mt-2 text-xs">عنوان: {t.title}</div>
              <div className="text-xs">اسلاگ: {t.slug}</div>
              <div className="text-xs">ماشینی: {t.isMachineTranslated ? "بله" : "خیر"} / تایید انسانی: {t.isHumanVerified ? "بله" : "خیر"}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
