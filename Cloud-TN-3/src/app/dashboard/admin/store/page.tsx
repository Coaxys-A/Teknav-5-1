import { AdminStorePanel } from "@/components/dashboard/AdminStorePanel";

export default function StoreAdminPage() {
  return (
    <section className="px-6 py-10" dir="rtl">
      <div className="mb-6 text-right">
        <h1 className="text-3xl font-bold">فروشگاه، سفارش‌ها و کیف پول</h1>
        <p className="text-muted-foreground">مدیریت محصولات، سفارش‌ها، اشتراک‌ها و جریان مالی.</p>
      </div>
      <AdminStorePanel />
    </section>
  );
}
