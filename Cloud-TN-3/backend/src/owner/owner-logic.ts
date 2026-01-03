import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Redis as UpstashRedis } from '@upstash/redis';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';

const upstash = new UpstashRedis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

@Injectable()
export class RedisProvider implements OnModuleDestroy {
  public readonly client: Redis;
  constructor() {
    this.client = new Redis(process.env.REDIS_URL || '');
  }
  async onModuleDestroy() {
    await this.client.quit();
  }
}

@Injectable()
export class CacheService {
  constructor(private readonly redis: RedisProvider) {}
  set(key: string, value: any, ttlSeconds?: number) {
    const payload = JSON.stringify(value);
    if (ttlSeconds) return this.redis.client.set(key, payload, 'EX', ttlSeconds);
    return this.redis.client.set(key, payload);
  }
  async get<T>(key: string): Promise<T | null> {
    const res = await this.redis.client.get(key);
    return res ? (JSON.parse(res) as T) : null;
  }
  del(key: string) {
    return this.redis.client.del(key);
  }
}

@Injectable()
export class RateLimitService {
  constructor(private readonly redis: RedisProvider) {}
  async consume(key: string, limit: number, windowSec: number) {
    const now = Date.now();
    const bucket = `${key}:${Math.floor(now / (windowSec * 1000))}`;
    const tx = this.redis.client.multi();
    tx.incr(bucket);
    tx.expire(bucket, windowSec);
    const [count] = await tx.exec();
    return Number(count?.[1] || count?.[0]) <= limit;
  }
}

@Injectable()
export class BruteForceService {
  constructor(private readonly redis: RedisProvider) {}
  async attempt(key: string, max: number, windowSec: number) {
    const bucket = `${key}:bf`;
    const tx = this.redis.client.multi();
    tx.incr(bucket);
    tx.expire(bucket, windowSec);
    const [count] = await tx.exec();
    return Number(count?.[1] || count?.[0]) <= max;
  }
}

@Injectable()
export class SessionCacheService {
  constructor(private readonly cache: CacheService) {}
  setSession(id: string, data: any, ttl: number) {
    return this.cache.set(`session:${id}`, data, ttl);
  }
  getSession<T>(id: string) {
    return this.cache.get<T>(`session:${id}`);
  }
  clearSession(id: string) {
    return this.cache.del(`session:${id}`);
  }
}

@Injectable()
export class FeatureFlagCache {
  constructor(private readonly cache: CacheService) {}
  set(workspaceId: number, key: string, value: any, ttl: number) {
    return this.cache.set(`ff:${workspaceId}:${key}`, value, ttl);
  }
  get<T>(workspaceId: number, key: string) {
    return this.cache.get<T>(`ff:${workspaceId}:${key}`);
  }
}

@Injectable()
export class ExperimentBucketCache {
  constructor(private readonly cache: CacheService) {}
  set(workspaceId: number, experimentKey: string, userId: number, variant: string, ttl: number) {
    return this.cache.set(`exp:${workspaceId}:${experimentKey}:${userId}`, variant, ttl);
  }
  get(workspaceId: number, experimentKey: string, userId: number) {
    return this.cache.get<string>(`exp:${workspaceId}:${experimentKey}:${userId}`);
  }
}

@Injectable()
export class ArticleMetadataCache {
  constructor(private readonly cache: CacheService) {}
  set(articleId: number, meta: any, ttl: number) {
    return this.cache.set(`article:meta:${articleId}`, meta, ttl);
  }
  get<T>(articleId: number) {
    return this.cache.get<T>(`article:meta:${articleId}`);
  }
}

@Injectable()
export class AnalyticsCache {
  constructor(private readonly cache: CacheService) {}
  set(key: string, snapshot: any, ttl: number) {
    return this.cache.set(`analytics:${key}`, snapshot, ttl);
  }
  get<T>(key: string) {
    return this.cache.get<T>(`analytics:${key}`);
  }
}

@Injectable()
export class PluginCache {
  constructor(private readonly cache: CacheService) {}
  set(pluginId: number, data: any, ttl: number) {
    return this.cache.set(`plugin:${pluginId}`, data, ttl);
  }
  get<T>(pluginId: number) {
    return this.cache.get<T>(`plugin:${pluginId}`);
  }
}

