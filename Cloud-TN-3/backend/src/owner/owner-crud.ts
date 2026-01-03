// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { z } from 'zod';

export class CreateTenantDto {
  slug!: string;
  legalName!: string;
  displayName!: string;
  primaryDomain!: string;
  defaultLocale!: string;
  supportedLocales!: string[];
  plan!: string;
}

export class UpdateTenantDto {
  slug?: string;
  legalName?: string;
  displayName?: string;
  primaryDomain?: string;
  defaultLocale?: string;
  supportedLocales?: string[];
  plan?: string;
  limits?: Record<string, unknown>;
  configuration?: Record<string, unknown>;
  extraDomains?: unknown;
}

export const tenantSchema = z.object({
  slug: z.string(),
  legalName: z.string(),
  displayName: z.string(),
  primaryDomain: z.string(),
  defaultLocale: z.string(),
  supportedLocales: z.array(z.string()),
  plan: z.string(),
  limits: z.record(z.unknown()).optional(),
  configuration: z.record(z.unknown()).optional(),
  extraDomains: z.unknown().optional(),
});

@Injectable()
export class TenantCrudService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateTenantDto) {
    tenantSchema.parse(data);
    return this.prisma.tenant.create({ data });
  }

  findMany() {
    return this.prisma.tenant.findMany();
  }

  findById(id: number) {
    return this.prisma.tenant.findUnique({ where: { id } });
  }

  update(id: number, data: UpdateTenantDto) {
    tenantSchema.partial().parse(data);
    return this.prisma.tenant.update({ where: { id }, data: data as any });
  }

  delete(id: number) {
    return this.prisma.tenant.delete({ where: { id } });
  }
}

export class CreateWorkspaceDto {
  name!: string;
  slug!: string;
  tenantId?: number;
  description?: string;
  logo?: string;
  primaryLocale?: string;
  plan?: string;
  entitlements?: Record<string, unknown>;
}

export class UpdateWorkspaceDto {
  name?: string;
  slug?: string;
  tenantId?: number;
  description?: string;
  logo?: string;
  primaryLocale?: string;
  plan?: string;
  entitlements?: Record<string, unknown>;
}

export const workspaceSchema = z.object({
  name: z.string(),
  slug: z.string(),
  tenantId: z.number().optional(),
  description: z.string().optional(),
  logo: z.string().optional(),
  primaryLocale: z.string().optional(),
  plan: z.string().optional(),
  entitlements: z.record(z.unknown()).optional(),
});

@Injectable()
export class WorkspaceCrudService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateWorkspaceDto) {
    workspaceSchema.parse(data);
    return this.prisma.workspace.create({ data: data as any });
  }

  findMany() {
    return this.prisma.workspace.findMany();
  }

  findById(id: number) {
    return this.prisma.workspace.findUnique({ where: { id } });
  }

  update(id: number, data: UpdateWorkspaceDto) {
    workspaceSchema.partial().parse(data);
    return this.prisma.workspace.update({ where: { id }, data: data as any });
  }

  delete(id: number) {
    return this.prisma.workspace.delete({ where: { id } });
  }
}

export class CreateUserDto {
  email!: string;
  password!: string;
  role?: string;
  name?: string;
  phone?: string;
  status?: string;
}

export class UpdateUserDto {
  email?: string;
  password?: string;
  role?: string;
  name?: string;
  phone?: string;
  status?: string;
  reputation?: number;
}

export const userSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  role: z.string().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  status: z.string().optional(),
  reputation: z.number().optional(),
});

@Injectable()
export class UserCrudService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateUserDto) {
    userSchema.parse(data);
    return this.prisma.user.create({ data: data as any });
  }

  findMany() {
    return this.prisma.user.findMany();
  }

  findById(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  update(id: number, data: UpdateUserDto) {
    userSchema.partial().parse(data);
    return this.prisma.user.update({ where: { id }, data: data as any });
  }

  delete(id: number) {
    return this.prisma.user.delete({ where: { id } });
  }
}

export class CreateArticleDto {
  title!: string;
  slug!: string;
  content!: string;
  status?: string;
  categoryId?: number;
  authorId?: number;
  workspaceId?: number;
}

export class UpdateArticleDto {
  title?: string;
  slug?: string;
  content?: string;
  status?: string;
  categoryId?: number;
  authorId?: number;
  workspaceId?: number;
  reviewStatus?: string;
}

export const articleSchema = z.object({
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  status: z.string().optional(),
  categoryId: z.number().optional(),
  authorId: z.number().optional(),
  workspaceId: z.number().optional(),
  reviewStatus: z.string().optional(),
});

