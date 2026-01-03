"use client";

import useSWR from "swr";
import { useState } from "react";

const fetcher = (url: string) => fetch(url, { cache: "no-store" }).then((r) => r.json());

interface Comment {
  id: number;
  parentId?: number | null;
  body: string;
  guestName?: string | null;
  status: string;
  createdAt: string;
}

export function CommentList({ articleId }: { articleId: number }) {
  const { data, mutate } = useSWR<Comment[]>(`/api/comments/article/${articleId}`, fetcher);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    setSending(true);
    try {
      await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, body: text }),
      });
      setText("");
      mutate();
    } finally {
      setSending(false);
    }
  }

  if (!data) return null;

  return (
    <div className="space-y-4" dir="rtl">
      <div className="rounded-xl border p-3">
        <textarea
          className="w-full rounded border px-3 py-2 text-sm"
          rows={3}
          placeholder="نظر خود را بنویسید"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="mt-2 flex justify-end">
          <button
            onClick={submit}
            disabled={sending || text.length < 3}
            className="rounded bg-slate-900 px-3 py-2 text-white disabled:opacity-60"
          >
            {sending ? "در حال ارسال..." : "ارسال"}
          </button>
        </div>
      </div>
      <div className="space-y-3">
        {data.map((c) => (
          <div key={c.id} className="rounded border p-3 text-sm">
            <div className="text-xs text-slate-500">{c.guestName ?? "کاربر"}</div>
            <p className="mt-1 text-slate-800">{c.body}</p>
            {c.status === "pending" && <span className="text-xs text-amber-600">در انتظار تایید</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
