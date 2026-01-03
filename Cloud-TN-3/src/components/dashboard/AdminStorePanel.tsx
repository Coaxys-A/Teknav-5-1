"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";

const fetcher = (url: string) => fetch(url, { cache: "no-store" }).then((r) => r.json());

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  currency: string;
  productType: string;
  interval?: string | null;
  slug: string;
}

interface Order {
  id: number;
  status: string;
  total: number;
  currency: string;
  product: Product;
  user?: { email?: string };
  createdAt?: string;
}

export function AdminStorePanel() {
  const { data: productsData, mutate: refreshProducts } = useSWR<{ ok: boolean; products: Product[] }>("/api/store/products", fetcher);
  const { data: ordersData, mutate: refreshOrders } = useSWR<{ ok: boolean; orders: Order[] }>("/api/store/orders", fetcher);
  const [form, setForm] = useState({ name: "", description: "", price: "0", currency: "IRT", productType: "one_time", interval: "" });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const products = useMemo(() => productsData?.products ?? [], [productsData]);
  const orders = useMemo(() => ordersData?.orders ?? [], [ordersData]);

  async function createProduct(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/store/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }).then((r) => r.json());
      if (!res.ok) throw new Error(res.error || "خطا در ساخت محصول");
      await refreshProducts();
      setMessage("محصول با موفقیت ثبت شد");
      setForm({ name: "", description: "", price: "0", currency: "IRT", productType: "one_time", interval: "" });
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8" dir="rtl">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="text-right">
            <h3 className="text-lg font-semibold text-slate-900">ثبت محصول/اشتراک</h3>
            <p className="text-sm text-slate-600">برای اشتراک، نوع را subscription و دوره را مشخص کن.</p>
          </div>
        </div>
        <form onSubmit={createProduct} className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            نام
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="rounded border px-3 py-2 text-right"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            قیمت
            <input
              required
              type="number"
              min="0"
              step="1000"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              className="rounded border px-3 py-2 text-right"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            ارز
            <input
              value={form.currency}
              onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
              className="rounded border px-3 py-2 text-right"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            نوع
            <select
              value={form.productType}
              onChange={(e) => setForm((f) => ({ ...f, productType: e.target.value }))}
              className="rounded border px-3 py-2 text-right"
            >
              <option value="one_time">یک‌بار پرداخت</option>
              <option value="subscription">اشتراک</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            توضیحات
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="rounded border px-3 py-2 text-right"
              rows={2}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            دوره (مثلاً monthly)
            <input
              value={form.interval}
              onChange={(e) => setForm((f) => ({ ...f, interval: e.target.value }))}
              className="rounded border px-3 py-2 text-right"
            />
          </label>
          <div className="flex items-end justify-start md:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {submitting ? "در حال ثبت..." : "ثبت محصول"}
            </button>
            {message && <span className="mr-3 text-sm text-slate-700">{message}</span>}
          </div>
        </form>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">محصولات</h3>
            <button onClick={() => refreshProducts()} className="text-sm text-indigo-600">
              بروزرسانی
            </button>
          </div>
          <div className="mt-3 space-y-3">
            {products.map((p) => (
              <div key={p.id} className="rounded border p-3 text-right">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.slug}</div>
                </div>
                <div className="text-sm text-slate-600">{p.description}</div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-700">
                  <span>قیمت: {p.price}</span>
                  <span>ارز: {p.currency}</span>
                  <span>نوع: {p.productType}</span>
                  {p.interval && <span>دوره: {p.interval}</span>}
                </div>
              </div>
            ))}
            {products.length === 0 && <div className="text-sm text-slate-600">محصولی ثبت نشده است.</div>}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">سفارش‌ها</h3>
            <button onClick={() => refreshOrders()} className="text-sm text-indigo-600">
              بروزرسانی
            </button>
          </div>
          <div className="mt-3 space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="rounded border p-3 text-right">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{o.product?.name}</div>
                  <div className="text-xs text-slate-500">وضعیت: {o.status}</div>
                </div>
                <div className="text-sm text-slate-700">
                  مبلغ: {o.total} {o.currency}
                </div>
                <div className="text-xs text-slate-500">کاربر: {o.user?.email ?? "نامشخص"}</div>
                {o.createdAt && <div className="text-xs text-slate-500">تاریخ: {new Date(o.createdAt).toLocaleString("fa-IR")}</div>}
              </div>
            ))}
            {orders.length === 0 && <div className="text-sm text-slate-600">سفارشی ثبت نشده است.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
