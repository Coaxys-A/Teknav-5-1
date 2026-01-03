import Link from "next/link";
import { Share2, Download } from "lucide-react";

const Breadcrumbs = () => (
  <nav className="text-xs text-slate-400 mb-3 flex gap-2">
    <Link href="/" className="hover:text-slate-200">خانه</Link>
    <span>/</span>
    <Link href="/analysis" className="hover:text-slate-200">تحلیل تخصصی</Link>
    <span>/</span>
    <span className="text-slate-300">اینترنت توزیع‌شده</span>
  </nav>
);

const ShareBar = () => (
  <div className="flex items-center gap-3 text-xs text-slate-300">
    <Share2 size={14} />
    <Link href="#" className="hover:text-slate-100">کپی لینک</Link>
    <Link href="#" className="hover:text-slate-100">تلگرام</Link>
    <Link href="#" className="hover:text-slate-100">لینکدین</Link>
  </div>
);

export default function ArticlePage() {
  return (
    <article className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container mx-auto px-4 py-10 lg:px-12">
        <Breadcrumbs />
        <header className="space-y-3">
          <p className="text-xs text-slate-400">زمان مطالعه: ۱۵ دقیقه · آخرین به‌روزرسانی: ۱۴۰۴/۰۹/۱۵ · نسخه 1.3</p>
          <h1 className="text-3xl lg:text-4xl font-bold leading-tight text-slate-50">چرا آینده اینترنت به سمت شبکه‌های توزیع‌شده و غیرمتمرکز حرکت می‌کند؟</h1>
          <p className="text-slate-300 text-sm leading-relaxed">وب ۳.۵ تلاشی است برای ترکیب کاربردپذیری وب فعلی با مقاومت، حریم خصوصی و مالکیت داده. از IPFS و Arweave تا Layer-2 ها، همه در حال ساخت لایه‌ای هستند که در برابر سانسور، DDoS و انحصار پایدار بماند.</p>
          <ShareBar />
        </header>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="img-placeholder h-48 rounded-xl" aria-hidden />
          <div className="mt-3 text-xs text-slate-400">جای‌گیر مینیمال برای زمانی که تصویر موجود نیست.</div>
        </div>

        <section className="mt-10 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <span className="rounded-full bg-slate-800 px-3 py-1">Version: 1.3</span>
              <span className="rounded-full bg-slate-800 px-3 py-1">Methodology: Mixed Qual/Quant</span>
              <span className="rounded-full bg-slate-800 px-3 py-1">Focus: Infra / Privacy / AI</span>
            </div>
            <h2 className="text-lg font-semibold text-slate-50">روش تحلیل</h2>
            <p className="text-sm leading-7 text-slate-200">این تحلیل بر پایه سه محور انجام شده است: ۱) بررسی فنی لایه ذخیره‌سازی و توزیع محتوا (IPFS, Arweave)، ۲) تاثیر معماری غیرمتمرکز بر تجربه کاربر و هزینه، ۳) قابلیت اجرای مدل‌های هوش مصنوعی به صورت بومی روی شبکه‌های توزیع‌شده. داده‌ها از مستندات پروژه‌ها، بنچمارک‌های عمومی و تست‌های آزمایشگاهی تهیه شده‌اند.</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h3 className="text-base font-semibold text-slate-50">چرا وب متمرکز شکننده است؟</h3>
              <ul className="mt-2 list-disc pr-5 text-sm leading-7 text-slate-200 space-y-1">
                <li>وابستگی به چند دیتاسنتر اصلی و CDN واحد؛ یک خطای پیکربندی یا قطعی سراسری، میلیون‌ها کاربر را متاثر می‌کند.</li>
                <li>مسائل حریم خصوصی و مالکیت داده: کاربران کنترل کامل بر داده‌های خود ندارند.</li>
                <li>سانسور و محدودسازی محتوا در سطح شبکه یا سرویس‌دهنده.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h3 className="text-base font-semibold text-slate-50">چه چیز در وب توزیع‌شده تغییر می‌کند؟</h3>
              <ul className="mt-2 list-disc pr-5 text-sm leading-7 text-slate-200 space-y-1">
                <li>ذخیره‌سازی توزیع‌شده محتوا در هزاران نود (IPFS/Arweave)؛ مقاوم در برابر سانسور و خرابی.</li>
                <li>پردازش هوش مصنوعی روی لبه/نود: مدل‌ها روی دستگاه کاربر یا نودهای محلی اجرا می‌شوند.</li>
                <li>کاهش هزینه دیتاسنترهای متمرکز و توزیع پهنای باند.</li>
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
            <h3 className="text-base font-semibold text-slate-50">نمونه‌های فنی کلیدی</h3>
            <ul className="list-disc pr-5 text-sm leading-7 text-slate-200 space-y-1">
              <li>IPFS: محتوا با Content ID در شبکه‌ای از نودها تکرار می‌شود؛ در برابر DDoS مقاوم‌تر است.</li>
              <li>Arweave: ذخیره‌سازی دائمی محتوا با مدل اقتصادی «پرداخت یک‌باره».</li>
              <li>Layer-2 Rollups: توزیع تراکنش‌ها و محاسبات با هزینه کمتر و سرعت بالاتر.</li>
              <li>اجرای مدل‌های AI بومی: StableLM/LLAMA روی دسکتاپ یا موبایل بدون نیاز به سرور مرکزی.</li>
            </ul>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h3 className="text-base font-semibold text-slate-50">مزایا برای کاربران و سازمان‌ها</h3>
              <ul className="list-disc pr-5 text-sm leading-7 text-slate-200 space-y-1">
                <li>مالکیت و کنترل داده توسط کاربر؛ کاهش نگرانی حریم خصوصی.</li>
                <li>دسترسی پایدار حتی در شرایط اختلال یا سانسور.</li>
                <li>کاهش هزینه زیرساخت و امکان مقیاس‌پذیری افقی.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h3 className="text-base font-semibold text-slate-50">مخاطرات و چالش‌ها</h3>
              <ul className="list-disc pr-5 text-sm leading-7 text-slate-200 space-y-1">
                <li>حجم همگام‌سازی اولیه و نیاز به پهنای باند/فضا در برخی شبکه‌ها.</li>
                <li>پیچیدگی تجربه کاربری و ابزارهای مدیریت کلید/هویت.</li>
                <li>تنظیم‌گری و انطباق با قوانین محلی.</li>
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
            <h3 className="text-base font-semibold text-slate-50">بخش دانلود</h3>
            <p className="text-sm leading-7 text-slate-200">برای بررسی عمیق‌تر، فایل‌های پشتیبان تحلیل را دریافت کنید.</p>
            <div className="flex flex-wrap gap-3 text-xs text-slate-200">
              <Link href="#" className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 hover:border-slate-500">
                <Download size={14} /> گزارش فنی (PDF)
              </Link>
              <Link href="#" className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 hover:border-slate-500">
                <Download size={14} /> پیکربندی نمونه IPFS (ZIP)
              </Link>
              <Link href="#" className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 hover:border-slate-500">
                <Download size={14} /> اسکریپت سنجش تاخیر (POC)
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-base font-semibold text-slate-50">جمع‌بندی</h3>
            <p className="text-sm leading-7 text-slate-200">حرکت به سوی اینترنت غیرمتمرکز واکنشی است به محدودیت‌های وب فعلی: امنیت، حریم خصوصی، هزینه و تاب‌آوری. با بلوغ ابزارهای کاربرپسند و اجرای بومی مدل‌های AI روی لبه، انتظار می‌رود شبکه‌های توزیع‌شده از «گزینه جایگزین» به «لایه پایه» اینترنت آینده تبدیل شوند.</p>
          </div>
        </section>
      </div>
    </article>
  );
}
