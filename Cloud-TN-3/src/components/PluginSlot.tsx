"use client";

import useSWR from "swr";

type Plugin = {
  key: string;
  slot: string;
  type: string;
  name: string;
  description?: string;
  config?: any;
};

const fetcher = (url: string) => fetch(url, { cache: "no-store" }).then((r) => r.json());

export function PluginSlot({ slot }: { slot: string }) {
  const { data } = useSWR<{ plugins: Plugin[] }>(`/api/plugins?slot=${encodeURIComponent(slot)}`, fetcher);
  const plugins = data?.plugins ?? [];

  if (!plugins.length) return null;

  return (
    <div className="space-y-3">
      {plugins.map((p) => {
        if (p.type === "banner") {
          return (
            <div key={p.key} className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="text-sm text-muted-foreground mb-1">{p.name}</div>
              <div className="text-base font-semibold">{p.config?.headline}</div>
              {p.config?.ctaUrl ? (
                <a href={p.config.ctaUrl} className="text-primary underline text-sm" target="_blank" rel="noopener noreferrer">
                  {p.config?.ctaLabel ?? "بیشتر بدانید"}
                </a>
              ) : null}
            </div>
          );
        }
        if (p.type === "card") {
          return (
            <div key={p.key} className="rounded-lg border p-4 bg-background">
              <div className="font-semibold mb-1">{p.config?.title ?? p.name}</div>
              <p className="text-sm text-muted-foreground mb-2">{p.config?.description ?? p.description}</p>
              {p.config?.link ? (
                <a className="text-primary text-sm underline" href={p.config.link} target="_blank" rel="noopener noreferrer">
                  {p.config?.linkLabel ?? "مشاهده"}
                </a>
              ) : null}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
