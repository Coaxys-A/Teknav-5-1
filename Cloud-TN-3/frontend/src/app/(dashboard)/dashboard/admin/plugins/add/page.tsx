"use client";
import React, { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import WidgetContainer from "@/components/ui/WidgetContainer";
import ErrorState from "@/components/ui/ErrorState";

export default function AddPluginPage() {
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    setOk(false);
    try {
      const payload = {
        key: formData.get("key"),
        name: formData.get("name"),
        description: formData.get("description"),
        slot: formData.get("slot"),
        type: formData.get("type"),
      };
      const res = await fetch("/api/plugins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("ثبت پلاگین ناموفق بود");
      setOk(true);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="افزودن پلاگین" description="پلاگین جدید ثبت کنید" />
      <WidgetContainer title="فرم پلاگین">
        <form action={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-slate-600">کلید</label>
              <input name="key" className="w-full rounded-lg border px-3 py-2" required />
            </div>
            <div>
              <label className="text-sm text-slate-600">نام</label>
              <input name="name" className="w-full rounded-lg border px-3 py-2" required />
            </div>
            <div>
              <label className="text-sm text-slate-600">جایگاه</label>
              <input name="slot" className="w-full rounded-lg border px-3 py-2" placeholder="content, sidebar, api" />
            </div>
            <div>
              <label className="text-sm text-slate-600">نوع</label>
              <input name="type" className="w-full rounded-lg border px-3 py-2" placeholder="frontend/backend/hybrid" />
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-600">توضیح</label>
            <textarea name="description" className="w-full rounded-lg border px-3 py-2" rows={3} />
          </div>
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-white" type="submit">ثبت</button>
        </form>
        {ok && <div className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-green-700 text-sm">ثبت شد.</div>}
        {error && <ErrorState message={error} />}
      </WidgetContainer>
    </div>
  );
}