@Injectable()
export class AiQueueCache {
  constructor(private readonly cache: CacheService) {}
  setTaskState(taskId: number, state: any, ttl: number) {
    return this.cache.set(`ai:task:${taskId}`, state, ttl);
  }
  getTaskState<T>(taskId: number) {
    return this.cache.get<T>(`ai:task:${taskId}`);
  }
}

@Injectable()
export class PubSubService {
  constructor(private readonly redis: RedisProvider) {}
  publish(channel: string, payload: any) {
    return this.redis.client.publish(channel, JSON.stringify(payload));
  }
  subscribe(channel: string, handler: (message: any) => void) {
    const sub = new Redis(process.env.REDIS_URL || '');
    sub.subscribe(channel);
    sub.on('message', (_ch, msg) => handler(JSON.parse(msg)));
    return sub;
  }
}

type JobPayload = { queue: string; data: any; attempts?: number };

@Injectable()
export class QueueService {
  constructor(private readonly redis: RedisProvider) {}
  enqueue(job: JobPayload) {
    const payload = JSON.stringify({ ...job, attempts: job.attempts ?? 0, ts: Date.now() });
    return this.redis.client.lpush(`queue:${job.queue}`, payload);
  }
  async dequeue(queue: string) {
    const res = await this.redis.client.rpop(`queue:${queue}`);
    return res ? JSON.parse(res) : null;
  }
  async fail(queue: string, job: any) {
    const payload = JSON.stringify(job);
    return this.redis.client.lpush(`queue:${queue}:dlq`, payload);
  }
  async process(queue: string, handler: (job: any) => Promise<void>) {
    const job = await this.dequeue(queue);
    if (!job) return;
    try {
      await handler(job);
    } catch (err) {
      const attempts = (job.attempts || 0) + 1;
      if (attempts < 3) {
        await this.enqueue({ queue, data: job.data, attempts });
      } else {
        await this.fail(queue, job);
      }
    }
  }
}

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService, private readonly cache: CacheService) {}
  create(data: any) {
    return this.prisma.tenant.create({ data });
  }
  list() {
    return this.prisma.tenant.findMany();
  }
  async get(id: number) {
    const cached = await this.cache.get<any>(`tenant:${id}`);
    if (cached) return cached;
    const res = await this.prisma.tenant.findUnique({ where: { id } });
    if (res) await this.cache.set(`tenant:${id}`, res, 300);
    return res;
  }
  update(id: number, data: any) {
    return this.prisma.tenant.update({ where: { id }, data });
  }
  delete(id: number) {
    return this.prisma.tenant.delete({ where: { id } });
  }
}

@Injectable()
export class WorkspaceService {
  constructor(private readonly prisma: PrismaService, private readonly cache: CacheService) {}
  create(data: any) {
    return this.prisma.workspace.create({ data });
  }
  list() {
    return this.prisma.workspace.findMany();
  }
  async get(id: number) {
    const cached = await this.cache.get<any>(`workspace:${id}`);
    if (cached) return cached;
    const res = await this.prisma.workspace.findUnique({ where: { id } });
    if (res) await this.cache.set(`workspace:${id}`, res, 300);
    return res;
  }
  update(id: number, data: any) {
    return this.prisma.workspace.update({ where: { id }, data });
  }
  delete(id: number) {
    return this.prisma.workspace.delete({ where: { id } });
  }
}

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rateLimit: RateLimitService,
    private readonly bruteForce: BruteForceService,
    private readonly sessionCache: SessionCacheService,
  ) {}
  async create(data: any) {
    return this.prisma.user.create({ data });
  }
  list() {
    return this.prisma.user.findMany();
  }
  get(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }
  update(id: number, data: any) {
    return this.prisma.user.update({ where: { id }, data });
  }
  delete(id: number) {
    return this.prisma.user.delete({ where: { id } });
  }
  async loginAttempt(key: string) {
    const pass = await this.bruteForce.attempt(`login:${key}`, 5, 300);
    return pass;
  }
  async rateLimited(key: string) {
    return this.rateLimit.consume(`user:${key}`, Number(process.env.RATE_LIMIT_MAX || 60), Number(process.env.RATE_LIMIT_WINDOW_MS || 60000) / 1000);
  }
  cacheSession(id: string, data: any, ttl: number) {
    return this.sessionCache.setSession(id, data, ttl);
  }
}

