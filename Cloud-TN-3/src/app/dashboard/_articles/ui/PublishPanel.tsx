'use client';

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { generateSlug, publishArticleToFS, validateFrontmatter } from "../publish-actions";
import { toast } from "@/components/ui/use-toast";

export function PublishPanel({ articleId }: { articleId: number }) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [meta, setMeta] = useState("{}");
  const [isPending, startTransition] = useTransition();

  const createSlug = async () => {
    const res = await generateSlug(title);
    setSlug(res);
  };

  const publish = () => {
    startTransition(async () => {
      try {
        const metaJson = meta ? JSON.parse(meta) : undefined;
        await validateFrontmatter({ id: articleId, title, content, slug, meta: metaJson });
        await publishArticleToFS({ id: articleId, title, content, slug, meta: metaJson });
        toast({ title: "Published" });
      } catch (err: any) {
        toast({ title: "Error", description: err.message ?? "publish failed" });
      }
    });
  };

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <div className="flex gap-2">
        <Input placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <Button type="button" onClick={createSlug}>
          Generate slug
        </Button>
      </div>
      <Textarea placeholder="Content" value={content} onChange={(e) => setContent(e.target.value)} className="min-h-[160px]" />
      <Textarea placeholder="Meta JSON" value={meta} onChange={(e) => setMeta(e.target.value)} />
      <Button type="button" onClick={publish} disabled={isPending}>
        {isPending ? "Publishing..." : "Publish"}
      </Button>
    </div>
  );
}
