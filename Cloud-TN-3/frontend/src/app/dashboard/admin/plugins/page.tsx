import React from 'react';
import Link from 'next/link';
import DashboardShell from '@/components/shells/DashboardShell';
import { PageHeader } from '@/components/ui/PageHeader';
import SimpleTable from '@/components/ui/SimpleTable';

async function fetchPlugins() {
  try {
    const res = await fetch('/api/admin/plugins', { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function PluginsPage() {
  const plugins = await fetchPlugins();
  const rows = Array.isArray(plugins)
    ? plugins.map((p: any) => [p.name, p.key, p.type, p.isEnabled ? 'فعال' : 'غیرفعال'])
    : [];
  return (
    <DashboardShell>
      <PageHeader title="پلاگین‌ها" description="مدیریت و انتشار" />
      <div className="mb-4">
        <Link href="/dashboard/admin/plugins/new" className="text-blue-600 text-sm">افزودن پلاگین</Link>
      </div>
      <div className="bg-white/70 dark:bg-slate-900/70 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
        <SimpleTable columns={['نام', 'کلید', 'نوع', 'وضعیت']} rows={rows.length ? rows : [['-','-','-','-']]} />
      </div>
    </DashboardShell>
  );
}
