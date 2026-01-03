import { cookies } from "next/headers";
import { ensureCsrfToken } from "@/lib/csrf";
import { callBackend } from "@/lib/backend";

async function loadAggregates(token?: string) {
  return callBackend<any[]>({
    path: "/analytics/aggregates",
    method: "GET",
    token,
    cache: "no-store",
    searchParams: new URLSearchParams({ period: "day" }),
  });
}

export default async function EngagementPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("teknav_token")?.value;
  const csrf = ensureCsrfToken();
  const aggregates = await loadAggregates(token).catch(() => []);

  return (
    <section className="space-y-6 px-6 py-10" dir="rtl">
      <header className="text-right space-y-1">
        <p className="text-xs text-slate-500">CSRF: {csrf.slice(0, 8)}...</p>
        <h1 className="text-3xl font-bold">درگیرش مخاطب</h1>
        <p className="text-sm text-slate-600">نمای روزانه تعاملات برای سنجش روند کلیک، اسکرول، و زمان خواندن.</p>
      </header>
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="grid grid-cols-3 text-xs font-semibold text-slate-500">
          <span>بازه</span>
          <span className="text-center">رویداد</span>
          <span className="text-left">تعداد</span>
        </div>
        <div className="mt-2 space-y-2 text-sm">
          {aggregates.map((item) => (
            <div key={`${item.bucket}-${item.eventType}`} className="grid grid-cols-3 rounded border px-3 py-2">
              <span>{new Date(item.bucket).toLocaleDateString("fa-IR")}</span>
              <span className="text-center">{item.eventType}</span>
              <span className="text-left">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