@Injectable()
export class ArticleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly articleCache: ArticleMetadataCache,
    private readonly queue: QueueService,
  ) {}
  create(data: any) {
    return this.prisma.article.create({ data });
  }
  list() {
    return this.prisma.article.findMany();
  }
  async get(id: number) {
    const cached = await this.articleCache.get<any>(id);
    if (cached) return cached;
    const res = await this.prisma.article.findUnique({ where: { id }, include: { versions: true } });
    if (res) await this.articleCache.set(id, res, 300);
    return res;
  }
  update(id: number, data: any) {
    return this.prisma.article.update({ where: { id }, data });
  }
  delete(id: number) {
    return this.prisma.article.delete({ where: { id } });
  }
  revalidate(id: number) {
    return this.queue.enqueue({ queue: 'article-revalidate', data: { id } });
  }
}

@Injectable()
export class PluginService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: PluginCache,
  ) {}
  create(data: any) {
    return this.prisma.plugin.create({ data });
  }
  list() {
    return this.prisma.plugin.findMany();
  }
  async get(id: number) {
    const cached = await this.cache.get<any>(id);
    if (cached) return cached;
    const res = await this.prisma.plugin.findUnique({ where: { id }, include: { versions: true } });
    if (res) await this.cache.set(id, res, 300);
    return res;
  }
  update(id: number, data: any) {
    return this.prisma.plugin.update({ where: { id }, data });
  }
  delete(id: number) {
    return this.prisma.plugin.delete({ where: { id } });
  }
}

@Injectable()
export class FeatureFlagService {
  constructor(private readonly prisma: PrismaService, private readonly cache: FeatureFlagCache) {}
  create(data: any) {
    return this.prisma.featureFlag.create({ data });
  }
  list() {
    return this.prisma.featureFlag.findMany();
  }
  async get(id: number) {
    const res = await this.prisma.featureFlag.findUnique({ where: { id } });
    if (res && res.workspaceId) await this.cache.set(res.workspaceId, res.key, res, 300);
    return res;
  }
  update(id: number, data: any) {
    return this.prisma.featureFlag.update({ where: { id }, data });
  }
  delete(id: number) {
    return this.prisma.featureFlag.delete({ where: { id } });
  }
}

@Injectable()
export class ExperimentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bucketCache: ExperimentBucketCache,
  ) {}
  create(data: any) {
    return this.prisma.experiment.create({ data });
  }
  list() {
    return this.prisma.experiment.findMany();
  }
  get(id: number) {
    return this.prisma.experiment.findUnique({ where: { id } });
  }
  update(id: number, data: any) {
    return this.prisma.experiment.update({ where: { id }, data });
  }
  delete(id: number) {
    return this.prisma.experiment.delete({ where: { id } });
  }
  assign(workspaceId: number, key: string, userId: number, variant: string) {
    return this.bucketCache.set(workspaceId, key, userId, variant, 3600);
  }
}

@Injectable()
export class WorkflowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
  ) {}
  createDefinition(data: any) {
    return this.prisma.workflowDefinition.create({ data });
  }
  listDefinitions() {
    return this.prisma.workflowDefinition.findMany();
  }
  getDefinition(id: number) {
    return this.prisma.workflowDefinition.findUnique({ where: { id } });
  }
  updateDefinition(id: number, data: any) {
    return this.prisma.workflowDefinition.update({ where: { id }, data });
  }
  deleteDefinition(id: number) {
    return this.prisma.workflowDefinition.delete({ where: { id } });
  }
  trigger(definitionId: number, context: any) {
    return this.queue.enqueue({ queue: 'workflow', data: { definitionId, context } });
  }
  async executeStep(definitionId: number, stepIndex: number, context: any) {
    await this.queue.enqueue({ queue: 'workflow-step', data: { definitionId, stepIndex, context } });
  }
}

