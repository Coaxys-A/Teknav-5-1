import { LoginForm } from "@/components/auth/LoginForm";
import { ensureCsrfToken } from "@/lib/csrf";

export default function LoginPage() {
  const csrf = ensureCsrfToken();

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <LoginForm csrfToken={csrf} />

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 shadow-soft dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
        <p className="font-semibold text-slate-900 dark:text-slate-100">توصیه‌های امنیتی</p>
        <ul className="list-disc space-y-2 pr-5">
          <li>ورود ادمین فقط با MFA فعال توصیه می‌شود.</li>
          <li>در محیط‌های مشترک، از خروج امن پس از پایان کار استفاده کنید.</li>
          <li>از به‌اشتراک‌گذاری توکن یا کوکی خودداری کنید.</li>
        </ul>
        <p className="text-xs text-slate-500 dark:text-slate-400">ورود شما به معنای پذیرش قوانین امنیتی Teknav است.</p>
      </div>
    </div>
  );
}
