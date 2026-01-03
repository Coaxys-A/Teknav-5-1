import DashboardShell from "@/components/shells/DashboardShell";
import { PageHeader } from "@/components/ui/PageHeader";
import SimpleTable from "@/components/ui/SimpleTable";
import { requireAny } from "@/lib/rbac";

const products = [
  { name: "اشتراک پریمیوم", price: "۹۹٬۰۰۰ تومان", status: "فعال" },
  { name: "گزارش فنی", price: "۴۹٬۰۰۰ تومان", status: "آزمایشی" },
];

export default function StorePage() {
  requireAny(["ADMIN", "OWNER"]);
  return (
    <DashboardShell title="فروشگاه و محصولات" description="مدیریت محصولات دیجیتال، لایسنس و سفارشات">
      <PageHeader title="فروشگاه" description="محصولات، قیمت، لایسنس و سفارشات" />
      <div className="bg-white/70 dark:bg-slate-900/70 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
        <SimpleTable
          columns={["محصول", "قیمت", "وضعیت"]}
          rows={products.map((p) => [p.name, p.price, p.status])}
          emptyText="محصولی ثبت نشده"
        />
      </div>
    </DashboardShell>
  );
}
