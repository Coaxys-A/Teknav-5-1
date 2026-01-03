"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { randomUUID } from "@/lib/random";

export function LoginForm({ csrfToken }: { csrfToken: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpStatus, setOtpStatus] = useState<string | null>(null);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("teknav_device_id") : null;
    if (stored) {
      setDeviceId(stored);
      return;
    }
    const next = randomUUID();
    if (typeof window !== "undefined") {
      localStorage.setItem("teknav_device_id", next);
    }
    setDeviceId(next);
  }, []);

  async function requestOtp() {
    if (!email) {
      setOtpStatus("ابتدا ایمیل را وارد کنید.");
      return;
    }
    setOtpStatus("در حال ارسال کد...");
    try {
      const res = await fetch("/api/users/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, csrfToken }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "خطا در ارسال کد");
      }
      setOtpStatus("کد ارسال شد (ایمیل/توسعه).");
    } catch (err) {
      setOtpStatus((err as Error).message);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
        const res = await fetch("/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, otpCode, deviceId, csrfToken }),
        });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "خطا در ورود");
      }
      router.push("/dashboard");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="lg:col-span-2 space-y-5" onSubmit={handleSubmit}>
      <input type="hidden" value={csrfToken} readOnly />
      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-800 dark:text-slate-100" htmlFor="email">
          ایمیل
        </label>
        <input
          id="email"
          type="email"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[color:var(--color-brand)] focus:outline-none dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
          placeholder="you@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-800 dark:text-slate-100" htmlFor="password">
          گذرواژه
        </label>
        <input
          id="password"
          type="password"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[color:var(--color-brand)] focus:outline-none dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
          placeholder="******"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300 dark:border-slate-600" /> مرا به خاطر بسپار
        </label>
        <Link href="/auth/forgot" className="text-[color:var(--color-brand)] hover:underline">
          بازیابی گذرواژه
        </Link>
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-800 dark:text-slate-100" htmlFor="otp">
          کد یک‌بارمصرف (OTP)
        </label>
        <div className="flex gap-2">
          <input
            id="otp"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[color:var(--color-brand)] focus:outline-none dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
            placeholder="مثلاً 123456"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
          />
          <button
            type="button"
            onClick={requestOtp}
            className="whitespace-nowrap rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-[color:var(--color-brand)] dark:border-slate-700 dark:text-slate-100"
          >
            دریافت کد
          </button>
        </div>
        {otpStatus && <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{otpStatus}</p>}
      </div>
      <button
        type="submit"
        className="w-full rounded-lg bg-[color:var(--color-brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[color:var(--color-brand-dark)] disabled:opacity-70"
        disabled={loading}
      >
        {loading ? "در حال ورود..." : "ورود"}
      </button>
      {error && (
        <motion.p className="text-sm text-rose-600" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
          {error}
        </motion.p>
      )}
      <p className="text-sm text-slate-600 dark:text-slate-300">
        حساب ندارید؟{" "}
        <Link href="/auth/register" className="text-[color:var(--color-brand)] font-semibold hover:underline">
          ثبت‌نام
        </Link>
      </p>
    </form>
  );
}
