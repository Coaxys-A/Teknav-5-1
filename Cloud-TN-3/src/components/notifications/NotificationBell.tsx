"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url, { cache: "no-store" }).then((r) => r.json());

export function NotificationBell() {
  const { data, mutate } = useSWR<{ ok: boolean; items: any[] }>("/api/notifications/unread", fetcher, { refreshInterval: 15000 });
  const count = data?.items?.length ?? 0;

  async function markAll() {
    const items = data?.items ?? [];
    await Promise.all(
      items.map((n) =>
        fetch("/api/notifications/mark-read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: n.id }) }),
      ),
    );
    mutate();
  }

  return (
    <button
      onClick={markAll}
      className="relative rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50"
      aria-label="اعلان‌ها"
    >
      🔔
      {count > 0 && (
        <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white">
          {count}
        </span>
      )}
    </button>
  );
}
