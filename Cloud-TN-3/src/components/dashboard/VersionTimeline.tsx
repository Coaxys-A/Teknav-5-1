"use client";

import { useEffect, useState } from "react";

type Version = {
  id: number;
  createdAt: string;
  title: string;
  status: string;
};

async function fetchVersions(articleId: number) {
  const res = await fetch(`/api/articles/${articleId}/versions`);
  const json = await res.json();
  if (!res.ok || json.ok === false) {
    throw new Error(json.error ?? "خطا");
  }
  return json.versions as Version[];
}

export function VersionTimeline({ articleId }: { articleId: number }) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVersions(articleId)
      .then(setVersions)
      .catch((err) => setError((err as Error).message));
  }, [articleId]);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">تاریخچه نسخه‌ها</h3>
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
        {versions.map((v) => (
          <li key={v.id} className="rounded-lg border border-slate-200 p-2 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{v.title}</span>
              <span>{v.status}</span>
            </div>
            <div className="text-[11px] text-slate-500">{new Date(v.createdAt).toLocaleString("fa-IR")}</div>
          </li>
        ))}
        {versions.length === 0 && <li className="text-slate-500">نسخه‌ای ثبت نشده است.</li>}
      </ul>
    </div>
  );
}
