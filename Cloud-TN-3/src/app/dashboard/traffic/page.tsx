import useSWR from "swr";
import { cookies } from "next/headers";
import { ensureCsrfToken } from "@/lib/csrf";
import { callBackend } from "@/lib/backend";

async function getSummary(token?: string) {
  return callBackend<{ eventType: string; count: number }[]>({
    path: "/analytics/summary",
    method: "GET",
    token,
    cache: "no-store",
  });
}

async function getAggregates(token?: string) {
  return callBackend<any[]>({
    path: "/analytics/aggregates",
    method: "GET",
    token,
    cache: "no-store",
    searchParams: new URLSearchParams({ period: "hour" }),
  });
}

export default async function TrafficDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("teknav_token")?.value;
  const csrf = ensureCsrfToken();
  const summary = await getSummary(token).catch(() => []);
  const aggregates = await getAggregates(token).catch(() => []);

  return (
    <section className="space-y-6 px-6 py-10" dir="rtl">
      <header className="text-right space-y-1">
        <p className="text-xs text-slate-500">CSRF: {csrf.slice(0, 8)}...</p>
        <h1 className="text-3xl font-bold">ترافیک و رویدادها</h1>
        <p className="text-sm text-slate-600">نمای کلی بازدید، کلیک و تعاملات بر اساس رویدادهای جمع‌آوری‌شده.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        {summary.map((s) => (
          <div key={s.eventType} className="rounded-xl border bg-white p-4 text-right shadow-sm">
            <p className="text-xs text-slate-500">{s.eventType}</p>
            <p className="text-2xl font-bold">{s.count}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-right">تجمیع ساعتی</h2>
        <div className="grid gap-2 text-right text-sm">
          {aggregates.map((a) => (
            <div key={`${a.bucket}-${a.eventType}`} className="flex items-center justify-between rounded border px-3 py-2">
              <span className="text-slate-600">{new Date(a.bucket).toLocaleString("fa-IR")}</span>
              <span className="font-semibold">{a.eventType}</span>
              <span className="text-slate-800">{a.count}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