@Injectable()
export class StoreService {
  constructor(private readonly prisma: PrismaService) {}
  createProduct(data: any) {
    return this.prisma.product.create({ data });
  }
  updateProduct(id: number, data: any) {
    return this.prisma.product.update({ where: { id }, data });
  }
  createOrder(data: any) {
    return this.prisma.order.create({ data });
  }
  updateOrder(id: number, data: any) {
    return this.prisma.order.update({ where: { id }, data });
  }
  createSubscription(data: any) {
    return this.prisma.subscription.create({ data });
  }
  updateSubscription(id: number, data: any) {
    return this.prisma.subscription.update({ where: { id }, data });
  }
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService, private readonly cache: AnalyticsCache) {}
  async snapshot(key: string, data: any) {
    await this.cache.set(key, data, 300);
    return data;
  }
  getSnapshot<T>(key: string) {
    return this.cache.get<T>(key);
  }
  events(limit = 100) {
    return this.prisma.analyticsEvent.findMany({ take: limit, orderBy: { createdAt: 'desc' } });
  }
}

@Injectable()
export class LogService {
  constructor(private readonly prisma: PrismaService, private readonly pubsub: PubSubService) {}
  audit(where: any) {
    return this.prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' } });
  }
  publish(channel: string, payload: any) {
    return this.pubsub.publish(channel, payload);
  }
}

@Injectable()
export class AiServiceLogic {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
    private readonly aiCache: AiQueueCache,
    private readonly pubsub: PubSubService,
  ) {}
  createTask(data: any) {
    return this.prisma.aiTask.create({ data });
  }
  scheduleTask(taskId: number) {
    return this.queue.enqueue({ queue: 'ai-task', data: { taskId } });
  }
  async runTask(taskId: number) {
    await this.aiCache.setTaskState(taskId, { status: 'running' }, 3600);
    await this.pubsub.publish('ai:task', { taskId, status: 'running' });
    return this.prisma.aiRun.create({ data: { taskId, status: 'running' } });
  }
  completeRun(runId: number, output: any) {
    return this.prisma.aiRun.update({ where: { id: runId }, data: { status: 'completed', output } });
  }
  logEvent(data: any) {
    return this.prisma.aiEventLog.create({ data });
  }
  saveMemory(data: any) {
    return this.prisma.aiMemory.create({ data });
  }
  saveMessage(data: any) {
    return this.prisma.aiMessage.create({ data });
  }
}

@Injectable()
export class WebhookService {
  constructor(private readonly prisma: PrismaService) {}
  createEndpoint(data: any) {
    return this.prisma.webhookEndpoint.create({ data });
  }
  listEndpoints() {
    return this.prisma.webhookEndpoint.findMany();
  }
  updateEndpoint(id: number, data: any) {
    return this.prisma.webhookEndpoint.update({ where: { id }, data });
  }
  deleteEndpoint(id: number) {
    return this.prisma.webhookEndpoint.delete({ where: { id } });
  }
}

@Injectable()
export class WorkflowsConsumer {
  constructor(private readonly queue: QueueService, private readonly prisma: PrismaService) {}
  async consume() {
    await this.queue.process('workflow', async (job) => {
      const def = await this.prisma.workflowDefinition.findUnique({ where: { id: job.data.definitionId } });
      if (!def) return;
      await this.prisma.workflowInstance.create({ data: { workflowId: def.id, context: job.data.context, status: 'running' } });
    });
    await this.queue.process('workflow-step', async (job) => {
      await this.prisma.workflowStepExecution.create({
        data: {
          instanceId: job.data.definitionId,
          stepKey: String(job.data.stepIndex),
          stepType: 'custom',
          input: job.data.context,
          status: 'completed',
        },
      });
    });
  }
}

@Injectable()
export class AiConsumer {
  constructor(private readonly queue: QueueService, private readonly prisma: PrismaService, private readonly aiCache: AiQueueCache) {}
  async consume() {
    await this.queue.process('ai-task', async (job) => {
      const task = await this.prisma.aiTask.findUnique({ where: { id: job.data.taskId } });
      if (!task) return;
      await this.aiCache.setTaskState(task.id, { status: 'processing' }, 3600);
      await this.prisma.aiRun.create({ data: { taskId: task.id, status: 'running' } });
    });
    await this.queue.process('article-revalidate', async (job) => {
      await this.aiCache.setTaskState(job.data.id, { status: 'revalidating' }, 300);
    });
  }
}

@Injectable()
export class OwnerLogicModule {}