@Injectable()
export class ArticleCrudService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateArticleDto) {
    articleSchema.parse(data);
    return this.prisma.article.create({ data: data as any });
  }

  findMany() {
    return this.prisma.article.findMany();
  }

  findById(id: number) {
    return this.prisma.article.findUnique({ where: { id } });
  }

  update(id: number, data: UpdateArticleDto) {
    articleSchema.partial().parse(data);
    return this.prisma.article.update({ where: { id }, data: data as any });
  }

  delete(id: number) {
    return this.prisma.article.delete({ where: { id } });
  }
}

export class CreatePluginDto {
  name!: string;
  slug!: string;
  tenantId?: number;
  workspaceId?: number;
  manifest?: Record<string, unknown>;
}

export class UpdatePluginDto {
  name?: string;
  slug?: string;
  tenantId?: number;
  workspaceId?: number;
  manifest?: Record<string, unknown>;
}

export const pluginSchema = z.object({
  name: z.string(),
  slug: z.string(),
  tenantId: z.number().optional(),
  workspaceId: z.number().optional(),
  manifest: z.record(z.unknown()).optional(),
});

@Injectable()
export class PluginCrudService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreatePluginDto) {
    pluginSchema.parse(data);
    return this.prisma.plugin.create({ data: data as any });
  }

  findMany() {
    return this.prisma.plugin.findMany();
  }

  findById(id: number) {
    return this.prisma.plugin.findUnique({ where: { id } });
  }

  update(id: number, data: UpdatePluginDto) {
    pluginSchema.partial().parse(data);
    return this.prisma.plugin.update({ where: { id }, data: data as any });
  }

  delete(id: number) {
    return this.prisma.plugin.delete({ where: { id } });
  }
}

export class CreateAiModelConfigDto {
  name!: string;
  provider!: string;
  model!: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stopSequences?: string[];
  metadata?: Record<string, unknown>;
  workspaceId?: number;
  tenantId?: number;
}

export class UpdateAiModelConfigDto {
  name?: string;
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stopSequences?: string[];
  metadata?: Record<string, unknown>;
  workspaceId?: number;
  tenantId?: number;
}

export const aiModelConfigSchema = z.object({
  name: z.string(),
  provider: z.string(),
  model: z.string(),
  temperature: z.number().optional(),
  maxTokens: z.number().optional(),
  topP: z.number().optional(),
  stopSequences: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
  workspaceId: z.number().optional(),
  tenantId: z.number().optional(),
});

@Injectable()
export class AiModelConfigCrudService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateAiModelConfigDto) {
    aiModelConfigSchema.parse(data);
    return this.prisma.aiModelConfig.create({ data: data as any });
  }

  findMany() {
    return this.prisma.aiModelConfig.findMany();
  }

  findById(id: number) {
    return this.prisma.aiModelConfig.findUnique({ where: { id } });
  }

  update(id: number, data: UpdateAiModelConfigDto) {
    aiModelConfigSchema.partial().parse(data);
    return this.prisma.aiModelConfig.update({ where: { id }, data: data as any });
  }

  delete(id: number) {
    return this.prisma.aiModelConfig.delete({ where: { id } });
  }
}

export class CreateAiAgentDto {
  name!: string;
  kind?: string;
  description?: string;
  modelConfigId?: number;
  workspaceId?: number;
  tenantId?: number;
  systemPrompt?: string;
  enabled?: boolean;
  version?: string;
}

export class UpdateAiAgentDto {
  name?: string;
  kind?: string;
  description?: string;
  modelConfigId?: number;
  workspaceId?: number;
  tenantId?: number;
  systemPrompt?: string;
  enabled?: boolean;
  version?: string;
}

export const aiAgentSchema = z.object({
  name: z.string(),
  kind: z.string().optional(),
  description: z.string().optional(),
  modelConfigId: z.number().optional(),
  workspaceId: z.number().optional(),
  tenantId: z.number().optional(),
  systemPrompt: z.string().optional(),
  enabled: z.boolean().optional(),
  version: z.string().optional(),
});

@Injectable()
export class AiAgentCrudService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateAiAgentDto) {
    aiAgentSchema.parse(data);
    return this.prisma.aiAgent.create({ data: data as any });
  }

  findMany() {
    return this.prisma.aiAgent.findMany();
  }

  findById(id: number) {
    return this.prisma.aiAgent.findUnique({ where: { id } });
  }

  update(id: number, data: UpdateAiAgentDto) {
    aiAgentSchema.partial().parse(data);
    return this.prisma.aiAgent.update({ where: { id }, data: data as any });
  }

  delete(id: number) {
    return this.prisma.aiAgent.delete({ where: { id } });
  }
}

