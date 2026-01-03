"use client";
import React, { useEffect, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import WidgetContainer from "@/components/ui/WidgetContainer";
import SimpleTable from "@/components/ui/SimpleTable";
import SkeletonRows from "@/components/ui/SkeletonRows";
import ErrorState from "@/components/ui/ErrorState";
import StatCard from "@/components/ui/StatCard";

type Article = { id: number; title: string; status: string; views?: number; updatedAt?: string };

export default function ArticlesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/articles/list");
        if (!res.ok) throw new Error("خطا در بارگذاری مقالات");
        const data = await res.json();
        setArticles(data ?? []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const published = articles.filter((a) => a.status === "published").length;
  const drafts = articles.filter((a) => a.status !== "published").length;
  const totalViews = articles.reduce((s, a) => s + (a.views ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="مدیریت مقالات" description="لیست، وضعیت و آمار" actions={
        <a className="rounded-lg bg-slate-900 px-3 py-2 text-white" href="/dashboard/articles/new">مقاله جدید</a>
      } />

      {loading && <SkeletonRows rows={3} />}
      {error && <ErrorState message={error} />}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard label="منتشر شده" value={published} />
            <StatCard label="پیش‌نویس/در صف" value={drafts} />
            <StatCard label="بازدید کل" value={totalViews} />
          </div>
          <WidgetContainer title="فهرست مقالات">
            <SimpleTable
              columns={[
                { key: "title", header: "عنوان" },
                { key: "status", header: "وضعیت" },
                { key: "views", header: "بازدید" },
                { key: "updatedAt", header: "به‌روزرسانی" },
                {
                  key: "actions",
                  header: "عملیات",
                  render: (a: Article) => (
                    <div className="flex gap-2">
                      <a className="text-blue-600 text-sm" href={`/dashboard/articles/${a.id}`}>ویرایش</a>
                      <a className="text-slate-500 text-sm" href={`/articles/${a.id}`} target="_blank">مشاهده</a>
                    </div>
                  ),
                },
              ]}
              rows={articles as any[]}
            />
          </WidgetContainer>
        </>
      )}
    </div>
  ); 
}
