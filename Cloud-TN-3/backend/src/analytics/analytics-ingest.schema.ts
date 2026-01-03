import { z } from 'z';

/**
 * Analytics Event Schemas
 */

export const EventType = z.enum([
  'page_view',
  'article_view',
  'click',
  'search',
  'dashboard_view',
]);

export const PageViewEventSchema = z.object({
  eventType: z.literal('page_view'),
  path: z.string(),
  referrer: z.string().optional(),
  device: z.string().optional(),
  locale: z.string().optional(),
  meta: z.record(z.any()).optional(),
});

export const ArticleViewEventSchema = z.object({
  eventType: z.literal('article_view'),
  articleId: z.number().optional(),
  userId: z.number().optional(),
  path: z.string(),
  referrer: z.string().optional(),
  device: z.string().optional(),
  locale: z.string().optional(),
  meta: z.record(z.any()).optional(),
});

export const ClickEventSchema = z.object({
  eventType: z.literal('click'),
  destination: z.string().optional(),
  articleId: z.number().optional(),
  userId: z.number().optional(),
  path: z.string(),
  referrer: z.string().optional(),
  device: z.string().optional(),
  locale: z.string().optional(),
  meta: z.record(z.any()).optional(),
});

export const SearchEventSchema = z.object({
  eventType: z.literal('search'),
  query: z.string(),
  resultCount: z.number().optional(),
  userId: z.number().optional(),
  path: z.string(),
  referrer: z.string().optional(),
  device: z.string().optional(),
  locale: z.string().optional(),
  meta: z.record(z.any()).optional(),
});

export const DashboardViewEventSchema = z.object({
  eventType: z.literal('dashboard_view'),
  userId: z.number().optional(),
  workspaceId: z.number().optional(),
  path: z.string(),
  referrer: z.string().optional(),
  device: z.string().optional(),
  locale: z.string().optional(),
  meta: z.record(z.any()).optional(),
});

export const AnalyticsEventBatchSchema = z.object({
  events: z.array(z.any()),
});

export const AnalyticsEventInput = z.discriminatedUnion(EventType, {
  page_view: PageViewEventSchema,
  article_view: ArticleViewEventSchema,
  click: ClickEventSchema,
  search: SearchEventSchema,
  dashboard_view: DashboardViewEventSchema,
});