export class CreateFeatureFlagDto {
  key!: string;
  defaultVariant!: string;
  description?: string;
  type?: string;
  variants?: Record<string, unknown>;
  targetingRules?: Record<string, unknown>;
  rolloutStrategy?: string;
  configuration?: Record<string, unknown>;
  workspaceId?: number;
}

export class UpdateFeatureFlagDto {
  key?: string;
  defaultVariant?: string;
  description?: string;
  type?: string;
  variants?: Record<string, unknown>;
  targetingRules?: Record<string, unknown>;
  rolloutStrategy?: string;
  configuration?: Record<string, unknown>;
  workspaceId?: number;
  isActive?: boolean;
}

export const featureFlagSchema = z.object({
  key: z.string(),
  defaultVariant: z.string(),
  description: z.string().optional(),
  type: z.string().optional(),
  variants: z.record(z.unknown()).optional(),
  targetingRules: z.record(z.unknown()).optional(),
  rolloutStrategy: z.string().optional(),
  configuration: z.record(z.unknown()).optional(),
  workspaceId: z.number().optional(),
  isActive: z.boolean().optional(),
});

@Injectable()
export class FeatureFlagCrudService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateFeatureFlagDto) {
    featureFlagSchema.parse(data);
    return this.prisma.featureFlag.create({ data: data as any });
  }

  findMany() {
    return this.prisma.featureFlag.findMany();
  }

  findById(id: number) {
    return this.prisma.featureFlag.findUnique({ where: { id } });
  }

  update(id: number, data: UpdateFeatureFlagDto) {
    featureFlagSchema.partial().parse(data);
    return this.prisma.featureFlag.update({ where: { id }, data: data as any });
  }

  delete(id: number) {
    return this.prisma.featureFlag.delete({ where: { id } });
  }
}

export class CreateExperimentDto {
  key!: string;
  name!: string;
  description?: string;
  variants?: Record<string, unknown>;
  targetingRules?: Record<string, unknown>;
  status?: string;
  workspaceId?: number;
}

export class UpdateExperimentDto {
  key?: string;
  name?: string;
  description?: string;
  variants?: Record<string, unknown>;
  targetingRules?: Record<string, unknown>;
  status?: string;
  workspaceId?: number;
}

export const experimentSchema = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string().optional(),
  variants: z.record(z.unknown()).optional(),
  targetingRules: z.record(z.unknown()).optional(),
  status: z.string().optional(),
  workspaceId: z.number().optional(),
});

@Injectable()
export class ExperimentCrudService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateExperimentDto) {
    experimentSchema.parse(data);
    return this.prisma.experiment.create({ data: data as any });
  }

  findMany() {
    return this.prisma.experiment.findMany();
  }

  findById(id: number) {
    return this.prisma.experiment.findUnique({ where: { id } });
  }

  update(id: number, data: UpdateExperimentDto) {
    experimentSchema.partial().parse(data);
    return this.prisma.experiment.update({ where: { id }, data: data as any });
  }

  delete(id: number) {
    return this.prisma.experiment.delete({ where: { id } });
  }
}

export class CreateWorkflowDefinitionDto {
  key!: string;
  name!: string;
  description?: string;
  triggers!: Record<string, unknown>;
  steps!: Record<string, unknown>;
  workspaceId?: number;
  tenantId?: number;
}

export class UpdateWorkflowDefinitionDto {
  key?: string;
  name?: string;
  description?: string;
  triggers?: Record<string, unknown>;
  steps?: Record<string, unknown>;
  workspaceId?: number;
  tenantId?: number;
  isActive?: boolean;
}

export const workflowDefinitionSchema = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string().optional(),
  triggers: z.record(z.unknown()),
  steps: z.record(z.unknown()),
  workspaceId: z.number().optional(),
  tenantId: z.number().optional(),
  isActive: z.boolean().optional(),
});

@Injectable()
export class WorkflowDefinitionCrudService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateWorkflowDefinitionDto) {
    workflowDefinitionSchema.parse(data);
    return this.prisma.workflowDefinition.create({ data: data as any });
  }

  findMany() {
    return this.prisma.workflowDefinition.findMany();
  }

  findById(id: number) {
    return this.prisma.workflowDefinition.findUnique({ where: { id } });
  }

  update(id: number, data: UpdateWorkflowDefinitionDto) {
    workflowDefinitionSchema.partial().parse(data);
    return this.prisma.workflowDefinition.update({ where: { id }, data: data as any });
  }

  delete(id: number) {
    return this.prisma.workflowDefinition.delete({ where: { id } });
  }
}

export class CreateProductDto {
  name!: string;
  slug!: string;
  price!: number;
  currency?: string;
  productType?: string;
  interval?: string;
  workspaceId?: number;
  tenantId?: number;
}

