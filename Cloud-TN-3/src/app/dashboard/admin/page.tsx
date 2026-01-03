import Link from "next/link";
import DashboardShell from "@/components/shells/DashboardShell";
import { PageHeader } from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import WidgetContainer from "@/components/ui/WidgetContainer";
import { requireRole } from "@/lib/rbac";

export default async function AdminDashboardPage() {
  requireRole("ADMIN");
  return (
    <DashboardShell title="داشبورد ادمین" description="مدیریت تنظیمات، پرچم‌ها، پلاگین‌ها و جریان‌های کاری">
      <PageHeader title="داشبورد ادمین" description="کنترل کامل روی پلتفرم، کاربران، پرچم‌ها و تجربیات" />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="درخواست‌های امروز" value="۲۴,۳۸۰" trend="+۳٪" />
        <StatCard label="پلاگین‌های فعال" value="۱۲" />
        <StatCard label="Feature Flags فعال" value="۱۸" trend="۲ مورد تازه" />
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <WidgetContainer title="پرچم‌های ویژگی (Feature Flags)">
          <Link href="/dashboard/admin/feature-flags" className="text-blue-600 text-sm">مدیریت پرچم‌ها</Link>
        </WidgetContainer>
        <WidgetContainer title="تجربیات و آزمایش‌ها">
          <Link href="/dashboard/admin/experiments" className="text-blue-600 text-sm">مدیریت A/B و چندمتغیره</Link>
        </WidgetContainer>
        <WidgetContainer title="پلاگین‌ها و اکستنشن‌ها">
          <Link href="/dashboard/admin/plugins" className="text-blue-600 text-sm">مدیریت و نصب پلاگین</Link>
        </WidgetContainer>
        <WidgetContainer title="AI Studio">
          <Link href="/dashboard/ai/studio" className="text-blue-600 text-sm">باز کردن AI Studio</Link>
        </WidgetContainer>
        <WidgetContainer title="جریان‌های کاری (Workflows)">
          <Link href="/dashboard/admin/workflows" className="text-blue-600 text-sm">مدیریت و تریگرها</Link>
        </WidgetContainer>
        <WidgetContainer title="فروشگاه و محصولات">
          <Link href="/dashboard/admin/store" className="text-blue-600 text-sm">محصولات دیجیتال، لایسنس، سفارشات</Link>
        </WidgetContainer>
      </div>
    </DashboardShell>
  );
}
