import DashboardShell from "@/components/shells/DashboardShell";
import { PageHeader } from "@/components/ui/PageHeader";
import SimpleTable from "@/components/ui/SimpleTable";
import Link from "next/link";
import { requireAny } from "@/lib/rbac";

const plugins = [
  { name: "حفاظت لاگ", category: "امنیت", status: "فعال" },
  { name: "تحلیل محتوا", category: "AI", status: "فعال" },
];

export default function PluginsPage() {
  requireAny(["ADMIN", "OWNER"]);
  return (
    <DashboardShell title="پلاگین‌ها" description="مدیریت، نصب و لاگ اجرای پلاگین">
      <PageHeader
        title="پلاگین‌ها"
        description="لیست افزونه‌ها"
        actions={<Link href="/dashboard/admin/plugins" className="text-sm text-blue-600">جزئیات ادمین</Link>}
      />
      <div className="bg-white/70 dark:bg-slate-900/70 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
        <SimpleTable
          columns={["نام", "دسته", "وضعیت"]}
          rows={plugins.map((p) => [p.name, p.category, p.status])}
          emptyText="پلاگینی ثبت نشده"
        />
      </div>
    </DashboardShell>
  );
}
