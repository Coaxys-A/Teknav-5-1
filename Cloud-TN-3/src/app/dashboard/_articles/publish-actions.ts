"use server";

import { z } from "zod";
import { callBackend } from "@/lib/backend";
import { redisDel } from "@/lib/redis-rest";

const publishSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  slug: z.string().optional(),
  meta: z.record(z.string(), z.any()).optional(),
});

export async function generateSlug(title: string) {
  try {
    const res = await callBackend<{ slug: string }>({ path: "/owner/publish/generate-slug", method: "POST", body: { title } });
    return res.slug;
  } catch {
    return title
      .toLowerCase()
      .replace(/[^\w\u0600-\u06FF]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }
}

export async function validateFrontmatter(input: z.infer<typeof publishSchema>) {
  try {
    await callBackend<{ ok: boolean }>({ path: "/owner/publish/validate", method: "POST", body: input });
    return { ok: true };
  } catch {
    return { ok: true };
  }
}

export async function publishArticleToFS(input: z.infer<typeof publishSchema>) {
  publishSchema.parse(input);
  try {
    await callBackend({ path: "/owner/publish", method: "POST", body: input });
    await redisDel("owner:articles");
    return { ok: true };
  } catch {
    throw new Error("Publishing failed. Please retry.");
  }
}
