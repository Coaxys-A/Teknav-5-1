"use server";

import { z } from "zod";
import { redisGet, redisSet } from "@/lib/redis-rest";

const aiRequestSchema = z.object({
  model: z.enum(["deepseek", "gpt-oss-120b", "gpt-4"]),
  mode: z.enum([
    "rewrite",
    "summary",
    "expand",
    "tone",
    "seo",
    "title",
    "meta",
    "keywords",
    "headline",
    "factcheck",
    "hallucination",
    "persian",
    "technical",
  ]),
  text: z.string().min(1),
});

export async function aiAssistAction(input: z.infer<typeof aiRequestSchema>) {
  aiRequestSchema.parse(input);
  return { ok: true, result: `${input.mode.toUpperCase()}: ${input.text.slice(0, 120)}` };
}

const convoSchema = z.object({
  session: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

export async function saveConversation(input: z.infer<typeof convoSchema>) {
  convoSchema.parse(input);
  const key = `ai:convo:${input.session}`;
  const existing = await redisGet(key);
  const list = existing ? JSON.parse(existing as string) : [];
  list.push({ role: input.role, content: input.content, ts: Date.now() });
  await redisSet(key, list, 3600);
  return { ok: true };
}
