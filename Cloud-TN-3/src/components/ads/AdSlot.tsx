"use client";

import { useEffect, useState } from "react";

interface Creative {
  markup?: string | null;
  imageUrl?: string | null;
  clickUrl?: string | null;
  trackingPixels?: any;
}

export function AdSlot({ slotKey, tags = [] }: { slotKey: string; tags?: string[] }) {
  const [creative, setCreative] = useState<Creative | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/ads/serve?slotKey=${encodeURIComponent(slotKey)}&tags=${tags.join(",")}`, { cache: "no-store", signal: controller.signal })
      .then((r) => r.json())
      .then((res) => {
        if (res.creative) setCreative(res.creative);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [slotKey, tags]);

  if (!creative) return null;

  return (
    <div className="ad-slot rounded-xl border border-slate-200 bg-white p-3 shadow-sm" dir="rtl">
      {creative.markup ? (
        <div dangerouslySetInnerHTML={{ __html: creative.markup }} />
      ) : creative.imageUrl ? (
        <a href={creative.clickUrl ?? "#"} target="_blank" rel="nofollow noopener">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={creative.imageUrl} alt="Ad" className="w-full rounded" />
        </a>
      ) : null}
    </div>
  );
}
