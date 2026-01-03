import Link from "next/link";
import { site } from "@/lib/seo";

export default function Footer() {
  const year = new Intl.DateTimeFormat("fa-IR", { year: "numeric" }).format(new Date());

  return (
    <footer className="mt-16 border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/80">
      <div className="container-xl grid gap-8 py-10 text-sm text-slate-600 md:grid-cols-4 dark:text-slate-300">
        <div>
          <div className="font-bold text-slate-800 dark:text-slate-100">{site.name}</div>
          <p className="mt-2 max-w-xs leading-7">رسانه‌ی فناوری و امنیت سایبری — بدون حاشیه، دقیق و به‌روز.</p>
        </div>
        <div>
          <div className="font-bold text-slate-800 dark:text-slate-100">دسترسی سریع</div>
          <ul className="mt-2 space-y-1">
            <li><Link href="/news" className="hover:text-[color:var(--color-brand)]">اخبار</Link></li>
            <li><Link href="/cyber" className="hover:text-[color:var(--color-brand)]">امنیت سایبری</Link></li>
            <li><Link href="/tech" className="hover:text-[color:var(--color-brand)]">فناوری</Link></li>
            <li><Link href="/analysis" className="hover:text-[color:var(--color-brand)]">تحلیل</Link></li>
            <li><Link href="/tutorials" className="hover:text-[color:var(--color-brand)]">آموزش‌ها</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-bold text-slate-800 dark:text-slate-100">ارتباط</div>
          <p className="mt-2">
            <a href="mailto:contact@teknav.ir" className="hover:text-[color:var(--color-brand)]">contact@teknav.ir</a>
          </p>
          <p className="mt-2">
            <Link href="/sitemap.xml" className="underline hover:text-[color:var(--color-brand)]">نقشه سایت</Link>
          </p>
        </div>
        <div>
          <div className="font-bold text-slate-800 dark:text-slate-100">به ما بپیوندید</div>
          <p className="mt-2 leading-7">نویسنده، تحلیل‌گر یا متخصص امنیت هستید؟ به Teknav بپیوندید و درآمد بگیرید.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/join"
              className="rounded-lg bg-[color:var(--color-brand)] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[color:var(--color-brand-dark)]"
            >
              عضویت نویسندگان
            </Link>
            <Link
              href="/auth/register"
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-800 hover:border-[color:var(--color-brand)] dark:border-slate-600 dark:text-slate-100"
            >
              ثبت‌نام سریع
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-200 bg-slate-50 py-4 dark:border-slate-700 dark:bg-slate-900/60">
        <div className="container-xl text-xs text-slate-500 dark:text-slate-400">© {year} {site.name}. تمامی حقوق محفوظ است.</div>
      </div>
    </footer>
  );
}
