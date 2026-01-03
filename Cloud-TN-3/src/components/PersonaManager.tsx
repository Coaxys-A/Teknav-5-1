import { useState } from "react";

export function PersonaManager({ apiBase = "" }: { apiBase?: string }) {
  const [label, setLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async () => {
    setSubmitting(true);
    setMessage("");
    const res = await fetch(`${apiBase}/identity/persona`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ label }),
    });
    if (res.ok) {
      setMessage("پرسونا اضافه شد");
      setLabel("");
    } else {
      setMessage("خطا در افزودن پرسونا");
    }
    setSubmitting(false);
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3 text-right">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-100">مدیریت پرسونا</h3>
      </div>
      <input
        className="w-full rounded-xl bg-slate-800 text-slate-100 px-3 py-2 text-sm outline-none border border-slate-700"
        placeholder="نام پرسونا (مثلاً «تحلیل‌گر»)"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        dir="rtl"
      />
      <button
        onClick={submit}
        disabled={submitting || !label}
        className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white py-2 text-sm disabled:opacity-50"
      >
        {submitting ? "در حال ثبت..." : "افزودن پرسونا"}
      </button>
      {message && <div className="text-xs text-emerald-200">{message}</div>}
    </div>
  );
}
