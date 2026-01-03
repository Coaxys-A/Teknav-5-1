"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { redisDel, redisGet, redisSet } from "@/lib/redis-rest";

const articleActionSchema = z.object({
  ids: z.array(z.number()).min(1),
  payload: z
    .object({
      scheduleAt: z.string().optional(),
      reason: z.string().optional(),
    })
    .optional(),
});

const listSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(50).default(10),
  search: z.string().optional(),
  sort: z.string().optional(),
  status: z.string().optional(),
  role: z.enum(["writer", "admin", "owner"]).default("writer"),
});

const sampleArticles = Array.from({ length: 64 }).map((_, i) => ({
  id: i + 1,
  title: `Article ${i + 1}`,
  category: "Tech",
  tags: ["ai", "security"].slice(0, (i % 2) + 1),
  wordCount: 800 + i * 5,
  readingTime: 5 + (i % 7),
  aiScore: Math.round(Math.random() * 100),
  seoScore: Math.round(Math.random() * 100),
  updatedAt: new Date(Date.now() - i * 3600_000).toISOString(),
  author: `User ${i % 10}`,
  status: ["DRAFT", "SUBMITTED", "IN_REVIEW", "CHANGES_REQUESTED", "APPROVED", "SCHEDULED", "PUBLISHED"][i % 7],
}));

export type ArticleListItem = (typeof sampleArticles)[number];

function applyList(input: z.infer<typeof listSchema>): { rows: ArticleListItem[]; total: number; page: number; pageSize: number } {
  const search = input.search?.toLowerCase() ?? "";
  const filtered = sampleArticles.filter((a) =>
    (input.status ? a.status === input.status : true) &&
    (search ? a.title.toLowerCase().includes(search) || a.author.toLowerCase().includes(search) : true),
  );
  const [field, dir] = (input.sort ?? "").split(":");
  const sorted = field
    ? [...filtered].sort((a: any, b: any) => {
        const av = a[field] ?? "";
        const bv = b[field] ?? "";
        if (av < bv) return dir === "desc" ? 1 : -1;
        if (av > bv) return dir === "desc" ? -1 : 1;
        return 0;
      })
    : filtered;
  const start = (input.page - 1) * input.pageSize;
  return { rows: sorted.slice(start, start + input.pageSize), total: sorted.length, page: input.page, pageSize: input.pageSize };
}

export async function loadArticles(input: Partial<z.infer<typeof listSchema>>) {
  const parsed = listSchema.parse(input);
  const key = `articles:${parsed.role}:${JSON.stringify(parsed)}`;
  const cached = await redisGet(key);
  if (cached) {
    try {
      return JSON.parse(cached as string) as ReturnType<typeof applyList>;
    } catch {
      // ignore
    }
  }
  const result = applyList(parsed);
  await redisSet(key, result, 60);
  return result;
}

async function invalidate() {
  await redisDel("owner:articles");
  revalidatePath("/dashboard/owner/articles");
  revalidatePath("/dashboard/admin/articles");
  revalidatePath("/dashboard/writer/articles");
}

export async function deleteArticle(input: z.infer<typeof articleActionSchema>) {
  articleActionSchema.parse(input);
  await invalidate();
  return { ok: true };
}

export async function restoreArticle(input: z.infer<typeof articleActionSchema>) {
  articleActionSchema.parse(input);
  await invalidate();
  return { ok: true };
}

export async function submitForReview(input: z.infer<typeof articleActionSchema>) {
  articleActionSchema.parse(input);
  await invalidate();
  return { ok: true };
}

export async function approveArticle(input: z.infer<typeof articleActionSchema>) {
  articleActionSchema.parse(input);
  await invalidate();
  return { ok: true };
}

export async function requestChanges(input: z.infer<typeof articleActionSchema>) {
  articleActionSchema.parse(input);
  await invalidate();
  return { ok: true };
}

export async function forcePublish(input: z.infer<typeof articleActionSchema>) {
  articleActionSchema.parse(input);
  await invalidate();
  return { ok: true };
}

export async function markReady(input: z.infer<typeof articleActionSchema>) {
  articleActionSchema.parse(input);
  await invalidate();
  return { ok: true };
}

export async function getDraftPreview(articleId: string) {
  const cached = await redisGet(`draft:${articleId}`);
  if (!cached) return { ok: true, draft: null };
  try {
    return { ok: true, draft: JSON.parse(cached as string) };
  } catch {
    return { ok: true, draft: null };
  }
}

export async function schedulePublish(input: z.infer<typeof articleActionSchema>) {
  articleActionSchema.parse(input);
  await invalidate();
  return { ok: true };
}
