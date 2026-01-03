import { cookies } from "next/headers";
import { callBackend } from "@/lib/backend";

async function loadArticles(token?: string) {
  return callBackend<any[]>({
    path: "/articles",
    method: "GET",
    token,
    cache: "no-store",
  });
}

export default async function ContentPerformancePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("teknav_token")?.value;
  const articles = await loadArticles(token).catch(() => []);

  return (
    <section className="space-y-6 px-6 py-10" dir="rtl">
      <header className="text-right space-y-1">
        <h1 className="text-3xl font-bold">عملکرد محتوا</h1>
        <p className="text-sm text-slate-600">نمایش امتیاز سئو، خوانایی و وضعیت انتشار برای مقالات.</p>
      </header>
      <div className="grid gap-3 md:grid-cols-2">
        {articles.map((a) => (
          <div key={a.id} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="text-right">
                <h3 className="text-lg font-semibold">{a.title}</h3>
                <p className="text-xs text-slate-500">وضعیت: {a.status}</p>
              </div>
              <div className="text-xs text-slate-600 text-right space-y-1">
                <div>سئو: {a.seoScore ?? "--"}</div>
                <div>خوانایی: {a.readability ?? "--"}</div>
                <div>AI: {a.aiScore ?? "--"}</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500 text-right">
              کلمات: {a.content ? a.content.length : "-"} | برچسب: {Array.isArray(a.tags) ? a.tags.length : 0}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
