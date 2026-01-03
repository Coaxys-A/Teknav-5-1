import "server-only";
import { redisGet, redisSet } from "@/lib/redis-rest";
import { z } from "zod";

const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
  sort: z.string().optional(),
  filters: z.record(z.string(), z.any()).optional(),
});

type PaginationInput = z.infer<typeof paginationSchema>;

type ListResult<T> = {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
};

const apiHost = process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? "";

async function fetchJson<T>(path: string): Promise<T | null> {
  if (!apiHost) return null;
  try {
    const res = await fetch(`${apiHost}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function cachedList<T>(key: string, fallback: () => Promise<ListResult<T>>, ttl = 60): Promise<ListResult<T>> {
  const cached = await redisGet(key);
  if (cached) {
    try {
      return JSON.parse(cached) as ListResult<T>;
    } catch {
      // ignore parse errors
    }
  }
  const data = await fallback();
  await redisSet(key, data, ttl);
  return data;
}

function applyPagination<T extends Record<string, any>>(items: T[], input: PaginationInput): ListResult<T> {
  const page = input.page;
  const pageSize = input.pageSize;
  const search = input.search?.toLowerCase() ?? "";
  const filtered = items.filter((item) =>
    search ? Object.values(item).some((v) => String(v ?? "").toLowerCase().includes(search)) : true,
  );
  const [field, dir] = (input.sort ?? "").split(":");
  const sorted = field
    ? [...filtered].sort((a, b) => {
        const av = a[field] ?? "";
        const bv = b[field] ?? "";
        if (av < bv) return dir === "desc" ? 1 : -1;
        if (av > bv) return dir === "desc" ? -1 : 1;
        return 0;
      })
    : filtered;
  const start = (page - 1) * pageSize;
  const rows = sorted.slice(start, start + pageSize);
  return { rows, total: sorted.length, page, pageSize };
}

const sampleTenants = Array.from({ length: 22 }).map((_, i) => ({
  id: i + 1,
  slug: `tenant-${i + 1}`,
  legalName: `Tenant ${i + 1} LLC`,
  displayName: `Tenant ${i + 1}`,
  plan: i % 2 === 0 ? "pro" : "free",
  primaryDomain: `t${i + 1}.example.com`,
}));

export async function listTenants(input: PaginationInput) {
  const parsed = paginationSchema.parse(input);
  return cachedList(`owner:tenants:${JSON.stringify(parsed)}`, async () => {
    const api = await fetchJson<ListResult<(typeof sampleTenants)[number]>>(
      `/api/owner/tenants?page=${parsed.page}&pageSize=${parsed.pageSize}&search=${parsed.search ?? ""}&sort=${parsed.sort ?? ""}`,
    );
    if (api?.rows) return api;
    return applyPagination(sampleTenants, parsed);
  });
}

const sampleWorkspaces = Array.from({ length: 35 }).map((_, i) => ({
  id: i + 1,
  name: `Workspace ${i + 1}`,
  slug: `workspace-${i + 1}`,
  tenantId: (i % 5) + 1,
  plan: i % 3 === 0 ? "pro" : "standard",
}));

export async function listWorkspaces(input: PaginationInput) {
  const parsed = paginationSchema.parse(input);
  return cachedList(`owner:workspaces:${JSON.stringify(parsed)}`, async () => {
    const api = await fetchJson<ListResult<(typeof sampleWorkspaces)[number]>>(
      `/api/owner/workspaces?page=${parsed.page}&pageSize=${parsed.pageSize}&search=${parsed.search ?? ""}&sort=${parsed.sort ?? ""}`,
    );
    if (api?.rows) return api;
    return applyPagination(sampleWorkspaces, parsed);
  });
}

const sampleUsers = Array.from({ length: 48 }).map((_, i) => ({
  id: i + 1,
  email: `user${i + 1}@example.com`,
  role: i % 4 === 0 ? "OWNER" : i % 3 === 0 ? "ADMIN" : "USER",
  status: i % 7 === 0 ? "disabled" : "active",
}));

export async function listUsers(input: PaginationInput) {
  const parsed = paginationSchema.parse(input);
  return cachedList(`owner:users:${JSON.stringify(parsed)}`, async () => {
    const api = await fetchJson<ListResult<(typeof sampleUsers)[number]>>(
      `/api/owner/users?page=${parsed.page}&pageSize=${parsed.pageSize}&search=${parsed.search ?? ""}&sort=${parsed.sort ?? ""}`,
    );
    if (api?.rows) return api;
    return applyPagination(sampleUsers, parsed);
  });
}

const sampleArticles = Array.from({ length: 60 }).map((_, i) => ({
  id: i + 1,
  title: `Article ${i + 1}`,
  slug: `article-${i + 1}`,
  status: i % 2 === 0 ? "PUBLISHED" : "DRAFT",
  aiScore: Math.round(Math.random() * 100),
}));

export async function listArticles(input: PaginationInput) {
  const parsed = paginationSchema.parse(input);
  return cachedList(`owner:articles:${JSON.stringify(parsed)}`, async () => {
    const api = await fetchJson<ListResult<(typeof sampleArticles)[number]>>(
      `/api/owner/articles?page=${parsed.page}&pageSize=${parsed.pageSize}&search=${parsed.search ?? ""}&sort=${parsed.sort ?? ""}`,
    );
    if (api?.rows) return api;
    return applyPagination(sampleArticles, parsed);
  });
}

const samplePlugins = Array.from({ length: 20 }).map((_, i) => ({
  id: i + 1,
  name: `Plugin ${i + 1}`,
  slug: `plugin-${i + 1}`,
  key: `plugin-${i + 1}`,
  version: "1.0.0",
  status: i % 3 === 0 ? "installed" : "available",
  visibility: i % 2 === 0 ? "public" : "private",
  tags: ["analytics", "seo"].slice(0, (i % 2) + 1),
}));

export async function listPlugins(input: PaginationInput) {
  const parsed = paginationSchema.parse(input);
  return cachedList(`owner:plugins:${JSON.stringify(parsed)}`, async () => {
    const api = await fetchJson<ListResult<(typeof samplePlugins)[number]>>(
      `/api/owner/plugins?page=${parsed.page}&pageSize=${parsed.pageSize}&search=${parsed.search ?? ""}&sort=${parsed.sort ?? ""}`,
    );
    if (api?.rows) return api;
    return applyPagination(samplePlugins, parsed);
  });
}

const samplePluginLogs = Array.from({ length: 25 }).map((_, i) => ({
  id: i + 1,
  pluginId: (i % 5) + 1,
  pluginKey: `plugin-${(i % 5) + 1}`,
  status: i % 4 === 0 ? "failed" : "completed",
  message: `Execution #${i + 1}`,
  createdAt: new Date(Date.now() - i * 300000).toISOString(),
}));

