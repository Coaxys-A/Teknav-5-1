import DashboardShell from "@/components/shells/DashboardShell";
import { PageHeader } from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import SimpleTable from "@/components/ui/SimpleTable";
import Link from "next/link";
import { requireAny } from "@/lib/rbac";

const metrics = [
  { name: "بازدید امروز", value: "۸,۴۲۰" },
  { name: "میانگین زمان ماندگاری", value: "۳:۴۵" },
  { name: "عمق اسکرول", value: "۶۸٪" },
  { name: "منابع ترافیک", value: "Organic 54٪" },
];

const topArticles = [
  { title: "موج جدید ARM", views: "۲,۱۵۰", ctr: "۳.۱٪" },
  { title: "باج‌افزار چندمرحله‌ای", views: "۱,۸۹۰", ctr: "۴.۲٪" },
];

export default function AnalyticsPage() {
  requireAny(["ADMIN", "OWNER"]);
  return (
    <DashboardShell title="تحلیل و آمار" description="ترافیک، تعامل، عملکرد مقالات">
      <PageHeader title="تحلیل و آمار" description="مرور سریع رفتار کاربران و کیفیت محتوا" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <StatCard key={m.name} label={m.name} value={m.value} />
        ))}
      </div>
      <div className="mt-6 bg-white/70 dark:bg-slate-900/70 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
        <SimpleTable
          columns={["مقاله", "بازدید", "CTR"]}
          rows={topArticles.map((a) => [a.title, a.views, a.ctr])}
          emptyText="داده‌ای موجود نیست"
        />
      </div>
      <div className="mt-4 text-xs text-blue-600">
        <Link href="/dashboard">بازگشت به داشبورد</Link>
      </div>
    </DashboardShell>
  );
}
