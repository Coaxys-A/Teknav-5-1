"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { redisDel, redisGet, redisSet } from "@/lib/redis-rest";

type ActionResult<T = any> = { ok: true; data?: T; message?: string } | { ok: false; error: string };

async function actionWrapper<T>(fn: () => Promise<T>, paths: string[], cacheKeys: string[] = []): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    for (const key of cacheKeys) await redisDel(key);
    for (const p of paths) revalidatePath(p);
    return { ok: true, data, message: "success" };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "unknown_error" };
  }
}

const tenantSchema = z.object({
  slug: z.string(),
  legalName: z.string(),
  displayName: z.string(),
  primaryDomain: z.string(),
  defaultLocale: z.string(),
  supportedLocales: z.array(z.string()),
  plan: z.string(),
});

export async function createTenantAction(input: z.infer<typeof tenantSchema>): Promise<ActionResult> {
  tenantSchema.parse(input);
  return actionWrapper(async () => null, ["/dashboard/owner/tenants"], ["owner:tenants"]);
}

export async function updateTenantAction(id: number, input: Partial<z.infer<typeof tenantSchema>>): Promise<ActionResult> {
  tenantSchema.partial().parse(input);
  return actionWrapper(async () => null, ["/dashboard/owner/tenants"], ["owner:tenants", `tenant:${id}`]);
}

export async function deleteTenantAction(id: number): Promise<ActionResult> {
  return actionWrapper(async () => null, ["/dashboard/owner/tenants"], ["owner:tenants", `tenant:${id}`]);
}

export async function restoreTenantAction(id: number): Promise<ActionResult> {
  return actionWrapper(async () => null, ["/dashboard/owner/tenants"], ["owner:tenants", `tenant:${id}`]);
}

const workspaceSchema = z.object({
  name: z.string(),
  slug: z.string(),
  tenantId: z.number().optional(),
  plan: z.string().optional(),
  logo: z.string().optional(),
});

export async function createWorkspaceAction(input: z.infer<typeof workspaceSchema>): Promise<ActionResult> {
  workspaceSchema.parse(input);
  return actionWrapper(async () => null, ["/dashboard/owner/workspaces"], ["owner:workspaces"]);
}

export async function updateWorkspaceAction(id: number, input: Partial<z.infer<typeof workspaceSchema>>): Promise<ActionResult> {
  workspaceSchema.partial().parse(input);
  return actionWrapper(async () => null, ["/dashboard/owner/workspaces"], ["owner:workspaces", `workspace:${id}`]);
}

export async function deleteWorkspaceAction(id: number): Promise<ActionResult> {
  return actionWrapper(async () => null, ["/dashboard/owner/workspaces"], ["owner:workspaces", `workspace:${id}`]);
}

export async function restoreWorkspaceAction(id: number): Promise<ActionResult> {
  return actionWrapper(async () => null, ["/dashboard/owner/workspaces"], ["owner:workspaces", `workspace:${id}`]);
}

const userRoleSchema = z.object({ role: z.string() });
export async function assignUserRoleAction(id: number, input: z.infer<typeof userRoleSchema>): Promise<ActionResult> {
  userRoleSchema.parse(input);
  return actionWrapper(async () => null, ["/dashboard/owner/users"], ["owner:users"]);
}

const userBanSchema = z.object({ status: z.enum(["active", "disabled"]) });
export async function userBanAction(id: number, input: z.infer<typeof userBanSchema>): Promise<ActionResult> {
  userBanSchema.parse(input);
  return actionWrapper(async () => null, ["/dashboard/owner/users"], ["owner:users"]);
}

const resetPasswordSchema = z.object({ password: z.string().min(8) });
export async function resetPasswordAction(id: number, input: z.infer<typeof resetPasswordSchema>): Promise<ActionResult> {
  resetPasswordSchema.parse(input);
  return actionWrapper(async () => null, ["/dashboard/owner/users"], ["owner:users"]);
}

export async function deleteUserAction(id: number): Promise<ActionResult> {
  return actionWrapper(async () => null, ["/dashboard/owner/users"], ["owner:users", `user:${id}`]);
}

export async function restoreUserAction(id: number): Promise<ActionResult> {
  return actionWrapper(async () => null, ["/dashboard/owner/users"], ["owner:users", `user:${id}`]);
}