export async function listPluginLogs(input: PaginationInput) {
  const parsed = paginationSchema.parse(input);
  return cachedList(`owner:pluginlogs:${JSON.stringify(parsed)}`, async () => {
    const api = await fetchJson<ListResult<(typeof samplePluginLogs)[number]>>(
      `/api/owner/plugins/logs?page=${parsed.page}&pageSize=${parsed.pageSize}&search=${parsed.search ?? ""}&sort=${parsed.sort ?? ""}`,
    );
    if (api?.rows) return api;
    return applyPagination(samplePluginLogs, parsed);
  });
}

const sampleAiModels = [
  { id: 1, name: "openrouter-deepseek-r1", provider: "openrouter", model: "deepseek/deepseek-r1-0528:free" },
  { id: 2, name: "openrouter-gpt-oss-120b", provider: "openrouter", model: "openai/gpt-oss-120b:free" },
];

export async function listAiModels(input: PaginationInput) {
  const parsed = paginationSchema.parse(input);
  return cachedList(`owner:ai-models:${JSON.stringify(parsed)}`, async () => {
    const api = await fetchJson<ListResult<(typeof sampleAiModels)[number]>>(
      `/api/owner/ai/models?page=${parsed.page}&pageSize=${parsed.pageSize}`,
    );
    if (api?.rows) return api;
    return applyPagination(sampleAiModels, parsed);
  });
}

const sampleAiAgents = [
  { id: 1, name: "TEKNAV Writer", kind: "content", modelConfigId: 1, enabled: true },
  { id: 2, name: "TEKNAV Editor", kind: "assistant", modelConfigId: 2, enabled: true },
];

export async function listAiAgents(input: PaginationInput) {
  const parsed = paginationSchema.parse(input);
  return cachedList(`owner:ai-agents:${JSON.stringify(parsed)}`, async () => {
    const api = await fetchJson<ListResult<(typeof sampleAiAgents)[number]>>(
      `/api/owner/ai/agents?page=${parsed.page}&pageSize=${parsed.pageSize}`,
    );
    if (api?.rows) return api;
    return applyPagination(sampleAiAgents, parsed);
  });
}

const sampleWorkflows = Array.from({ length: 12 }).map((_, i) => ({
  id: i + 1,
  key: `workflow-${i + 1}`,
  name: `Workflow ${i + 1}`,
  status: i % 2 === 0 ? "active" : "paused",
}));

export async function listWorkflows(input: PaginationInput) {
  const parsed = paginationSchema.parse(input);
  return cachedList(`owner:workflows:${JSON.stringify(parsed)}`, async () => {
    const api = await fetchJson<ListResult<(typeof sampleWorkflows)[number]>>(
      `/api/owner/workflows?page=${parsed.page}&pageSize=${parsed.pageSize}&search=${parsed.search ?? ""}&sort=${parsed.sort ?? ""}`,
    );
    if (api?.rows) return api;
    return applyPagination(sampleWorkflows, parsed);
  });
}

