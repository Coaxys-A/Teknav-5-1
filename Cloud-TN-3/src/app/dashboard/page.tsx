import { StatCard } from "@/components/dashboard/StatCard";
import { PanelCard } from "@/components/dashboard/PanelCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { AiOpsPanel } from "@/components/dashboard/AiOpsPanel";
import { SecurityPanel } from "@/components/dashboard/SecurityPanel";
import { DocsRoadmap } from "@/components/dashboard/DocsRoadmap";
import { requireRole } from "@/lib/rbac";

export default function DashboardHomePage() {
  requireRole("USER");
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-slate-600">خوش آمدید به Teknav</p>
          <h1 className="text-3xl font-bold text-slate-900">داشبورد مرکزی</h1>
          <p className="text-sm text-slate-600">
            وضعیت کلی پلتفرم، دسترسی سریع به بخش‌های نویسنده، ادمین، مالک و ابزارهای AI/Plugin در این نما یکجا قرار دارد.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">پایدار</span>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">آماده‌ی انتشار</span>
          <span className="rounded-full bg-[color:var(--color-brand)]/10 px-3 py-1 text-xs font-semibold text-[color:var(--color-brand)]">دسترسی مالک</span>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="کاربران فعال" value="۱٬۲۷۰" trend="+۲۴٪ نسبت به هفته قبل" hint="Owner/Admin/Writer/Reader" />
        <StatCard title="مقالات منتشرشده" value="۳۴" trend="+۴ انتشار جدید" />
        <StatCard title="اجرای Agentهای AI" value="۱۲٬۴۷۵" trend="+۷٪" hint="LLM + ابزارهای داخلی" />
        <StatCard title="هشدارهای امنیتی" value="۵" trend="۲ مورد در حال رسیدگی" hint="WAF + لاگ‌های امنیتی" />
      </div>

      <PanelCard title="راه‌های سریع" description="میانبرهای مدیریت و عملیات کلیدی">
        <QuickActions
          actions={[
            { label: "ایجاد مقاله جدید", href: "/dashboard/writer" },
            { label: "مدیریت ادمین", href: "/dashboard/admin" },
            { label: "حفاظت و امنیت", href: "/dashboard/security" },
            { label: "اجرای Agentهای AI", href: "/dashboard/ai" },
            { label: "پنل مالک", href: "/dashboard/owner" },
            { label: "مستندات داخلی", href: "/dashboard/docs" },
          ]}
        />
      </PanelCard>

      <div className="grid gap-6 lg:grid-cols-3">
        <PanelCard title="اجرای Agentهای AI" description="پایش وضعیت اجرا، صف و دسترسی‌ها">
          <AiOpsPanel
            assistants={[
              { name: "Agent تحلیل محتوا", state: "running", desc: "خلاصه‌سازی و برچسب‌گذاری مقاله" },
              { name: "Agent سناریوی قرمز", state: "ready", desc: "تولید Kill-Chain و TTP" },
              { name: "Agent شخصی‌سازی", state: "ready", desc: "پیشنهادات براساس علایق کاربر" },
              { name: "Agent UI/QA", state: "idle", desc: "A/B و تست رابط" },
            ]}
          />
        </PanelCard>
        <PanelCard title="امنیت و پایش" description="WAF، نفوذ و MFA">
          <SecurityPanel
            items={[
              { title: "پایگاه‌داده و کش", status: "safe", detail: "اتصال DB/Redis پایدار" },
              { title: "نشست‌ها و توکن‌ها", status: "warn", detail: "بررسی دوره‌ای چرخش توکن لازم است" },
              { title: "WAF و Anti-DDoS", status: "safe", detail: "فیلتر لایه ۷ فعال" },
              { title: "MFA برای ادمین‌ها", status: "action", detail: "فعالسازی اجباری برای Owner/Admin" },
            ]}
          />
        </PanelCard>
        <PanelCard title="فعالیت اخیر" description="رخدادهای اصلی پلتفرم">
          <ActivityFeed
            items={[
              { title: "انتشار ۲ مقاله امنیتی جدید", meta: "۵ دقیقه پیش - Writer", tag: "مقاله" },
              { title: "اجرای Agent سناریوی قرمز", meta: "۲۰ دقیقه پیش - AI", tag: "AI" },
              { title: "آپدیت Feature Flag پرداخت", meta: "۲ ساعت پیش - Admin", tag: "Feature Flag" },
              { title: "سلامت CDN بررسی شد", meta: "دیروز - Ops", tag: "Ops" },
            ]}
          />
        </PanelCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PanelCard title="نقشه‌راه" description="گام‌های بعدی برای تکمیل قابلیت‌ها">
          <DocsRoadmap
            items={[
              { title: "اتمام UI RTL برای داشبورد (Next.js)", status: "done", link: "/dashboard/docs" },
              { title: "تکمیل Zero-Trust و سشن امن", status: "wip" },
              { title: "هوشمندسازی انتشار مقاله با AI", status: "planned" },
              { title: "SDK پلاگین و API عمومی", status: "planned" },
            ]}
          />
        </PanelCard>
        <PanelCard title="یکپارچگی و عملکرد" description="حجم رویدادها، فراخوانی API و نرخ خطا">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">درخواست‌ها</p>
              <p className="mt-2 text-xl font-bold text-slate-900">۲۵۸k در ۲۴ساعت</p>
              <p className="text-xs text-slate-500">شامل صفحات و API داخلی</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">خطاها</p>
              <p className="mt-2 text-xl font-bold text-slate-900">۰.۴٪ نرخ خطا</p>
              <p className="text-xs text-slate-500">بهبود CORS و توکن‌ها در حال انجام</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">تاخیر متوسط</p>
              <p className="mt-2 text-xl font-bold text-slate-900">۹۵ms</p>
              <p className="text-xs text-slate-500">مبتنی بر CDN + کش</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">پوشش API</p>
              <p className="mt-2 text-xl font-bold text-slate-900">۳۸ endpoint فعال</p>
              <p className="text-xs text-slate-500">Rate-limit و لاگ فعال</p>
            </div>
          </div>
        </PanelCard>
      </div>
    </div>
  );
}
