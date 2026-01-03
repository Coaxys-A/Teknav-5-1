import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900">بازیابی گذرواژه</h1>
        <p className="text-sm text-slate-600">
          ایمیل خود را وارد کنید تا لینک بازیابی برای شما ارسال شود.
        </p>
      </div>
      <form className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-800" htmlFor="email">
            ایمیل
          </label>
          <input
            id="email"
            type="email"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[color:var(--color-brand)] focus:outline-none"
            placeholder="you@example.com"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-[color:var(--color-brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[color:var(--color-brand-dark)]"
        >
          ارسال لینک
        </button>
      </form>
      <p className="text-sm text-slate-600">
        بازگشت به{" "}
        <Link href="/auth/login" className="text-[color:var(--color-brand)] font-semibold hover:underline">
          ورود
        </Link>
      </p>
    </div>
  );
}
