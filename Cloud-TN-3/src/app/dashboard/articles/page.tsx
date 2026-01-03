import DashboardShell from "@/components/shells/DashboardShell";
import { PageHeader } from "@/components/ui/PageHeader";
import SimpleTable from "@/components/ui/SimpleTable";
import Link from "next/link";
import { requireAny } from "@/lib/rbac";

async function fetchArticles() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL ?? ''}/api/articles/list`, { cache: "no-store" });
    const json = await res.json();
    return json?.items ?? [];
  } catch {
    return [];
  }
}

export default async function ArticlesDashboardPage() {
  requireAny(["ADMIN", "OWNER", "WRITER"]);
  const articles = await fetchArticles();
  return (
    <DashboardShell title="مقالات" description="مدیریت، انتشار و آنالیز مقاله">
      <PageHeader
        title="مقالات"
        description="نمای کلی وضعیت محتوا"
        actions={<Link href="/dashboard/writer/new" className="text-sm text-blue-600">افزودن مقاله</Link>}
      />
      <div className="bg-white/70 dark:bg-slate-900/70 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
        <SimpleTable
          columns={["عنوان", "وضعیت", "به‌روزرسانی"]}
          rows={articles.map((a: any) => [a.title, a.status ?? "-", a.updatedAt ?? "-"])}
          emptyText="مقاله‌ای نیست"
        />
      </div>
    </DashboardShell>
  );
}
