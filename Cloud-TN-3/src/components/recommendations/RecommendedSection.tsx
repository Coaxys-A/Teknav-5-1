"use client";

import useSWR from "swr";
import Link from "next/link";

const fetcher = (url: string) => fetch(url, { cache: "no-store" }).then((r) => r.json());

interface Item {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImageId?: number | null;
}

export function RecommendedSection({ articleId }: { articleId: number }) {
  const { data } = useSWR<{ ok?: boolean; items?: Item[] }>(`/api/recommendations/related?id=${articleId}`, fetcher);
  const items = data?.items ?? [];
  if (!items.length) return null;
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" dir="rtl">
      <h3 className="text-lg font-semibold text-right">مقالات مشابه</h3>
      <div className="space-y-2 text-right text-sm">
        {items.map((item) => (
          <Link key={item.id} href={`/articles/${item.slug}`} className="block rounded border px-3 py-2 hover:bg-slate-50">
            <div className="font-semibold">{item.title}</div>
            {item.excerpt && <div className="text-xs text-slate-500">{item.excerpt}</div>}
          </Link>
        ))}
      </div>
    </div>
  );
}