const articleAdminSchema = z.object({ status: z.string(), aiScore: z.number().optional() });
export async function articleAdminAction(id: number, input: z.infer<typeof articleAdminSchema>): Promise<ActionResult> {
  articleAdminSchema.parse(input);
  return actionWrapper(async () => null, ["/dashboard/owner/articles"], ["owner:articles", `article:meta:${id}`]);
}

const pluginUploadSchema = z.object({ name: z.string(), slug: z.string(), fileContent: z.string() });
export async function pluginUploadAction(input: z.infer<typeof pluginUploadSchema>): Promise<ActionResult> {
  pluginUploadSchema.parse(input);
  return actionWrapper(async () => null, ["/dashboard/owner/plugins"], ["owner:plugins"]);
}

const pluginVersionSchema = z.object({ pluginId: z.number(), version: z.string(), manifest: z.any().optional() });
export async function pluginVersionAction(input: z.infer<typeof pluginVersionSchema>): Promise<ActionResult> {
  pluginVersionSchema.parse(input);
  return actionWrapper(async () => null, ["/dashboard/owner/plugins"], ["owner:plugins"]);
}

const aiModelSchema = z.object({
  name: z.string(),
  provider: z.string(),
  model: z.string(),
  temperature: z.number().optional(),
  maxTokens: z.number().optional(),
});
export async function createAiModelAction(input: z.infer<typeof aiModelSchema>): Promise<ActionResult> {
  aiModelSchema.parse(input);
  return actionWrapper(async () => null, ["/dashboard/owner/ai"], ["owner:aiModels"]);
}

const aiAgentSchema = z.object({
  name: z.string(),
  kind: z.string(),
  modelConfigId: z.number(),
  enabled: z.boolean().optional(),
  systemPrompt: z.string().optional(),
});
export async function upsertAiAgentAction(id: number | null, input: z.infer<typeof aiAgentSchema>): Promise<ActionResult> {
  aiAgentSchema.parse(input);
  const keys = ["owner:aiAgents"];
  if (id) keys.push(`aiAgent:${id}`);
  return actionWrapper(async () => null, ["/dashboard/owner/ai"], keys);
}

const featureFlagSchema = z.object({
  key: z.string(),
  defaultVariant: z.string(),
  isActive: z.boolean().optional(),
  targetingRules: z.any().optional(),
});
export async function upsertFeatureFlagAction(id: number | null, input: z.infer<typeof featureFlagSchema>): Promise<ActionResult> {
  featureFlagSchema.parse(input);
  const keys = ["owner:featureFlags"];
  if (id) keys.push(`featureFlag:${id}`);
  return actionWrapper(async () => null, ["/dashboard/owner/feature-flags"], keys);
}

const rolloutSchema = z.object({ key: z.string(), rules: z.any() });
export async function featureFlagRolloutAction(input: z.infer<typeof rolloutSchema>): Promise<ActionResult> {
  rolloutSchema.parse(input);
  return actionWrapper(async () => null, ["/dashboard/owner/feature-flags"], ["owner:featureFlags"]);
}

const experimentSchema = z.object({ key: z.string(), name: z.string(), status: z.string(), traffic: z.record(z.string(), z.number()) });
export async function experimentTrafficAction(id: number | null, input: z.infer<typeof experimentSchema>): Promise<ActionResult> {
  experimentSchema.parse(input);
  const keys = ["owner:experiments"];
  if (id) keys.push(`experiment:${id}`);
  return actionWrapper(async () => null, ["/dashboard/owner/experiments"], keys);
}

const workflowSchema = z.object({ key: z.string(), name: z.string(), isActive: z.boolean().optional(), steps: z.any().optional() });
export async function workflowDeployAction(id: number | null, input: z.infer<typeof workflowSchema>): Promise<ActionResult> {
  workflowSchema.parse(input);
  const keys = ["owner:workflows"];
  if (id) keys.push(`workflow:${id}`);
  return actionWrapper(async () => null, ["/dashboard/owner/workflows"], keys);
}

