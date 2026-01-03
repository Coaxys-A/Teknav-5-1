import Link from "next/link";
import DashboardShell from "@/components/shells/DashboardShell";
import { PageHeader } from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import SimpleTable from "@/components/ui/SimpleTable";
import { requireRole } from "@/lib/rbac";

async function fetchArticles() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL ?? ''}/api/articles/list?limit=20`, { cache: "no-store" });
    const json = await res.json();
    return json?.items ?? [];
  } catch {
    return [];
  }
}

export default async function WriterDashboardPage() {
  requireRole("WRITER");
  const articles = await fetchArticles();
  const published = articles.filter((a: any) => a.status?.toUpperCase?.() === "PUBLISHED").length;
  const drafts = articles.filter((a: any) => a.status?.toUpperCase?.() === "DRAFT").length;
  const pending = articles.filter((a: any) => a.status?.toUpperCase?.() === "PENDING").length;

  return (
    <DashboardShell title="داشبورد نویسنده" description="مدیریت نوشته‌ها، پیش‌نویس‌ها و صف انتشار">
      <PageHeader
        title="داشبورد نویسنده"
        description="لیست مقالات، وضعیت انتشار و دسترسی سریع به ویرایشگر"
        actions={<Link href="/dashboard/writer/new" className="text-sm text-blue-600">ایجاد مقاله جدید</Link>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="کل مقالات" value={articles.length.toString()} />
        <StatCard label="منتشرشده" value={published.toString()} />
        <StatCard label="پیش‌نویس" value={drafts.toString()} trend={`در انتظار بررسی: ${pending}`} />
      </div>

      <div className="mt-6 bg-white/70 dark:bg-slate-900/70 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
        <SimpleTable
          columns={["عنوان", "وضعیت", "به‌روزرسانی"]}
          rows={articles.map((a: any) => [a.title, a.status, a.updatedAt ?? "-"])}
          emptyText="هیچ مقاله‌ای یافت نشد"
        />
      </div>
    </DashboardShell>
  );
}
