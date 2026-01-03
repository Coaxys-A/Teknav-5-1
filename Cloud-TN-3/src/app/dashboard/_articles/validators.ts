import { z } from "zod";

export const ArticleDraftSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  content: z.string().min(1),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const ArticleMetadataSchema = z.object({
  slug: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  readingTime: z.number().optional(),
  wordCount: z.number().optional(),
});

export const ArticlePublicationSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  slug: z.string().optional(),
  meta: ArticleMetadataSchema.optional(),
});

export const TemplateSchema = z.object({
  key: z.string(),
  titlePattern: z.string(),
  tags: z.array(z.string()),
  seoKeywords: z.array(z.string()),
  sections: z.array(z.string()),
  disclaimer: z.string(),
  prerequisites: z.string(),
  imagePlaceholders: z.array(z.string()).optional(),
});

export const AICommandSchema = z.object({
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

export const ReviewDecisionSchema = z.object({
  articleId: z.number(),
  decision: z.enum(["approve", "request_changes", "reject"]),
  notes: z.string().optional(),
  qualityScore: z.number().optional(),
  seoScore: z.number().optional(),
});
