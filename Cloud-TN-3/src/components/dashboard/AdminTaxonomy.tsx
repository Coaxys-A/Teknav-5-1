"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cx } from "@/lib/utils";

type Item = { id: number; name: string; slug?: string; description?: string };

async function fetcher(url: string, options?: RequestInit) {
  const res = await fetch(url, { ...options, headers: { "Content-Type": "application/json" } });
  const json = await res.json();
  if (!res.ok || json.ok === false) {
    throw new Error(json.error ?? "خطا");
  }
  return json;
}

interface Props {
  type: "category" | "tag";
}

export function AdminTaxonomy({ type }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listUrl = type === "category" ? "/api/categories/list" : "/api/tags/list";
  const createUrl = type === "category" ? "/api/categories/create" : "/api/tags/create";
  const deleteUrl = type === "category" ? "/api/categories/delete" : "/api/tags/delete";
  const updateUrl = type === "category" ? "/api/categories/update" : "/api/tags/update";

  async function load() {
    setError(null);
    try {
      const data = await fetcher(listUrl);
      setItems(data.categories ?? data.tags ?? []);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (editingId) {
        await fetcher(updateUrl, {
          method: "POST",
          body: JSON.stringify({ id: editingId, name, description }),
        });
      } else {
        await fetcher(createUrl, {
          method: "POST",
          body: JSON.stringify({ name, description }),
        });
      }
      setName("");
      setDescription("");
      setEditingId(null);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4" dir="rtl">
      <form
        onSubmit={handleCreate}
        className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70"
      >
        <div className="flex items-center justify-between">
          <p className="font-semibold text-slate-900 dark:text-slate-100">{type === "category" ? "دسته‌بندی" : "برچسب"}</p>
          <motion.span
            key={items.length}
            className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-200"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            {items.length} مورد
          </motion.span>
        </div>
        <input
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-right dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
          placeholder="عنوان"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        {type === "category" && (
          <textarea
            className="h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-right dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
            placeholder="توضیح"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        )}
        <button
          type="submit"
          disabled={loading}
          className={cx(
            "w-full rounded-lg bg-[color:var(--color-brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm",
            loading && "opacity-70",
          )}
        >
          {loading ? "در حال ذخیره..." : editingId ? "ویرایش" : "ایجاد"}
        </button>
        {error && <p className="text-sm text-rose-600">{error}</p>}
      </form>

      <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500 text-right">موردی ثبت نشده است.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
              <div className="flex items-center justify-between gap-2">
                <div className="text-right">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</p>
                  {item.description && <p className="text-xs text-slate-500 dark:text-slate-300">{item.description}</p>}
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <button
                    type="button"
                    className="text-indigo-600 hover:underline"
                    onClick={() => {
                      setEditingId(item.id);
                      setName(item.name);
                      setDescription(item.description ?? "");
                    }}
                  >
                    ویرایش
                  </button>
                  <button
                    type="button"
                    className="text-rose-600 hover:underline"
                    onClick={async () => {
                      try {
                        await fetcher(deleteUrl, { method: "POST", body: JSON.stringify({ id: item.id }) });
                        await load();
                      } catch (err) {
                        setError((err as Error).message);
                      }
                    }}
                  >
                    حذف
                  </button>
                </div>
              </div>
              <div className="mt-1 text-[11px] text-slate-500 text-right">شناسه: {item.id}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
