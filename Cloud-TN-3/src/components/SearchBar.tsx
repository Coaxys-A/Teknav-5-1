"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBar({ defaultQuery = "" }: { defaultQuery?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(defaultQuery);

  return (
    <form
      className="flex w-full items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const query = q.trim();
        router.push(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
      }}
    >
      <label htmlFor="search-input" className="sr-only">
        جستجو
      </label>
      <input
        id="search-input"
        type="search"
        placeholder="جستجو..."
        value={q}
        onChange={(event) => setQ(event.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-[color:var(--color-brand)]"
      />
      <button
        type="submit"
        className="rounded-lg bg-[color:var(--color-brand)] px-4 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:-translate-y-0.5"
      >
        جستجو
      </button>
    </form>
  );
}
