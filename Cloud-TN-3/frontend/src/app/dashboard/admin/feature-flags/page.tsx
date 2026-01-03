import React from 'react';
import DashboardShell from '@/components/shells/DashboardShell';
import { PageHeader } from '@/components/ui/PageHeader';
import SimpleTable from '@/components/ui/SimpleTable';

async function fetchFlags() {
  try {
    const res = await fetch('/api/feature-flags', { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function FeatureFlagsPage() {
  const flags = await fetchFlags();
  const rows = Array.isArray(flags)
    ? flags.map((f: any) => [f.key, f.enabled ? 'فعال' : 'غیرفعال', f.rollout ?? '-', f.description ?? '-'])
    : [];
  return (
    <DashboardShell>
      <PageHeader title="پرچم‌ها و فیچرها" description="مدیریت rollout و آزمایش" />
      <div className="bg-white/70 dark:bg-slate-900/70 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
        <SimpleTable columns={['کلید', 'وضعیت', 'درصد', 'توضیح']} rows={rows.length ? rows : [['-','-','-','-']]} />
      </div>
    </DashboardShell>
  );
}
