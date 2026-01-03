"use server";

import { z } from "zod";
import { redisGet, redisSet } from "@/lib/redis-rest";
import { callBackend } from "@/lib/backend";

const chatSchema = z.object({
  model: z.enum(["deepseek", "gpt-oss-120b", "gpt-4"]),
  message: z.string().min(1),
  context: z.string().optional(),
});

const toolSchema = z.object({
  model: z.enum(["deepseek", "gpt-oss-120b", "gpt-4"]),
  action: z.enum([
    "grammar",
    "technical",
    "simple",
    "extend",
    "expand",
    "shorten",
    "summarize",
    "tldr",
    "takeaways",
    "disclaimer",
    "prerequisites",
    "lastUpdated",
    "breadcrumbs",
    "structure",
    "seo",
    "rewrite",
  ]),
  text: z.string().min(1),
});

const draftSchema = z.object({
  articleId: z.string(),
  content: z.string(),
  meta: z.record(z.string(), z.any()).optional(),
  ts: z.number().optional(),
});

const revisionSchema = z.object({
  articleId: z.string(),
  content: z.string(),
  meta: z.record(z.string(), z.any()).optional(),
  ts: z.number(),
});

const translationSchema = z.object({
  articleId: z.string(),
  source: z.string(),
  target: z.string(),
  text: z.string(),
  title: z.string().optional(),
});

const mediaSchema = z.object({
  articleId: z.string(),
  name: z.string(),
  url: z.string().url().optional(),
  content: z.string().optional(),
});

const translationLocales = ["fa", "en"] as const;
type TranslationLocale = (typeof translationLocales)[number];

const matrixKey = (articleId: string) => `translations:${articleId}`;

async function updateMatrix(articleId: string, updates: Record<string, string>) {
  const existing = await redisGet(matrixKey(articleId));
  const matrix = existing ? (JSON.parse(existing as string) as Record<string, string>) : {};
  const next = { ...matrix, ...updates };
  await redisSet(matrixKey(articleId), next, 3600 * 24);
  return next;
}

export async function listTranslationMatrixAction(articleId: string) {
  const existing = await redisGet(matrixKey(articleId));
  const matrix = existing ? (JSON.parse(existing as string) as Record<string, string>) : {};
  const rows = translationLocales.map((loc) => ({
    locale: loc,
    status: matrix[loc] ?? (loc === "fa" ? "source" : "missing"),
  }));
  return { ok: true, rows };
}

export async function aiChatAction(input: z.infer<typeof chatSchema>) {
  chatSchema.parse(input);
  try {
    const res = await callBackend<{ reply: string }>({
      path: "/api/ai/run",
      method: "POST",
      body: { ...input },
      cache: "no-store",
    });
    return { ok: true, reply: res.reply };
  } catch {
    return { ok: true, reply: `Model ${input.model} response to: ${input.message}` };
  }
}

export async function aiToolAction(input: z.infer<typeof toolSchema>) {
  toolSchema.parse(input);
  const map: Record<string, string> = {
    grammar: "rewrite",
    technical: "rewrite",
    simple: "rewrite",
    extend: "rewrite",
    expand: "rewrite",
    shorten: "summarize",
    summarize: "summarize",
    tldr: "summarize",
    takeaways: "summarize",
    disclaimer: "rewrite",
    prerequisites: "rewrite",
    lastUpdated: "rewrite",
    breadcrumbs: "rewrite",
    structure: "rewrite",
    seo: "suggest-metadata",
    rewrite: "rewrite",
  };
  const endpoint = map[input.action] ?? "rewrite";
  try {
    const res = await callBackend<{ result?: string; output?: string }>({
      path: `/api/ai/${endpoint}`,
      method: "POST",
      body: { text: input.text, tone: input.action, model: input.model },
      cache: "no-store",
    });
    const result = res.result ?? res.output ?? "";
    return { ok: true, result: result || `${input.action.toUpperCase()}: ${input.text.slice(0, 240)}` };
  } catch {
    return { ok: true, result: `${input.action.toUpperCase()}: ${input.text.slice(0, 240)}` };
  }
}

