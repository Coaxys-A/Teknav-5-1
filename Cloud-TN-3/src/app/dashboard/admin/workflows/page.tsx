import { cookies } from "next/headers";
import { callBackend } from "@/lib/backend";

async function loadDefs(token?: string) {
  try {
    const res = await callBackend<{ ok: boolean; defs: any[] }>({
      path: "/workflows/definitions",
      method: "GET",
      token,
      cache: "no-store",
    });
    return res.defs ?? [];
  } catch {
    return [];
  }
}

async function loadInstances(token?: string) {
  try {
    const res = await callBackend<{ ok: boolean; instances: any[] }>({
      path: "/workflows/instances",
      method: "GET",
      token,
      cache: "no-store",
    });
    return res.instances ?? [];
  } catch {
    return [];
  }
}

export default async function WorkflowAdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("teknav_token")?.value;
  const [defs, instances] = await Promise.all([loadDefs(token), loadInstances(token)]);

  return (
    <section className="space-y-6 px-6 py-10" dir="rtl">
      <header className="text-right space-y-1">
        <h1 className="text-3xl font-bold">جریان‌های کاری</h1>
        <p className="text-sm text-slate-600">مدیریت، مشاهده مراحل و وضعیت اجرا.</p>
      </header>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-right">تعریف‌ها</h2>
        <div className="mt-3 grid gap-2">
          {defs.map((d) => (
            <div key={d.id} className="rounded border p-3 text-right">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">{d.name}</div>
                  <div className="text-xs text-slate-500">تریگرها: {(d.triggers || []).join(", ")}</div>
                </div>
                <span className={`text-xs ${d.isActive ? "text-emerald-600" : "text-rose-500"}`}>{d.isActive ? "فعال" : "غیرفعال"}</span>
              </div>
              <pre className="mt-2 rounded bg-slate-50 p-2 text-xs text-left text-slate-700 overflow-x-auto">{JSON.stringify(d.steps, null, 2)}</pre>
            </div>
          ))}
          {defs.length === 0 && <p className="text-sm text-slate-500 text-right">جریانی ثبت نشده است.</p>}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-right">اجراها</h2>
        <div className="mt-3 grid gap-2">
          {instances.map((ins) => (
            <div key={ins.id} className="rounded border p-3 text-right">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{ins.workflow?.name ?? ins.workflowId}</div>
                <span className="text-xs text-slate-500">{ins.status}</span>
              </div>
              <div className="text-xs text-slate-500">گام فعلی: {ins.currentStep}</div>
              <div className="text-xs text-slate-500">زمان: {new Date(ins.createdAt).toLocaleString("fa-IR")}</div>
            </div>
          ))}
          {instances.length === 0 && <p className="text-sm text-slate-500 text-right">اجرایی وجود ندارد.</p>}
        </div>
      </div>
    </section>
  );
}
