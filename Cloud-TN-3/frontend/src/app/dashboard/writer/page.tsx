import React from 'react';
import Link from 'next/link';
import DashboardShell from '@/components/shells/DashboardShell';
import { PageHeader } from '@/components/ui/PageHeader';
import SimpleTable from '@/components/ui/SimpleTable';
import StatCard from '@/components/ui/StatCard';

async function fetchArticles() {
  try {
    const res = await fetch('/api/articles/list?limit=20', { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items ?? [];
  } catch {
    return [];
  }
}

export default async function WriterPage() {
  const articles = await fetchArticles();
  const rows = Array.isArray(articles)
    ? articles.map((a: any) => [a.title, a.status, a.reviewStatus ?? '-', a.updatedAt ?? '-'])
    : [];

  return (
    <DashboardShell>
      <PageHeader title="داشبورد نویسنده" description="مقالات و عملکرد" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="کل مقالات" value={articles.length.toString()} />
        <StatCard label="منتشر شده" value={articles.filter((a: any) => a.status === 'PUBLISHED').length.toString()} />
        <StatCard label="پیش‌نویس" value={articles.filter((a: any) => a.status === 'DRAFT').length.toString()} />
      </div>
      <div className="my-4">
        <Link href="/dashboard/writer/new" className="text-sm text-blue-600">مقاله جدید</Link>
      </div>
      <div className="bg-white/70 dark:bg-slate-900/70 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
        <SimpleTable columns={['عنوان', 'وضعیت', 'بازبینی', 'آخرین بروزرسانی']} rows={rows.length ? rows : [['-','-','-','-']]} />
      </div>
    </DashboardShell>
  );
}