const sampleFeatureFlags = Array.from({ length: 15 }).map((_, i) => ({
  id: i + 1,
  key: `flag-${i + 1}`,
  defaultVariant: "on",
  rolloutStrategy: "all",
  isActive: i % 2 === 0,
}));

export async function listFeatureFlags(input: PaginationInput) {
  const parsed = paginationSchema.parse(input);
  return cachedList(`owner:featureflags:${JSON.stringify(parsed)}`, async () => {
    const api = await fetchJson<ListResult<(typeof sampleFeatureFlags)[number]>>(
      `/api/owner/feature-flags?page=${parsed.page}&pageSize=${parsed.pageSize}`,
    );
    if (api?.rows) return api;
    return applyPagination(sampleFeatureFlags, parsed);
  });
}

const sampleExperiments = Array.from({ length: 10 }).map((_, i) => ({
  id: i + 1,
  key: `experiment-${i + 1}`,
  name: `Experiment ${i + 1}`,
  status: i % 2 === 0 ? "running" : "draft",
  variants: { control: "A", test: "B" },
}));

export async function listExperiments(input: PaginationInput) {
  const parsed = paginationSchema.parse(input);
  return cachedList(`owner:experiments:${JSON.stringify(parsed)}`, async () => {
    const api = await fetchJson<ListResult<(typeof sampleExperiments)[number]>>(
      `/api/owner/experiments?page=${parsed.page}&pageSize=${parsed.pageSize}`,
    );
    if (api?.rows) return api;
    return applyPagination(sampleExperiments, parsed);
  });
}

const sampleAnalytics = Array.from({ length: 30 }).map((_, i) => ({
  id: i + 1,
  eventType: i % 3 === 0 ? "page.view" : i % 3 === 1 ? "search.query" : "engagement.click",
  payload: { value: i },
  createdAt: new Date(Date.now() - i * 60000).toISOString(),
}));

export async function listAnalyticsEvents(input: PaginationInput & { type?: string }) {
  const parsed = paginationSchema.extend({ type: z.string().optional() }).parse(input);
  return cachedList(`owner:analytics:${JSON.stringify(parsed)}`, async () => {
    const api = await fetchJson<ListResult<(typeof sampleAnalytics)[number]>>(
      `/api/owner/analytics/logs?page=${parsed.page}&pageSize=${parsed.pageSize}&type=${parsed.type ?? ""}`,
    );
    if (api?.rows) return api;
    const filtered = parsed.type
      ? sampleAnalytics.filter((a) => a.eventType.startsWith(parsed.type as string))
      : sampleAnalytics;
    return applyPagination(filtered, parsed);
  });
}

const sampleLogs = Array.from({ length: 40 }).map((_, i) => ({
  id: i + 1,
  type: i % 3 === 0 ? "audit" : i % 3 === 1 ? "workflow" : "error",
  action: i % 3 === 0 ? "login" : "exec",
  message: `Log ${i + 1}`,
  createdAt: new Date(Date.now() - i * 120000).toISOString(),
}));

export async function listLogs(input: PaginationInput & { type?: string }) {
  const parsed = paginationSchema.extend({ type: z.string().optional() }).parse(input);
  return cachedList(`owner:logs:${JSON.stringify(parsed)}`, async () => {
    const api = await fetchJson<ListResult<(typeof sampleLogs)[number]>>(
      `/api/owner/logs?page=${parsed.page}&pageSize=${parsed.pageSize}&type=${parsed.type ?? ""}`,
    );
    if (api?.rows) return api;
    const filtered = parsed.type ? sampleLogs.filter((l) => l.type === parsed.type) : sampleLogs;
    return applyPagination(filtered, parsed);
  });
}

const sampleSettings = Array.from({ length: 12 }).map((_, i) => ({
  id: i + 1,
  key: `setting.${i + 1}`,
  value: i % 2 === 0 ? "enabled" : "disabled",
  category: i % 2 === 0 ? "system" : "security",
  updatedAt: new Date(Date.now() - i * 3600000).toISOString(),
}));

export async function listSettings(input: PaginationInput) {
  const parsed = paginationSchema.parse(input);
  return cachedList(`owner:settings:${JSON.stringify(parsed)}`, async () => {
    const api = await fetchJson<ListResult<(typeof sampleSettings)[number]>>(
      `/api/owner/settings?page=${parsed.page}&pageSize=${parsed.pageSize}`,
    );
    if (api?.rows) return api;
    return applyPagination(sampleSettings, parsed);
  });
}

const sampleProducts = Array.from({ length: 18 }).map((_, i) => ({
  id: i + 1,
  name: `Product ${i + 1}`,
  price: 10000 + i * 1000,
  currency: "IRR",
  status: i % 2 === 0 ? "active" : "inactive",
}));

