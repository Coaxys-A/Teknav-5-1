import React from 'react';
import Link from 'next/link';
import DashboardShell from '@/components/shells/DashboardShell';
import { PageHeader } from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import SectionHeader from '@/components/ui/SectionHeader';
import SimpleTable from '@/components/ui/SimpleTable';

async function fetchJSON(path: string) {
  try {
    const res = await fetch(path, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function OwnerPage() {
  const health = await fetchJSON('/api/admin/health');
  const users = await fetchJSON('/api/users/list');

  return (
    <DashboardShell>
      <PageHeader title="پنل مالک" description="نمای کلی سلامت سیستم و کاربران" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="وضعیت API" value={health?.status ?? 'نامشخص'} trend={health?.uptime ?? ''} />
        <StatCard label="زمان پاسخ" value={health?.responseTime ?? 'نامشخص'} />
        <StatCard label="نسخه" value={health?.version ?? 'نامشخص'} />
      </div>

      <div className="mt-8">
        <SectionHeader title="کاربران اخیر" action={<Link href="/dashboard/admin/users" className="text-sm text-blue-600">مدیریت کاربران</Link>} />
        <div className="bg-white/60 dark:bg-slate-900/60 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
          <SimpleTable
            columns={['نام', 'ایمیل', 'نقش', 'وضعیت']}
            rows={
              users?.items?.map((u: any) => [u.name ?? '-', u.email, u.role, u.status]) ??
              [['-','-','-','-']]
            }
          />
        </div>
      </div>
    </DashboardShell>
  );
}
