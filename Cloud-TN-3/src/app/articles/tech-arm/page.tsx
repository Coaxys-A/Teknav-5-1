import Link from "next/link";
import { Share2 } from "lucide-react";

const Breadcrumbs = () => (
  <nav className="text-xs text-slate-400 mb-3 flex gap-2">
    <Link href="/" className="hover:text-slate-200">خانه</Link>
    <span>/</span>
    <Link href="/tech" className="hover:text-slate-200">فناوری</Link>
    <span>/</span>
    <span className="text-slate-300">ARM در برابر x86</span>
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
          <p className="text-xs text-slate-400">زمان مطالعه: ۹ دقیقه · آخرین به‌روزرسانی: ۱۴۰۴/۰۹/۱۵</p>
          <h1 className="text-3xl lg:text-4xl font-bold leading-tight text-slate-50">صنعت پردازنده‌ها وارد عصر جدید شد؛ جهش بزرگ ARM و رقابت مستقیم با اینتل و AMD</h1>
          <p className="text-slate-300 text-sm leading-relaxed">نسل جدید پردازنده‌های Armv9.2 با هسته‌های Cortex-X925 نشان می‌دهد که معادله مصرف انرژی و توان پردازشی دیگر در انحصار x86 نیست. لپ‌تاپ‌ها، سرورها و حتی ایستگاه‌های کاری حالا می‌توانند با معماری کم‌مصرف ARM، همزمان عمر باتری بالا و کارایی سنگین را تجربه کنند.</p>
          <ShareBar />
        </header>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="img-placeholder h-48 rounded-xl" aria-hidden />
          <div className="mt-3 text-xs text-slate-400">اگر تصویر در دسترس نیست، این جای‌گیر ظریف حفظ تعادل بصری صفحه را تضمین می‌کند.</div>
        </div>

        <section className="mt-10 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h2 className="text-lg font-semibold text-slate-50">چرا ARM ناگهان «استاندارد جدید» شد؟</h2>
            <ul className="mt-3 list-disc pr-5 text-sm leading-7 text-slate-200">
              <li>Armv9.2 با بهره‌وری انرژی ۴۰٪ بهتر و عملکرد ۳۰٪ بالاتر در بارهای CPU-Bound نسبت به نسل قبل.</li>
              <li>هسته Cortex-X925 به فرکانس‌های بالاتر با IPC افزوده دست یافته و در بارهای AI/ML نیز شتاب‌گر اختصاصی دارد.</li>
              <li>OEMهای بزرگ (مایکروسافت، لنوو، ایسوس، سامسونگ) وارد فاز تولید انبوه لپ‌تاپ‌های ARM شده‌اند.</li>
              <li>همسوسازی نرم‌افزار: لایه‌های سازگاری Windows on ARM، کامپایلرهای LLVM/Clang و کانتینرهای چندمعماری.</li>
            </ul>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h3 className="text-base font-semibold text-slate-50">تغییر در کلاس لپ‌تاپ</h3>
              <p className="mt-2 text-sm leading-7 text-slate-200">اپل با M1 تا M3 ثابت کرد می‌توان در یک لپ‌تاپ ۱۸ ساعته شارژ، پردازش سنگین ویدیو و کد را اجرا کرد. نسل جدید لپ‌تاپ‌های ویندوزی با ARM نیز اکنون از NPU داخلی برای مدل‌های زبانی و بینایی استفاده می‌کنند و در عین حال بدون فن یا با خنک‌کننده سبک کار می‌کنند.</p>
              <div className="mt-3 text-xs text-slate-400">نویسنده: آرسام صباغ · برچسب‌ها: #ARM #x86 #AI #Laptop</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h3 className="text-base font-semibold text-slate-50">سرورها و دیتاسنتر</h3>
              <p className="mt-2 text-sm leading-7 text-slate-200">AMD و Intel با معماری‌های هیبریدی در تلاشند مصرف را کاهش دهند، اما چیپ‌های ARM سرور مانند Graviton و Ampere Altra نشان می‌دهند که می‌توان ظرفیت مقیاس افقی را با هزینه انرژی کمتر به دست آورد. اگر اکوسیستم نرم‌افزارهای Enterprise و پایگاه‌داده‌ها (Postgres/Redis/Kafka) روی ARM بهینه شود، مهاجرت دیتاسنتر شتاب خواهد گرفت.</p>
              <div className="mt-3 text-xs text-slate-400">مقایسه تقریبی: در بارهای وب، ARM تا ۲۵٪ TCO کمتر در مقیاس سالانه.</div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-base font-semibold text-slate-50">چالش‌ها و ریسک‌ها</h3>
            <ul className="mt-2 list-disc pr-5 text-sm leading-7 text-slate-200">
              <li>سازگاری برخی نرم‌افزارهای قدیمی x86 با لایه امولیشن؛ کاهش کارایی در ابزارهای تخصصی.</li>
              <li>وابستگی به زنجیره تأمین چیپ‌های پیشرفته در شرایط ژئوپلیتیک.</li>
              <li>نیاز به بهینه‌سازی کامپایلر و کتابخانه‌های بومی برای ML/AI و رمزنگاری.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-base font-semibold text-slate-50">جمع‌بندی</h3>
            <p className="text-sm leading-7 text-slate-200">حرکت صنعت از x86 به سمت ARM صرفاً موجی گذرا نیست؛ بلکه پاسخی است به نیاز جدی مصرف انرژی کمتر، NPU داخلی و عملکرد پایدار. اگر پشتیبانی نرم‌افزارهای حرفه‌ای کامل شود، بازار لپ‌تاپ و حتی سرور وارد فاز جدیدی می‌شود که در آن ARM از «گزینه جایگزین» به «استاندارد اصلی» تبدیل می‌شود.</p>
          </div>
        </section>
      </div>
    </article>
  );
}
