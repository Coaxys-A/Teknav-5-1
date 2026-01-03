"use client";

import { useState } from "react";

type Item = {
  id: number;
  title: string;
  createdAt?: string;
  status: string;
  aiScore?: number;
  aiDecision?: string;
};

export function AdminReviewList({ pending }: { pending: Item[] }) {
  const [items, setItems] = useState(pending);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  async function handleAction(id: number, action: "approve" | "reject") {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/articles/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "خطا");
      }
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <ul className="mt-4 space-y-3 text-sm">
      {items.length > 0 ? (
        items.map((item) => (
          <li key={item.id} className="space-y-1 rounded-md border p-3">
          <div className="font-medium">{item.title}</div>
          <div className="text-xs text-muted-foreground">{item.createdAt}</div>
          {(item.aiScore || item.aiDecision) && (
            <div className="flex gap-2 text-[11px]">
              {item.aiScore !== undefined && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                  امتیاز AI: {item.aiScore}
                </span>
              )}
              {item.aiDecision && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">
                  {item.aiDecision}
                </span>
              )}
            </div>
          )}
            <div className="flex gap-3 pt-2">
              <button
                className="rounded bg-primary px-3 py-1 text-xs text-primary-foreground disabled:opacity-50"
                onClick={() => handleAction(item.id, "approve")}
                disabled={loadingId === item.id}
              >
                {loadingId === item.id ? "..." : "تأیید سریع"}
              </button>
              <button
                className="rounded border px-3 py-1 text-xs disabled:opacity-50"
                onClick={() => handleAction(item.id, "reject")}
                disabled={loadingId === item.id}
              >
                {loadingId === item.id ? "..." : "رد با توضیح"}
              </button>
            </div>
          </li>
        ))
      ) : (
        <li className="rounded-md border p-4 text-muted-foreground">موردی برای بررسی وجود ندارد.</li>
      )}
    </ul>
  );
}
