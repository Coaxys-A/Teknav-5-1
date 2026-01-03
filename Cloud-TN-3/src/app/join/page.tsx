import Link from "next/link";

export const metadata = {
  title: "به تکناو بپیوندید",
};

export default function JoinPage() {
  return (
    <article className="container-xl space-y-8 py-12">
      <header className="space-y-2 text-center">
        <p className="text-sm text-slate-500">همکاری با Teknav</p>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">نویسنده یا متخصص شوید</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          به جمع نویسندگان، تحلیل‌گران امنیت، و تولیدکنندگان محتوا بپیوندید. ما بستر انتشار، سئو، و درآمد را مهیا می‌کنیم.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-900/60">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">مزایای همکاری</h2>
          <ul className="mt-4 list-disc space-y-2 pr-5 text-sm text-slate-700 dark:text-slate-300">
            <li>پرداخت منظم و پنل مالی شفاف</li>
            <li>پشتیبانی سئو و هوش مصنوعی برای بهبود محتوا</li>
            <li>تحلیل عملکرد هر مقاله و پیشنهاد بهبود</li>
            <li>دسترسی به داشبورد نویسنده و ابزار ارسالی</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-900/60">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">چگونه شروع کنیم؟</h2>
          <ol className="mt-4 list-decimal space-y-2 pr-5 text-sm text-slate-700 dark:text-slate-300">
            <li>در بخش <Link href="/auth/register" className="text-[color:var(--color-brand)] hover:underline">ثبت‌نام</Link> حساب بسازید.</li>
            <li>از داشبورد نویسنده اولین «پروپوزال» مقاله را ثبت کنید.</li>
            <li>سیستم هوش مصنوعی نمره و بازخورد اولیه می‌دهد.</li>
            <li>پس از تأیید مدیریت، مقاله منتشر و پرداخت ثبت می‌شود.</li>
          </ol>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-900/60">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">چه بنویسیم؟</h2>
          <ul className="mt-4 list-disc space-y-2 pr-5 text-sm text-slate-700 dark:text-slate-300">
            <li>امنیت سایبری، تحلیل رخداد و دفاع</li>
            <li>هوش مصنوعی و یادگیری ماشین</li>
            <li>آموزش‌های فنی و قدم‌به‌قدم</li>
            <li>تحلیل فناوری و گزارش بازار</li>
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-900/60">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">آموزش ارسال پروپوزال مقاله</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
            <p className="font-semibold">۱. ایده و ساختار</p>
            <p className="mt-2">عنوان، کلیدواژه اصلی، سه تیتر H2 و خلاصه ۳ خطی را آماده کنید.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
            <p className="font-semibold">۲. ارسال در داشبورد</p>
            <p className="mt-2">به داشبورد نویسنده بروید، فرم «پروپوزال» را پر کنید و ارسال کنید.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
            <p className="font-semibold">۳. ارزیابی هوش مصنوعی</p>
            <p className="mt-2">سیستم AI نمره (۰ تا ۱۰۰) و بازخورد به شما می‌دهد؛ نمره بالای ۸۰ خودکار منتشر می‌شود.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
            <p className="font-semibold">۴. تأیید مدیریت</p>
            <p className="mt-2">مدیر می‌تواند بازنویسی کند یا تأیید نهایی بزند؛ پس از انتشار، پرداخت در پنل مالی ثبت می‌شود.</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link href="/auth/register" className="rounded-lg bg-[color:var(--color-brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm">
            ثبت‌نام نویسنده
          </Link>
          <Link href="/dashboard/writer" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-100">
            ورود به داشبورد نویسنده
          </Link>
        </div>
      </section>
    </article>
  );
}