const productSchema = z.object({ name: z.string(), price: z.number(), currency: z.string(), active: z.boolean().optional() });
export async function upsertProductAction(id: number | null, input: z.infer<typeof productSchema>): Promise<ActionResult> {
  productSchema.parse(input);
  const keys = ["owner:products"];
  if (id) keys.push(`product:${id}`);
  return actionWrapper(async () => null, ["/dashboard/owner/store"], keys);
}

const subscriptionSchema = z.object({ userId: z.number(), productId: z.number(), status: z.string() });
export async function upsertSubscriptionAction(id: number | null, input: z.infer<typeof subscriptionSchema>): Promise<ActionResult> {
  subscriptionSchema.parse(input);
  const keys = ["owner:subscriptions"];
  if (id) keys.push(`subscription:${id}`);
  return actionWrapper(async () => null, ["/dashboard/owner/store"], keys);
}

const orderSchema = z.object({ userId: z.number(), productId: z.number(), amount: z.number(), status: z.string() });
export async function updateOrderAction(id: number, input: z.infer<typeof orderSchema>): Promise<ActionResult> {
  orderSchema.parse(input);
  return actionWrapper(async () => null, ["/dashboard/owner/store"], ["owner:orders", `order:${id}`]);
}

const webhookSchema = z.object({ url: z.string(), events: z.array(z.string()), status: z.string().optional() });
export async function upsertWebhookAction(id: number | null, input: z.infer<typeof webhookSchema>): Promise<ActionResult> {
  webhookSchema.parse(input);
  const keys = ["owner:webhooks"];
  if (id) keys.push(`webhook:${id}`);
  return actionWrapper(async () => null, ["/dashboard/owner/webhooks"], keys);
}

const settingsSchema = z.object({
  redisUrl: z.string().optional(),
  redisToken: z.string().optional(),
  rateLimit: z.number().optional(),
  bruteForceLimit: z.number().optional(),
});
export async function updateSettingsAction(input: z.infer<typeof settingsSchema>): Promise<ActionResult> {
  settingsSchema.parse(input);
  return actionWrapper(async () => null, ["/dashboard/owner/settings"], ["owner:settings"]);
}

const searchSchema = z.object({ entity: z.string(), query: z.string().optional(), page: z.number().default(1) });
export async function tableSearchAction(input: z.infer<typeof searchSchema>): Promise<ActionResult> {
  searchSchema.parse(input);
  const key = `search:${input.entity}:${input.query ?? ""}:${input.page}`;
  const cached = await redisGet(key);
  if (cached) return { ok: true, data: JSON.parse(cached as string) };
  const data = { rows: [], total: 0, page: input.page, pageSize: 10 };
  await redisSet(key, data, 30);
  return { ok: true, data };
}

const workflowTriggerSchema = z.object({ definitionId: z.number(), payload: z.any() });
export async function triggerWorkflowAction(input: z.infer<typeof workflowTriggerSchema>): Promise<ActionResult> {
  workflowTriggerSchema.parse(input);
  return actionWrapper(async () => null, ["/dashboard/owner/workflows"]);
}

const analyticsSchema = z.object({ scope: z.string().default("system") });
export async function analyticsReprocessAction(input: z.infer<typeof analyticsSchema>): Promise<ActionResult> {
  analyticsSchema.parse(input);
  return actionWrapper(async () => null, ["/dashboard/owner/analytics"], ["owner:analytics"]);
}

const webhookRetrySchema = z.object({ webhookId: z.number(), event: z.string() });
export async function webhookRetryAction(input: z.infer<typeof webhookRetrySchema>): Promise<ActionResult> {
  webhookRetrySchema.parse(input);
  return actionWrapper(async () => null, ["/dashboard/owner/webhooks"], ["owner:webhooks"]);
}

const logStreamSchema = z.object({ cursor: z.number().optional() });
export async function streamLogsAction(input: z.infer<typeof logStreamSchema>): Promise<ActionResult> {
  logStreamSchema.parse(input);
  const logs = Array.from({ length: 20 }).map((_, i) => ({
    id: (input.cursor ?? 0) + i + 1,
    message: `Log ${(input.cursor ?? 0) + i + 1}`,
    createdAt: new Date().toISOString(),
  }));
  return { ok: true, data: { rows: logs, nextCursor: (input.cursor ?? 0) + logs.length } };
}