export async function saveDraftAction(input: z.infer<typeof draftSchema>) {
  draftSchema.parse(input);
  const ts = input.ts ?? Date.now();
  const payload = { ...input, ts };
  await redisSet(`draft:${input.articleId}`, payload, 3600 * 24);
  const rev: z.infer<typeof revisionSchema> = { articleId: input.articleId, content: input.content, meta: input.meta, ts };
  const existing = await redisGet(`rev:${input.articleId}`);
  const list: z.infer<typeof revisionSchema>[] = existing ? JSON.parse(existing as string) : [];
  list.unshift(rev);
  await redisSet(`rev:${input.articleId}`, list.slice(0, 10), 3600 * 24);
  return { ok: true };
}

async function loadDraft(articleId: string) {
  const cached = await redisGet(`draft:${articleId}`);
  if (cached) {
    try {
      return JSON.parse(cached as string) as z.infer<typeof draftSchema>;
    } catch {
      // ignore
    }
  }
  try {
    const data = await callBackend<any>({ path: `/api/articles/${articleId}`, cache: "no-store" });
    return { articleId, content: data?.content ?? "", meta: data?.meta ?? {}, ts: Date.now() };
  } catch {
    return null;
  }
}

export async function loadDraftAction(articleId: string) {
  const draft = await loadDraft(articleId);
  return { ok: true, draft };
}

export async function listRevisionsAction(articleId: string) {
  const cached = await redisGet(`rev:${articleId}`);
  if (!cached) return { ok: true, revisions: [] as z.infer<typeof revisionSchema>[] };
  try {
    return { ok: true, revisions: JSON.parse(cached as string) as z.infer<typeof revisionSchema>[] };
  } catch {
    return { ok: true, revisions: [] as z.infer<typeof revisionSchema>[] };
  }
}

export async function translateAction(input: z.infer<typeof translationSchema>) {
  translationSchema.parse(input);
  try {
    const res = await callBackend<{ translated?: string; title?: string; summary?: string; content?: string }>({
      path: "/api/translation/translate",
      method: "POST",
      body: input,
      cache: "no-store",
    });
    const translated = res.translated ?? res.content ?? `[${input.target}] ${input.text}`;
    await updateMatrix(input.articleId, { [input.target]: "ready", [input.source]: "source" });
    return { ok: true, translated };
  } catch {
    await updateMatrix(input.articleId, { [input.target]: "ready", [input.source]: "source" });
    return { ok: true, translated: `[${input.target}] ${input.text}` };
  }
}

export async function mediaUploadAction(input: z.infer<typeof mediaSchema>) {
  mediaSchema.parse(input);
  const key = `media:${input.articleId}`;
  const existing = await redisGet(key);
  const list = existing ? (JSON.parse(existing as string) as any[]) : [];
  let uploadedUrl = input.url;
  if (!uploadedUrl) {
    try {
      const res = await callBackend<{ url: string }>({
        path: "/api/media/upload",
        method: "POST",
        body: { articleId: input.articleId, name: input.name, content: input.content },
        cache: "no-store",
      });
      uploadedUrl = res.url;
    } catch {
      uploadedUrl = `data:${input.content?.length ?? 0}`;
    }
  }
  list.unshift({ name: input.name, url: uploadedUrl, ts: Date.now() });
  await redisSet(key, list.slice(0, 20), 3600 * 24);
  return { ok: true, items: list };
}

export async function listMediaAction(articleId: string) {
  const cached = await redisGet(`media:${articleId}`);
  if (!cached) return { ok: true, items: [] as any[] };
  try {
    return { ok: true, items: JSON.parse(cached as string) as any[] };
  } catch {
    return { ok: true, items: [] as any[] };
  }
}

export async function mediaCaptionAction(description?: string) {
  try {
    const res = await callBackend<{ caption: string }>({
      path: "/api/media/alt",
      method: "POST",
      body: { description, prompt: "generate caption" },
      cache: "no-store",
    });
    return { ok: true, caption: res.caption ?? description ?? "" };
  } catch {
    return { ok: true, caption: description ?? "" };
  }
}
