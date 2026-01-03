import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="grid gap-8 lg:grid-cols-3">
    <form className="lg:col-span-2 space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-800" htmlFor="name">
            نام و نام خانوادگی
          </label>
          <input
            id="name"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[color:var(--color-brand)] focus:outline-none"
            placeholder="مثلاً علی رضایی"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-800" htmlFor="role">
            نقش پیشنهادی
          </label>
          <select
            id="role"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[color:var(--color-brand)] focus:outline-none"
            defaultValue="WRITER"
          >
            <option value="WRITER">نویسنده</option>
            <option value="ANALYST">تحلیلگر</option>
            <option value="EDITOR">ویرایشگر</option>
            <option value="VIEWER">مشاهده‌گر</option>
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-800" htmlFor="email">
            ایمیل سازمانی
          </label>
          <input
            id="email"
            type="email"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[color:var(--color-brand)] focus:outline-none"
            placeholder="user@teknav.ir"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-800" htmlFor="password">
            گذرواژه
          </label>
          <input
            id="password"
            type="password"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[color:var(--color-brand)] focus:outline-none"
            placeholder="حداقل ۸ کاراکتر"
            required
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-800" htmlFor="goal">
          هدف استفاده
        </label>
        <textarea
          id="goal"
          className="h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[color:var(--color-brand)] focus:outline-none"
          placeholder="مثلاً تولید محتوای امنیت سایبری، داشبورد تحلیل، یا پایش عملکرد."
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-lg bg-[color:var(--color-brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[color:var(--color-brand-dark)]"
      >
        ساخت حساب
      </button>
      <p className="text-sm text-slate-600">
        قبلاً ثبت‌نام کرده‌اید؟{" "}
        <Link href="/auth/login" className="text-[color:var(--color-brand)] font-semibold hover:underline">
          ورود
        </Link>
      </p>
    </form>

    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
      <p className="font-semibold text-slate-900">مزایای حساب Teknav</p>
      <ul className="list-disc space-y-2 pr-5">
        <li>دسترسی به داشبورد محتوا، امنیت و AI.</li>
        <li>پشتیبانی از تجربه RTL و فونت فارسی پیش‌فرض.</li>
        <li>جریان‌های خودکار تولید مقاله و سئو.</li>
      </ul>
      <p className="text-xs text-slate-500">تأیید ادمین برای نقش‌های پیشرفته الزامی است.</p>
    </div>
  </div>
  );
}
