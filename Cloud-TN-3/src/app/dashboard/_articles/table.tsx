'use client';

import React, { useTransition } from "react";
import { loadArticles, deleteArticle, restoreArticle, submitForReview, approveArticle, requestChanges, forcePublish, schedulePublish, ArticleListItem } from "./actions";
import { EntityTableClient } from "../owner/_components/entity-table-client";
import { Column } from "../owner/_components/data-table";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

const articleColumns: Column<ArticleListItem>[] = [
  { id: "title", label: "Title", accessor: (r) => r.title, sortable: true },
  { id: "category", label: "Category", accessor: (r) => r.category },
  { id: "tags", label: "Tags", accessor: (r) => r.tags.join(", ") },
  { id: "wordCount", label: "Words", accessor: (r) => r.wordCount, sortable: true },
  { id: "readingTime", label: "Read Time", accessor: (r) => `${r.readingTime}m` },
  { id: "aiScore", label: "AI", accessor: (r) => r.aiScore },
  { id: "seoScore", label: "SEO", accessor: (r) => r.seoScore },
  { id: "updatedAt", label: "Updated", accessor: (r) => new Date(r.updatedAt).toLocaleString() },
  { id: "author", label: "Author", accessor: (r) => r.author },
  { id: "status", label: "Status", accessor: (r) => r.status },
];

export function ArticleTable({ role }: { role: "writer" | "admin" | "owner" }) {
  const [isPending, startTransition] = useTransition();
  const [initial, setInitial] = React.useState<{ rows: ArticleListItem[]; total: number; page: number; pageSize: number }>({
    rows: [],
    total: 0,
    page: 1,
    pageSize: 10,
  });

  const fetcher = async ({ page, sort, search }: { page: number; sort?: string; search?: string }) =>
    loadArticles({ page, pageSize: 10, sort, search, role });

  const mutate = (fn: (ids: number[]) => Promise<any>) => {
    startTransition(async () => {
      const ids = initial.rows[0] ? [initial.rows[0].id] : [1];
      await fn(ids);
      toast({ title: "Updated" });
      const refreshed = await fetcher({ page: 1 });
      setInitial(refreshed);
    });
  };

  React.useEffect(() => {
    let active = true;
    fetcher({ page: 1 }).then((res) => {
      if (active) setInitial(res);
    });
    return () => {
      active = false;
    };
  }, [role]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" disabled={isPending} onClick={() => mutate((ids) => submitForReview({ ids }))}>
          Submit for review
        </Button>
        <Button size="sm" variant="secondary" disabled={isPending} onClick={() => mutate((ids) => approveArticle({ ids }))}>
          Approve
        </Button>
        <Button size="sm" variant="secondary" disabled={isPending} onClick={() => mutate((ids) => requestChanges({ ids, payload: { reason: "Need fixes" } }))}>
          Request changes
        </Button>
        <Button size="sm" variant="secondary" disabled={isPending} onClick={() => mutate((ids) => forcePublish({ ids }))}>
          Force publish
        </Button>
      </div>
      <EntityTableClient
        initialData={initial.rows}
        total={initial.total}
        page={initial.page}
        pageSize={initial.pageSize}
        columns={articleColumns}
        onFetch={fetcher}
      />
    </div>
  );
}
