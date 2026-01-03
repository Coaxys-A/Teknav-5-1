import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

type LogType = 'audit' | 'ai' | 'workflow' | 'plugin' | 'data_access' | 'user_event' | 'admin_action' | 'error';

@Injectable()
export class LoggingService {
  private readonly logger = new Logger(LoggingService.name);

  constructor(private readonly prisma: PrismaService, private readonly redis: RedisService) {}

  async logAdminAction(action: string, userId?: number, path?: string, method?: string, metadata?: any) {
    try {
      await this.prisma.auditLog.create({
        data: {
          action,
          resource: 'admin_action',
          payload: { path, method, metadata },
          actorId: userId ?? null,
        },
      });
      await this.pushRedisTrail('audit', { action, userId, path, method, ts: Date.now() });
    } catch (error) {
      this.logger.error('Failed to log admin action', error as Error);
    }
  }

  async logDataAccess(action: string, userId?: number, targetType?: string, targetId?: number, metadata?: any) {
    try {
      await this.prisma.dataAccessLog.create({
        data: {
          action,
          userId: userId ?? null,
          actorUserId: userId ?? null,
          targetType: targetType ?? null,
          targetId: targetId ?? null,
          metadata: metadata ?? null,
        },
      });
      await this.pushRedisTrail('data_access', { action, userId, targetType, targetId, ts: Date.now() });
    } catch (error) {
      this.logger.error('Failed to log data access', error as Error);
    }
  }

  async logError(context: string, error: any, userId?: number) {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: 'error',
          resource: context,
          payload: {
            message: error?.message ?? 'unknown_error',
            stack: error?.stack,
          },
          actorId: userId ?? null,
        },
      });
      await this.pushRedisTrail('error', { context, userId, ts: Date.now() });
    } catch (e) {
      this.logger.error('Failed to persist error log', e as Error);
    }
  }

  async logSensitive(action: string, meta: { userId?: number; ip?: string; geo?: string; userAgent?: string }) {
    await this.pushRedisTrail('sensitive', { action, ...meta, ts: Date.now() });
  }

  async logSession(event: string, userId: number | null, sessionId: string | null, meta?: any) {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: event,
          resource: 'session',
          payload: { sessionId, meta },
          actorId: userId,
        },
      });
      await this.pushRedisTrail('session', { event, userId, sessionId, ts: Date.now() });
    } catch (e) {
      this.logger.error('Failed to log session', e as Error);
    }
  }

  async logPlugin(pluginId: number, status: string, message?: string) {
    await this.pushRedisTrail('plugin', { pluginId, status, message, ts: Date.now() });
  }

  async logWorkflow(instanceId: number, stepKey: string, status: string, message?: string) {
    await this.pushRedisTrail('workflow', { instanceId, stepKey, status, message, ts: Date.now() });
  }

  async logAi(taskId: number, status: string, message?: string) {
    await this.pushRedisTrail('ai', { taskId, status, message, ts: Date.now() });
  }

  async logRoleChange(actorId: number | null, targetUserId: number, role: string) {
    await this.prisma.auditLog.create({
      data: {
        action: 'role_change',
        resource: 'rbac',
        payload: { targetUserId, role },
        actorId,
      },
    });
    await this.pushRedisTrail('audit', { action: 'role_change', actorId, targetUserId, role, ts: Date.now() });
  }

  async logPublish(actorId: number | null, articleId: number | null, workspaceId?: number | null) {
    await this.prisma.auditLog.create({
      data: {
        action: 'publish',
        resource: 'articles',
        payload: { articleId, workspaceId },
        actorId,
      },
    });
    await this.pushRedisTrail('audit', { action: 'publish', actorId, articleId, workspaceId, ts: Date.now() });
  }

  async logWorkflowOp(actorId: number | null, workflowId: number, op: string) {
    await this.prisma.auditLog.create({
      data: {
        action: op,
        resource: 'workflows',
        payload: { workflowId },
        actorId,
      },
    });
    await this.pushRedisTrail('workflow', { action: op, workflowId, actorId, ts: Date.now() });
  }

  async logAiUsage(actorId: number | null, agentId: number | null, taskId: number | null) {
    await this.prisma.auditLog.create({
      data: {
        action: 'ai_usage',
        resource: 'ai',
        payload: { agentId, taskId },
        actorId,
      },
    });
    await this.pushRedisTrail('ai', { action: 'ai_usage', agentId, taskId, actorId, ts: Date.now() });
  }

  async logLogin(actorId: number | null, ip?: string, geo?: string, sessionId?: string) {
    await this.prisma.auditLog.create({
      data: {
        action: 'login',
        resource: 'auth',
        payload: { ip, geo, sessionId },
        actorId,
      },
    });
    await this.pushRedisTrail('session', { action: 'login', actorId, ip, geo, sessionId, ts: Date.now() });
  }

  private async pushRedisTrail(channel: string, payload: any) {
    try {
      const client = this.redis.getClient();
      if (!client) return;
      const key = `logs:${channel}:trail`;
      const record = { ...payload, checksum: this.checksum(JSON.stringify(payload)) };
      await (client as any).lpush(key, JSON.stringify(record));
      await (client as any).ltrim(key, 0, 999);
    } catch (err) {
      this.logger.warn(`Redis trail push failed ${channel}: ${err}`);
    }
  }

  private checksum(input: string) {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  async latest(type: LogType, limit = 50) {
    switch (type) {
      case 'audit':
      case 'admin_action':
      case 'error':
        return this.prisma.auditLog.findMany({
          where: type === 'admin_action' ? { resource: 'admin_action' } : type === 'error' ? { action: 'error' } : undefined,
          orderBy: { createdAt: 'desc' },
          take: limit,
          include: { actor: true },
        });
      case 'ai':
        return this.prisma.aiEventLog.findMany({ orderBy: { createdAt: 'desc' }, take: limit });
      case 'workflow':
        return this.prisma.workflowStepExecution.findMany({
          orderBy: { startedAt: 'desc' },
          take: limit,
          include: { instance: true },
        });
      case 'plugin':
        return this.prisma.pluginExecutionLog.findMany({ orderBy: { createdAt: 'desc' }, take: limit });
      case 'data_access':
        return this.prisma.dataAccessLog.findMany({ orderBy: { timestamp: 'desc' }, take: limit });
      case 'user_event':
        return this.prisma.userEvent.findMany({ orderBy: { timestamp: 'desc' }, take: limit });
      default:
        return [];
    }
  }

  async aggregates() {
    const cacheKey = 'logs:aggregates:24h';
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [audit, ai, workflow, plugin, dataAccess, userEvent] = await Promise.all([
      this.prisma.auditLog.count({ where: { createdAt: { gte: since } } }),
      this.prisma.aiEventLog.count({ where: { createdAt: { gte: since } } }),
      this.prisma.workflowStepExecution.count({ where: { startedAt: { gte: since } } }),
      this.prisma.pluginExecutionLog.count({ where: { createdAt: { gte: since } } }),
      this.prisma.dataAccessLog.count({ where: { timestamp: { gte: since } } }),
      this.prisma.userEvent.count({ where: { timestamp: { gte: since } } }),
    ]);
    const payload = { since, audit, ai, workflow, plugin, dataAccess, userEvent };
    await this.redis.set(cacheKey, payload, 60);
    return payload;
  }
}
