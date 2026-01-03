import React from 'react';
import Link from 'next/link';
import DashboardShell from '@/components/shells/DashboardShell';
import { PageHeader } from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import WidgetContainer from '@/components/ui/WidgetContainer';

export default function AdminPage() {
  return (
    <DashboardShell>
      <PageHeader title="پنل ادمین" description="نمای کلی و دسترسی سریع" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="بازدید امروز" value="—" trend="در حال بارگذاری" />
        <StatCard label="کاربران فعال" value="—" />
        <StatCard label="خطاهای گزارش‌شده" value="—" trend="در حال بارگذاری" />
      </div>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <WidgetContainer title="پرچم‌ها و فیچرها">
          <Link href="/dashboard/admin/feature-flags" className="text-blue-600 text-sm">مدیریت فیچرها</Link>
        </WidgetContainer>
        <WidgetContainer title="آزمایش‌ها (Experiments)">
          <Link href="/dashboard/admin/experiments" className="text-blue-600 text-sm">آزمایش‌ها</Link>
        </WidgetContainer>
        <WidgetContainer title="پلاگین‌ها">
          <Link href="/dashboard/admin/plugins" className="text-blue-600 text-sm">لیست پلاگین‌ها</Link>
        </WidgetContainer>
        <WidgetContainer title="هوش مصنوعی">
          <Link href="/dashboard/admin/ai" className="text-blue-600 text-sm">مدیریت مدل‌ها</Link>
        </WidgetContainer>
      </div>
    </DashboardShell>
  );
}
