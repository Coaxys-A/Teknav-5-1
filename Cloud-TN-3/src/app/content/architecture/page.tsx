export const metadata = {
  title: "معماری سراسری Teknav",
};

export default function ArchitecturePage() {
  return (
    <article className="container-xl space-y-6 py-10">
      <header className="space-y-2">
        <p className="text-sm text-slate-600">مستند معماری</p>
        <h1 className="text-3xl font-bold text-slate-900">معماری سراسری Teknav (Stage 2 و 3)</h1>
        <p className="text-sm text-slate-600">
          خلاصه اسکلت بک‌اند و فرانت‌اند براساس پرامپت اصلی برای توسعه مرحله‌ای و موازی.
        </p>
      </header>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-xl font-semibold text-slate-900">بک‌اند (NestJS + Prisma + PostgreSQL + Redis)</h2>
        <ul className="list-disc space-y-2 pr-5 text-sm text-slate-700">
          <li>لایه دامنه: User/Auth/Roles، Article/Content، Media، AI، Security/Audit، Marketplace (اسکلت).</li>
          <li>امنیت: JWT + رفرش توکن نشست، نقش‌ها، Rate-limit، WAF/Helmet، هش در DB + Redis، قلاب MFA/Device Fingerprint.</li>
          <li>داده: Prisma با مدل‌های User، Session، ApiToken، Article، AIReport، AuditLog؛ ایندکس روی userId/expiresAt.</li>
          <li>API: REST + GraphQL، دسته‌بندی Public/Private/Internal، CORS کنترل‌شده، آماده WebSocket.</li>
          <li>صف و پردازش: Bull/Redis برای AI و رسانه (در فاز بعدی)، Cron برای پاک‌سازی نشست و گزارش.</li>
          <li>مشاهده‌پذیری: AuditLog، هدر x-user-role، Health Endpoint، پیشنهاد ELK/Cloud Logging.</li>
          <li>CI: prisma generate + lint + build در GitHub Actions.</li>
        </ul>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-xl font-semibold text-slate-900">فرانت‌اند (Next.js 14، RTL)</h2>
        <ul className="list-disc space-y-2 pr-5 text-sm text-slate-700">
          <li>ساختار چندبخشی: Landing، احراز هویت، داشبورد یکپارچه + زیرپنل‌های Writer/Admin/Owner/Security/AI/Docs.</li>
          <li>پوسته داشبورد: AppShell با ناوبری ثابت، کارت آمار، فید فعالیت، پنل امنیت، AI Ops، نقشه مستندات.</li>
          <li>UI/UX: Tailwind، فونت Vazirmatn، RTL سراسری، رنگ برند و توکن‌های طراحی.</li>
          <li>امنیت کلاینت: middleware نقش‌محور، مسیرهای محافظت‌شده، فرم‌های آماده اتصال به بک‌اند.</li>
          <li>مسیرهای آینده: Agent Studio، مرکز رسانه، SDK کلاینت، Marketplace.</li>
        </ul>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-xl font-semibold text-slate-900">مسیر توسعه بعدی</h2>
        <ol className="list-decimal space-y-2 pr-5 text-sm text-slate-700">
          <li>اتصال کامل احراز هویت فرانت‌اند به بک‌اند (login/refresh/logout، MFA).</li>
          <li>صف Bull + Redis برای AI و رسانه، WebSocket برای داشبورد زنده.</li>
          <li>ماژول امنیت پویا: امتیاز رفتار، قفل حساب، اعلان لحظه‌ای.</li>
          <li>تکمیل مستندات: پلی‌بوک عملیات، معماری داده، راهنمای Agentها.</li>
          <li>بهینه‌سازی عملکرد: CDN + ISR/SSG، کش کوئری، پروفایلینگ DB.</li>
        </ol>
      </section>
    </article>
  );
}
