import { cookies } from "next/headers";
import { callBackend } from "@/lib/backend";

async function loadAll(token?: string) {
  try {
    const res = await callBackend<any[]>({ path: "/notifications/all", method: "GET", token, cache: "no-store" });
    return res ?? [];
  } catch {
    return [];
  }
}

export default async function NotificationsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("teknav_token")?.value;
  const items = await loadAll(token);

  return (
    <section className="mx-auto max-w-3xl space-y-4 px-6 py-10" dir="rtl">
      <header className="text-right">
        <h1 className="text-3xl font-bold">اعلان‌ها</h1>
        <p className="text-sm text-slate-600">پیام‌ها و هشدارهای سیستم</p>
      </header>
      <div className="space-y-3">
        {items.map((n: any) => (
          <div key={n.id} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{n.channel}</span>
              <span>{new Date(n.createdAt).toLocaleString("fa-IR")}</span>
            </div>
            <div className="mt-1 text-sm text-slate-800">{n.template}</div>
            <div className="text-sm text-slate-600">{n.payload?.body}</div>
            {n.payload?.linkUrl && (
              <a href={n.payload.linkUrl} className="text-xs text-indigo-600 underline">
                باز کردن
              </a>
            )}
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-slate-500 text-right">اعلانی نیست.</p>}
      </div>
    </section>
  );
}
