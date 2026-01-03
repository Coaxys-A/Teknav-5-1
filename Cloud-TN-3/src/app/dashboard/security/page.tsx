import { PanelCard } from "@/components/dashboard/PanelCard";
import { SecurityPanel } from "@/components/dashboard/SecurityPanel";

export default function SecurityDashboardPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900">امنیت و دسترسی</h1>
        <p className="text-sm text-slate-600">
          خط‌مشی‌های Zero-Trust، نشست‌ها، WAF، محافظت API و ممیزی رفتار.
        </p>
      </header>

      <PanelCard title="حالت سریع امنیت" description="وضعیت به‌روز و اقدام‌های اولویت‌دار.">
        <SecurityPanel
          items={[
            { title: "اعتبارسنجی JWT + رفرش توکن", status: "safe", detail: "چرخش دوره‌ای فعال" },
            { title: "گزارش SIEM", status: "warn", detail: "بررسی رویدادهای مشکوک منطقه اقیانوسیه" },
            { title: "Rate-limit API", status: "safe", detail: "سقف ۶۰ درخواست/دقیقه فعال" },
            { title: "سیاست MFA", status: "action", detail: "الزام MFA برای ادمین در حال آماده‌سازی" },
          ]}
        />
      </PanelCard>

      <PanelCard title="اقدام‌های پیشنهادی" description="گام‌های بعد برای سخت‌سازی بیشتر.">
        <ul className="list-disc space-y-2 pr-5 text-sm text-slate-700">
          <li>فعال‌سازی Device Fingerprint برای نشست‌های ادمین و مالک.</li>
          <li>اتصال لاگ‌ها به مخزن متمرکز (ELK یا Cloud Logging) و تعریف آلارم.</li>
          <li>تنظیم WAF برای مسیرهای بارگذاری فایل و GraphQL.</li>
          <li>پیاده‌سازی قفل موقت حساب پس از تلاش ناموفق مکرر.</li>
        </ul>
      </PanelCard>
    </section>
  );
}
