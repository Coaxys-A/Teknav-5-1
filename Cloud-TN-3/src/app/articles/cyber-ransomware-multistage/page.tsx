import Link from "next/link";
import { ShieldAlert, Share2 } from "lucide-react";

const Breadcrumbs = () => (
  <nav className="text-xs text-slate-400 mb-3 flex gap-2">
    <Link href="/" className="hover:text-slate-200">خانه</Link>
    <span>/</span>
    <Link href="/cyber" className="hover:text-slate-200">امنیت سایبری</Link>
    <span>/</span>
    <span className="text-slate-300">باج‌افزار چندمرحله‌ای</span>
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
          <p className="text-xs text-slate-400">زمان مطالعه: ۱۲ دقیقه · آخرین به‌روزرسانی: ۱۴۰۴/۰۹/۱۵</p>
          <h1 className="text-3xl lg:text-4xl font-bold leading-tight text-slate-50">هشدار جدی: موج جدید حملات باج‌افزاری با تاکتیک‌های چندمرحله‌ای و نفوذ پنهان</h1>
          <p className="text-slate-300 text-sm leading-relaxed">نسل تازه‌ای از باج‌افزارها با نام Stealth Multi-Stage Ransomware، ابتدا با نفوذ آرام وارد شبکه می‌شود، سپس دسترسی را ارتقا می‌دهد، داده‌ها را خارج می‌کند و در لحظه مناسب رمزگذاری چندلایه را اجرا می‌کند؛ بدون اینکه EDR یا آنتی‌ویروس به‌سادگی آن را بیابد.</p>
          <ShareBar />
        </header>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <div className="flex items-start gap-3 text-amber-300 text-sm">
            <ShieldAlert size={18} className="mt-1" />
            <div>
              <p className="font-semibold">سلب مسئولیت</p>
              <p className="text-slate-200/80">این مطلب صرفاً آموزشی است. از اجرای هرگونه کد یا تکنیک بدون مجوز و محیط ایزوله خودداری کنید.</p>
            </div>
          </div>
          <div className="grid gap-2 text-xs text-slate-300 lg:grid-cols-3">
            <div><span className="text-slate-400">سیستم عامل هدف:</span> ویندوز سرور / لینوکس</div>
            <div><span className="text-slate-400">ابزار موردنیاز:</span> SIEM، EDR، Sysmon، Zeek</div>
            <div><span className="text-slate-400">سطح مهارت:</span> متوسط تا پیشرفته</div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="img-placeholder h-48 rounded-xl" aria-hidden />
          <div className="mt-3 text-xs text-slate-400">اگر تصویر وجود ندارد، جای‌گیر مینیمال تعادل بصری را حفظ می‌کند.</div>
        </div>

        <section className="mt-10 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h2 className="text-lg font-semibold text-slate-50">مراحل حمله</h2>
            <ol className="mt-3 list-decimal pr-5 text-sm leading-7 text-slate-200 space-y-2">
              <li><strong>Initial Foothold:</strong> فیشینگ هدفمند، اکسپلویت روزصفر سرویس ابری یا VPN. نمونه CVEهای اخیر: <Link href="https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-3400" className="text-blue-300 hover:text-blue-100">CVE-2024-3400</Link>.</li>
              <li><strong>Privilege Escalation:</strong> سوءاستفاده از Kerberoasting، Token Impersonation یا LPE های کرنل (Patch Tuesday).</li>
              <li><strong>Stealth Lateral Movement:</strong> استفاده از WMI/WinRM و SMB بدون ایجاد سروصدا، به کمک ابزارهای بومی سیستم.</li>
              <li><strong>Data Exfiltration:</strong> فشرده‌سازی و رمزگذاری تدریجی داده‌ها، ارسال به S3/MEGA با ترافیک زمان‌بندی‌شده.</li>
              <li><strong>Multi-Layer Encryption & Extortion:</strong> رمزگذاری هم فایل سرورها و هم Endpointها، و سپس تهدید افشای داده‌ها (Double/Triple Extortion).</li>
            </ol>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h3 className="text-base font-semibold text-slate-50">دور زدن EDR</h3>
              <p className="mt-2 text-sm leading-7 text-slate-200">گروه‌های BlackBite و DarkForge از Kernel Injection، Memory Mapping و API Hooking استفاده می‌کنند تا EDR را دور بزنند. در بسیاری موارد، لاگ‌ها را به‌صورت زمان‌بندی‌شده پاک و سرویس‌های امنیتی را موقتاً متوقف می‌کنند.</p>
              <div className="mt-3 text-xs text-slate-400">MITRE ATT&CK: T1055 (Process Injection)، T1562 (Defense Evasion)</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
              <h3 className="text-base font-semibold text-slate-50">اقدامات دفاعی فوری</h3>
              <ul className="list-disc pr-5 text-sm leading-7 text-slate-200 space-y-1">
                <li>Zero-Trust + MFA اجباری برای ادمین و مالک.</li>
                <li>سیستم EDR با Rules سفارشی برای WMI/WinRM غیرمعمول.</li>
                <li>Network Segmentation و مسدودسازی SMB قدیمی.</li>
                <li>Sysmon + Zeek برای لاگ عمیق شبکه و میزبان.</li>
                <li>تمرين Tabletop برای سناریوی Double Extortion.</li>
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-base font-semibold text-slate-50">شاخص‌های مهم و تشخیص</h3>
            <ul className="list-disc pr-5 text-sm leading-7 text-slate-200 space-y-1">
              <li>ترافیک خروجی زمان‌بندی‌شده به S3/MEGA/Backblaze.</li>
              <li>ایجاد سرویس‌های موقت با نام‌های شبه‌سیستمی.</li>
              <li>Event ID 4624/4672 عجیب در ساعات غیرکاری.</li>
              <li>تغییرات متعدد در Registry مربوط به RDP/Terminal Services.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-base font-semibold text-slate-50">جمع‌بندی</h3>
            <p className="text-sm leading-7 text-slate-200">باج‌افزار چندمرحله‌ای به‌دلیل نفوذ آهسته و خروج مخفیانه داده، خسارت را چند برابر می‌کند. شناسایی باید پیش از رمزگذاری نهایی رخ دهد؛ بنابراین تکیه بر آنتی‌ویروس به‌تنهایی کافی نیست. ترکیب Zero-Trust، لاگینگ عمیق و تمرین پاسخ به حادثه، کلید کاهش ریسک است.</p>
          </div>
        </section>
      </div>
    </article>
  );
}
