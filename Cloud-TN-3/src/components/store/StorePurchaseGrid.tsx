"use client";

import { useState } from "react";

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  currency: string;
  productType: string;
  interval?: string | null;
}

interface Props {
  products: Product[];
}

export function StorePurchaseGrid({ products }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  async function buy(productId: number) {
    setLoadingId(productId);
    setMessage(null);
    try {
      const res = await fetch("/api/store/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      }).then((r) => r.json());
      if (!res.ok) throw new Error(res.error || "خطا در ثبت سفارش");
      setMessage("سفارش ثبت شد. در حال پردازش پرداخت یا کیف پول.");
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" dir="rtl">
      {products.map((p) => (
        <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{p.name}</h3>
              <p className="text-sm text-slate-600">{p.description}</p>
            </div>
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs text-white">
              {p.productType === "subscription" ? "اشتراک" : "خرید تکی"}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-800">
            <span className="text-xl font-bold">{p.price.toLocaleString("fa-IR")}</span>
            <span>{p.currency}</span>
            {p.interval && <span className="rounded bg-slate-100 px-2 py-1 text-xs">{p.interval}</span>}
          </div>
          <button
            onClick={() => buy(p.id)}
            disabled={loadingId === p.id}
            className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2 text-center text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loadingId === p.id ? "در حال ثبت..." : "خرید / اشتراک"}
          </button>
        </div>
      ))}
      {message && <div className="md:col-span-3 text-right text-sm text-slate-700">{message}</div>}
    </div>
  );
}
