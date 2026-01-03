import Link from "next/link";
import { PanelCard } from "@/components/dashboard/PanelCard";
import { AiOpsPanel } from "@/components/dashboard/AiOpsPanel";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";

export default function AiDashboardPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900">داشبورد AI و اتوماسیون</h1>
        <p className="text-sm text-slate-600">
          مشاهده وضعیت Agentها، ابزارها، اجرای سناریو و تحلیل محتوا. همه چیز در یک نمای یکپارچه.
        </p>
      </header>

      <PanelCard title="Agentها و ابزارها" description="مرور سریع وضعیت اجرای Agentهای AI">
        <AiOpsPanel
          assistants={[
            { name: "Agent تحلیل محتوا", state: "running", desc: "خلاصه‌سازی، برچسب‌گذاری، SEO" },
            { name: "Agent سناریوی قرمز", state: "running", desc: "Kill-chain، TTP، IOCs" },
            { name: "Agent شخصی‌سازی", state: "ready", desc: "پیشنهاد شخصی بر پایه علایق" },
            { name: "Agent UI/QA", state: "ready", desc: "A/B و تست رابط" },
            { name: "Agent ممیزی امنیت", state: "idle", desc: "بررسی لاگ‌ها و هشدارها" },
            { name: "Agent بهینه‌سازی رسانه", state: "idle", desc: "فشرده‌سازی و بهینه‌سازی مدیا" },
          ]}
        />
      </PanelCard>

      <PanelCard title="ابزارهای سریع" description="اجرای مستقیم تسک‌های AI">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {["تحلیل مقاله + SEO", "تولید سناریوی قرمز", "بازنویسی متن","پیشنهاد عنوان/متا","استخراج برچسب و تاکسونومی","پیشنهاد مطلب بعدی"].map((item) => (
            <button
              key={item}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-right text-sm font-semibold text-slate-900 shadow-sm transition hover:border-[color:var(--color-brand)] hover:bg-[color:var(--color-brand)]/5"
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
      </PanelCard>

      <PanelCard title="رخدادها" description="لاگ آخرین اجرای Agentها و ابزارها">
        <ActivityFeed
          items={[
            { title: "تحلیل مقاله ARM + SEO کامل شد", meta: "۵ دقیقه پیش - Agent محتوا", tag: "محتوا" },
            { title: "سناریوی قرمز کیف پول داغ تولید شد", meta: "۲۰ دقیقه پیش - Agent سناریو", tag: "سناریو" },
            { title: "پیشنهاد مطلب بعدی برای کاربر X", meta: "۴۵ دقیقه پیش - Agent شخصی‌سازی", tag: "پیشنهاد" },
            { title: "بازنویسی متن خبر امنیتی", meta: "۱ ساعت پیش - Agent محتوا", tag: "بازنویسی" },
          ]}
        />
      </PanelCard>
    </section>
  );
}
