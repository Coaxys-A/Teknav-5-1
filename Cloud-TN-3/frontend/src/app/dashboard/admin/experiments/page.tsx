import React from 'react';
import DashboardShell from '@/components/shells/DashboardShell';
import { PageHeader } from '@/components/ui/PageHeader';
import SimpleTable from '@/components/ui/SimpleTable';

async function fetchExperiments() {
  try {
    const res = await fetch('/api/experiments', { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function ExperimentsPage() {
  const exps = await fetchExperiments();
  const rows = Array.isArray(exps)
    ? exps.map((e: any) => [e.key, e.status, e.variants?.length ?? 0, e.description ?? '-'])
    : [];
  return (
    <DashboardShell>
      <PageHeader title="آزمایش‌ها" description="A/B و چندمتغیره" />
      <div className="bg-white/70 dark:bg-slate-900/70 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
        <SimpleTable columns={['کلید', 'وضعیت', 'تعداد واریانت', 'توضیح']} rows={rows.length ? rows : [['-','-','-','-']]} />
      </div>
    </DashboardShell>
  );
}
