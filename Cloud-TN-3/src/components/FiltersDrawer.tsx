"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function FiltersDrawer({
  defaultCategory,
  defaultOrder = "DESC",
  defaultFrom,
  defaultTo,
}: {
  defaultCategory?: string;
  defaultOrder?: "DESC" | "ASC";
  defaultFrom?: string;
  defaultTo?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("q") ?? "";

  const [category, setCategory] = useState(defaultCategory ?? "");
  const [order, setOrder] = useState<"DESC" | "ASC">(defaultOrder);
  const [from, setFrom] = useState(defaultFrom ?? "");
  const [to, setTo] = useState(defaultTo ?? "");

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const next = new URLSearchParams();
        if (q) next.set("q", q);
        if (category.trim()) next.set("category", category.trim());
        next.set("order", order);
        if (from) next.set("from", from);
        if (to) next.set("to", to);
        router.push(`/search?${next.toString()}`);
      }}
    >
      <label htmlFor="filter-category" className="sr-only">
        دسته
      </label>
      <input
        id="filter-category"
        type="text"
        placeholder="دسته (slug)"
        value={category}
        onChange={(event) => setCategory(event.target.value)}
        className="w-36 rounded-lg border border-slate-300 px-2 py-2 text-sm transition-colors focus:border-[color:var(--color-brand)]"
      />
      <label htmlFor="filter-order" className="sr-only">
        ترتیب
      </label>
      <select
        id="filter-order"
        value={order}
        onChange={(event) => setOrder(event.target.value as "DESC" | "ASC")}
        className="rounded-lg border border-slate-300 px-2 py-2 text-sm transition-colors focus:border-[color:var(--color-brand)]"
      >
        <option value="DESC">جدیدترین</option>
        <option value="ASC">قدیمی‌ترین</option>
      </select>
      <label htmlFor="filter-from" className="sr-only">
        از تاریخ
      </label>
      <input
        id="filter-from"
        type="date"
        value={from}
        onChange={(event) => setFrom(event.target.value)}
        className="rounded-lg border border-slate-300 px-2 py-2 text-sm transition-colors focus:border-[color:var(--color-brand)]"
      />
      <label htmlFor="filter-to" className="sr-only">
        تا تاریخ
      </label>
      <input
        id="filter-to"
        type="date"
        value={to}
        onChange={(event) => setTo(event.target.value)}
        className="rounded-lg border border-slate-300 px-2 py-2 text-sm transition-colors focus:border-[color:var(--color-brand)]"
      />
      <button
        type="submit"
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-[color:var(--color-brand)] hover:text-[color:var(--color-brand)]"
      >
        اعمال فیلتر
      </button>
    </form>
  );
}