export async function listProducts(input: PaginationInput) {
  const parsed = paginationSchema.parse(input);
  return cachedList(`owner:products:${JSON.stringify(parsed)}`, async () => {
    const api = await fetchJson<ListResult<(typeof sampleProducts)[number]>>(
      `/api/owner/store/products?page=${parsed.page}&pageSize=${parsed.pageSize}&search=${parsed.search ?? ""}&sort=${
        parsed.sort ?? ""
      }`,
    );
    if (api?.rows) return api;
    return applyPagination(sampleProducts, parsed);
  });
}

const sampleSubscriptions = Array.from({ length: 22 }).map((_, i) => ({
  id: i + 1,
  userId: (i % 5) + 1,
  productId: (i % 6) + 1,
  status: i % 2 === 0 ? "active" : "canceled",
  currentPeriodEnd: new Date(Date.now() + i * 86400000).toISOString(),
}));

export async function listSubscriptions(input: PaginationInput) {
  const parsed = paginationSchema.parse(input);
  return cachedList(`owner:subs:${JSON.stringify(parsed)}`, async () => {
    const api = await fetchJson<ListResult<(typeof sampleSubscriptions)[number]>>(
      `/api/owner/store/subscriptions?page=${parsed.page}&pageSize=${parsed.pageSize}`,
    );
    if (api?.rows) return api;
    return applyPagination(sampleSubscriptions, parsed);
  });
}

const sampleOrders = Array.from({ length: 25 }).map((_, i) => ({
  id: i + 1,
  userId: (i % 5) + 1,
  productId: (i % 6) + 1,
  amount: 50000 + i * 1000,
  currency: "IRR",
  status: i % 3 === 0 ? "paid" : "pending",
  createdAt: new Date(Date.now() - i * 3600000).toISOString(),
}));

export async function listOrders(input: PaginationInput) {
  const parsed = paginationSchema.parse(input);
  return cachedList(`owner:orders:${JSON.stringify(parsed)}`, async () => {
    const api = await fetchJson<ListResult<(typeof sampleOrders)[number]>>(
      `/api/owner/store/orders?page=${parsed.page}&pageSize=${parsed.pageSize}`,
    );
    if (api?.rows) return api;
    return applyPagination(sampleOrders, parsed);
  });
}

const sampleEntitlements = Array.from({ length: 20 }).map((_, i) => ({
  id: i + 1,
  userId: (i % 5) + 1,
  entitlementType: "access",
  source: "subscription",
  expiresAt: new Date(Date.now() + i * 86400000).toISOString(),
}));

export async function listEntitlements(input: PaginationInput) {
  const parsed = paginationSchema.parse(input);
  return cachedList(`owner:entitlements:${JSON.stringify(parsed)}`, async () => {
    const api = await fetchJson<ListResult<(typeof sampleEntitlements)[number]>>(
      `/api/owner/store/entitlements?page=${parsed.page}&pageSize=${parsed.pageSize}`,
    );
    if (api?.rows) return api;
    return applyPagination(sampleEntitlements, parsed);
  });
}

const sampleUsage = Array.from({ length: 30 }).map((_, i) => ({
  id: i + 1,
  userId: (i % 5) + 1,
  event: "ai_tokens",
  amount: 100 + i * 5,
  createdAt: new Date(Date.now() - i * 600000).toISOString(),
}));

export async function listUsage(input: PaginationInput) {
  const parsed = paginationSchema.parse(input);
  return cachedList(`owner:usage:${JSON.stringify(parsed)}`, async () => {
    const api = await fetchJson<ListResult<(typeof sampleUsage)[number]>>(
      `/api/owner/store/usage?page=${parsed.page}&pageSize=${parsed.pageSize}`,
    );
    if (api?.rows) return api;
    return applyPagination(sampleUsage, parsed);
  });
}

const sampleWebhooks = Array.from({ length: 15 }).map((_, i) => ({
  id: i + 1,
  url: `https://example.com/webhook/${i + 1}`,
  events: ["article.published", "user.registered"].slice(0, (i % 2) + 1),
  status: i % 3 === 0 ? "disabled" : "active",
  createdAt: new Date(Date.now() - i * 3600000).toISOString(),
}));

export async function listWebhooks(input: PaginationInput) {
  const parsed = paginationSchema.parse(input);
  return cachedList(`owner:webhooks:${JSON.stringify(parsed)}`, async () => {
    const api = await fetchJson<ListResult<(typeof sampleWebhooks)[number]>>(
      `/api/owner/webhooks?page=${parsed.page}&pageSize=${parsed.pageSize}`,
    );
    if (api?.rows) return api;
    return applyPagination(sampleWebhooks, parsed);
  });
}
