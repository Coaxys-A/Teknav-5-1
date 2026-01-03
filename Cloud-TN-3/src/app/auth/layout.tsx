import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-4 py-12">
        <div className="mb-8 text-center">
          <p className="text-sm text-slate-600">Teknav</p>
          <h1 className="text-3xl font-bold text-slate-900">ورود و عضویت</h1>
          <p className="text-sm text-slate-600">دسترسی به داشبورد، مدیریت محتوا و ابزارهای AI</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-soft">{children}</div>
      </div>
    </div>
  );
}