export class UpdateProductDto {
  name?: string;
  slug?: string;
  price?: number;
  currency?: string;
  productType?: string;
  interval?: string;
  workspaceId?: number;
  tenantId?: number;
  active?: boolean;
}

export const productSchema = z.object({
  name: z.string(),
  slug: z.string(),
  price: z.number(),
  currency: z.string().optional(),
  productType: z.string().optional(),
  interval: z.string().optional(),
  workspaceId: z.number().optional(),
  tenantId: z.number().optional(),
  active: z.boolean().optional(),
});

@Injectable()
export class ProductCrudService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateProductDto) {
    productSchema.parse(data);
    return this.prisma.product.create({ data });
  }

  findMany() {
    return this.prisma.product.findMany();
  }

  findById(id: number) {
    return this.prisma.product.findUnique({ where: { id } });
  }

  update(id: number, data: UpdateProductDto) {
    productSchema.partial().parse(data);
    return this.prisma.product.update({ where: { id }, data });
  }

  delete(id: number) {
    return this.prisma.product.delete({ where: { id } });
  }
}

export class CreateSubscriptionDto {
  userId!: number;
  productId!: number;
  status?: string;
  workspaceId?: number;
  tenantId?: number;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: Date;
}

export class UpdateSubscriptionDto {
  userId?: number;
  productId?: number;
  status?: string;
  workspaceId?: number;
  tenantId?: number;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: Date;
}

export const subscriptionSchema = z.object({
  userId: z.number(),
  productId: z.number(),
  status: z.string().optional(),
  workspaceId: z.number().optional(),
  tenantId: z.number().optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
  currentPeriodEnd: z.date().optional(),
});

@Injectable()
export class SubscriptionCrudService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateSubscriptionDto) {
    subscriptionSchema.parse(data);
    return this.prisma.subscription.create({ data });
  }

  findMany() {
    return this.prisma.subscription.findMany();
  }

  findById(id: number) {
    return this.prisma.subscription.findUnique({ where: { id } });
  }

  update(id: number, data: UpdateSubscriptionDto) {
    subscriptionSchema.partial().parse(data);
    return this.prisma.subscription.update({ where: { id }, data });
  }

  delete(id: number) {
    return this.prisma.subscription.delete({ where: { id } });
  }
}

export class CreateOrderDto {
  productId!: number;
  amount!: number;
  currency?: string;
  userId?: number;
  status?: string;
  workspaceId?: number;
  tenantId?: number;
}

export class UpdateOrderDto {
  productId?: number;
  amount?: number;
  currency?: string;
  userId?: number;
  status?: string;
  workspaceId?: number;
  tenantId?: number;
}

export const orderSchema = z.object({
  productId: z.number(),
  amount: z.number(),
  currency: z.string().optional(),
  userId: z.number().optional(),
  status: z.string().optional(),
  workspaceId: z.number().optional(),
  tenantId: z.number().optional(),
});

@Injectable()
export class OrderCrudService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateOrderDto) {
    orderSchema.parse(data);
    return this.prisma.order.create({ data });
  }

  findMany() {
    return this.prisma.order.findMany();
  }

  findById(id: number) {
    return this.prisma.order.findUnique({ where: { id } });
  }

  update(id: number, data: UpdateOrderDto) {
    orderSchema.partial().parse(data);
    return this.prisma.order.update({ where: { id }, data });
  }

  delete(id: number) {
    return this.prisma.order.delete({ where: { id } });
  }
}

export class CreateWebhookEndpointDto {
  workspaceId!: number;
  url!: string;
  events?: string[];
  secret?: string | null;
  status?: string;
}

export class UpdateWebhookEndpointDto {
  workspaceId?: number;
  url?: string;
  events?: string[];
  secret?: string | null;
  status?: string;
}

export const webhookEndpointSchema = z.object({
  workspaceId: z.number(),
  url: z.string(),
  events: z.array(z.string()).optional(),
  secret: z.string().nullable().optional(),
  status: z.string().optional(),
});

@Injectable()
export class WebhookEndpointCrudService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateWebhookEndpointDto) {
    webhookEndpointSchema.parse(data);
    return this.prisma.webhookEndpoint.create({ data });
  }

  findMany() {
    return this.prisma.webhookEndpoint.findMany();
  }

  findById(id: number) {
    return this.prisma.webhookEndpoint.findUnique({ where: { id } });
  }

  update(id: number, data: UpdateWebhookEndpointDto) {
    webhookEndpointSchema.partial().parse(data);
    return this.prisma.webhookEndpoint.update({ where: { id }, data });
  }

  delete(id: number) {
    return this.prisma.webhookEndpoint.delete({ where: { id } });
  }
}
