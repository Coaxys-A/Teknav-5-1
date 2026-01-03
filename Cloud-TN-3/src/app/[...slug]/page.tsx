"use client";

import Link from "next/link";

export default function FallbackPage({ params }: { params: { slug?: string[] } }) {
  const path = "/" + (params.slug ?? []).join("/");
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 px-6 text-center space-y-4">
      <div className="text-3xl font-bold">صفحه در دسترس نیست</div>
      <p className="max-w-2xl text-slate-300 leading-8">
        مسیر <span className="font-mono text-emerald-300">{path}</span> هنوز صفحه‌ی اختصاصی ندارد. به زودی این بخش تکمیل
        خواهد شد؛ فعلاً می‌توانید از منوی بالا یا لینک‌های اصلی برای دسترسی به سایر صفحات استفاده کنید. اگر با ارجاع
        اشتباه روبه‌رو شده‌اید، لطفاً به مالک سایت اطلاع دهید.
      </p>
      <Link
        href="/"
        className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition text-white font-semibold"
      >
        بازگشت به خانه
      </Link>
    </main>
  );
}
