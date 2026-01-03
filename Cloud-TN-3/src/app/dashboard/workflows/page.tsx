import DashboardShell from "@/components/shells/DashboardShell";
import { PageHeader } from "@/components/ui/PageHeader";
import SimpleTable from "@/components/ui/SimpleTable";
import { requireAny } from "@/lib/rbac";

const workflows = [
  { name: "انتشار + SEO", status: "فعال", trigger: "انتشار", lastRun: "امروز" },
  { name: "هشدار امنیتی WAF", status: "فعال", trigger: "امنیت", lastRun: "امروز" },
  { name: "سینک پلاگین با AI", status: "آزمایشی", trigger: "زمان‌بندی", lastRun: "دیروز" },
];

export default function WorkflowsPage() {
  requireAny(["ADMIN", "OWNER"]);
  return (
    <DashboardShell title="جریان‌های کاری" description="مدیریت تریگرها، اکشن‌ها و وضعیت اجرا">
      <PageHeader title="جریان‌های کاری" description="لیست جریان‌های فعال و درحال توسعه" />
      <div className="mt-4 bg-white/70 dark:bg-slate-900/70 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
        <SimpleTable
          columns={["عنوان", "وضعیت", "تریگر", "آخرین اجرا"]}
          rows={workflows.map((w) => [w.name, w.status, w.trigger, w.lastRun])}
          emptyText="Workflow یافت نشد"
        />
      </div>
    </DashboardShell>
  );
}
