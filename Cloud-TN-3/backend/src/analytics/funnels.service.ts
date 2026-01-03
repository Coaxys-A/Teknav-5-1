import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { AuthContextService } from '../auth/auth-context.service';
import { AuditLogService } from '../logging/audit-log.service';
import { DataAccessLogService } from '../logging/data-access-log.service';

/**
 * Analytics Funnels Service
 * 
 * Stores configs in Tenant.configuration.analyticsFunnels
 */

@Injectable()
export class FunnelsService {
  private readonly logger = new Logger(FunnelsService.name);
  private readonly CACHE_TTL_SECONDS = 120; // 2 min

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly authContext: AuthContextService,
    private readonly auditLog: AuditLogService,
    private readonly dataAccessLog: DataAccessLogService,
  ) {}

  /**
   * Create funnel
   */
  async createFunnel(params: {
    key: string;
    name: string;
    steps: any[];
    conversionWindowMinutes: number;
    scope: 'anonymous' | 'user' | 'both';
  }) {
    const tenantId = this.authContext.getTenantId();
    if (!tenantId) {
      throw new ForbiddenException('Tenant ID required');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const config = (typeof tenant.configuration === 'string' ? JSON.parse(tenant.configuration) : tenant.configuration) || {};
    const funnels = config.analyticsFunnels || [];
    
    // Check if key already exists
    if (funnels.some((f: any) => f.key === params.key)) {
      throw new ForbiddenException(`Funnel with key "${params.key}" already exists`);
    }

    funnels.push(params);

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { configuration: { ...config, analyticsFunnels: funnels } },
    });

    // Invalidate cache
    await this.invalidateFunnelCache(tenantId, params.key);

    return { data: { key: params.key, ...params } };
  }

  /**
   * Get all funnels for tenant
   */
  async getFunnels() {
    const tenantId = this.authContext.getTenantId();
    if (!tenantId) {
      throw new ForbiddenException('Tenant ID required');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const config = (typeof tenant.configuration === 'string' ? JSON.parse(tenant.configuration) : tenant.configuration) || {};
    const funnels = config.analyticsFunnels || [];

    return { data: funnels };
  }

  /**
   * Update funnel
   */
  async updateFunnel(key: string, params: any) {
    const tenantId = this.authContext.getTenantId();
    if (!tenantId) {
      throw new ForbiddenException('Tenant ID required');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const config = (typeof tenant.configuration === 'string' ? JSON.parse(tenant.configuration) : tenant.configuration) || {};
    const funnels = config.analyticsFunnels || [];
    const index = funnels.findIndex((f: any) => f.key === key);

    if (index === -1) {
      throw new NotFoundException(`Funnel with key "${key}" not found`);
    }

    funnels[index] = { ...funnels[index], ...params };

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { configuration: { ...config, analyticsFunnels: funnels } },
    });

    // Invalidate cache
    await this.invalidateFunnelCache(tenantId, key);

    return { data: funnels[index] };
  }

  /**
   * Delete funnel
   */
  async deleteFunnel(key: string) {
    const tenantId = this.authContext.getTenantId();
    if (!tenantId) {
      throw new ForbiddenException('Tenant ID required');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const config = (typeof tenant.configuration === 'string' ? JSON.parse(tenant.configuration) : tenant.configuration) || {};
    const funnels = config.analyticsFunnels || [];
    const index = funnels.findIndex((f: any) => f.key === key);

    if (index === -1) {
      throw new NotFoundException(`Funnel with key "${key}" not found`);
    }

    funnels.splice(index, 1);

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { configuration: { ...config, analyticsFunnels: funnels } },
    });

    // Invalidate cache
    await this.invalidateFunnelCache(tenantId, key);

    return { data: { key } };
  }

  /**
   * Get funnel report
   */
  async getFunnelReport(params: {
    key: string;
    from?: string;
    to?: string;
  }) {
    const tenantId = this.authContext.getTenantId();
    const actorId = this.authContext.getUserId();

    // Log sensitive read
    await this.dataAccessLog.logAccess({
      actorUserId: actorId,
      action: 'read_sensitive',
      targetType: 'FunnelReport',
      targetId: 0,
      metadata: { key: params.key },
    });

    if (!tenantId) {
      throw new ForbiddenException('Tenant ID required');
    }

    // Check cache
    const cacheKey = this.getCacheKey(tenantId, params.key, params);
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get funnel config
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const config = (typeof tenant.configuration === 'string' ? JSON.parse(tenant.configuration) : tenant.configuration) || {};
    const funnels = config.analyticsFunnels || [];
    const funnel = funnels.find((f: any) => f.key === params.key);

    if (!funnel) {
      throw new NotFoundException(`Funnel with key "${params.key}" not found`);
    }

    // Query events
    const { from = '', to = '' } = params;
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    const events = await this.prisma.analyticsEvent.findMany({
      where: {
        timestamp: { gte: fromDate, lte: toDate },
        // Filter by scope (user/anonymous) - simplified
      },
      orderBy: { timestamp: 'asc' },
      take: 10000, // Limit batch size
    });

    // Compute funnel steps
    const report = this.computeFunnelStats(events, funnel);

    // Cache report
    await this.redis.set(cacheKey, JSON.stringify(report), this.CACHE_TTL_SECONDS);

    return { data: report, from: fromDate, to: toDate };
  }

  /**
   * Compute funnel stats from events
   */
  private computeFunnelStats(events: any[], funnel: any) {
    const steps = funnel.steps;
    const conversionWindow = funnel.conversionWindowMinutes || 60;
    
    // Group events by identity (userId or anonymousId)
    const identities = new Map<string, any[]>();
    for (const event of events) {
      const identityKey = event.userId ? `user:${event.userId}` : `anon:${event.meta?.anonymousId}`;
      if (!identities.has(identityKey)) {
        identities.set(identityKey, []);
      }
      identities.get(identityKey).push(event);
    }

    const stepCounts = steps.map(() => 0);
    const stepUsers = steps.map(() => new Set<string>());

    for (const [key, identityEvents] of identities.entries()) {
      let currentStepIndex = 0;
      
      for (const event of identityEvents) {
        // Check if event matches current step
        const matchesStep = this.eventMatchesStep(event, steps[currentStepIndex], funnel);
        
        if (matchesStep) {
          if (currentStepIndex < steps.length) {
            stepCounts[currentStepIndex]++;
            stepUsers[currentStepIndex].add(key);
          }
          currentStepIndex++; // Advance to next step
        }
      }
    }

    const totalUsers = identities.size;
    const stepStats = steps.map((step, index) => ({
      stepName: step.name || step.type,
      count: stepCounts[index],
      uniqueUsers: stepUsers[index].size,
      conversionRate: index === 0 ? 100 : ((stepUsers[index].size / totalUsers) * 100).toFixed(1),
      dropOff: index === 0 ? 0 : ((stepUsers[index-1].size - stepUsers[index].size) / stepUsers[index-1].size * 100).toFixed(1),
    }));

    return {
      funnel: funnel,
      totalUsers,
      stepStats,
      conversionRate: ((stepUsers[steps.length-1].size / totalUsers) * 100).toFixed(1),
    };
  }

  /**
   * Check if event matches step
   */
  private eventMatchesStep(event: any, stepIndex: number, funnel: any) {
    const step = funnel.steps[stepIndex];

    switch (step.type) {
      case 'event':
        return event.eventType === step.eventType;
      case 'path':
        return event.path.includes(step.contains);
      case 'search':
        return event.meta?.query && event.meta.query.includes(step.queryContains);
      default:
        return false;
    }
  }

  /**
   * Invalidate funnel cache
   */
  private async invalidateFunnelCache(tenantId: number, key: string) {
    const pattern = this.getCacheKey(tenantId, key, {});
    // In production, use SCAN to delete all matching keys
    await this.redis.del(pattern);
  }

  /**
   * Get cache key
   */
  private getCacheKey(tenantId: number, key: string, params: Record<string, any>): string {
    const hash = JSON.stringify({ tenantId, key, ...params });
    return `analytics:funnel:${hash}`;
  }
}
      totalUsers,
      stepStats,
      conversionRate: ((stepUsers[steps.length-1].size / totalUsers) * 100).toFixed(1),
    };
  }

  /**
   * Check if event matches step
   */
  private eventMatchesStep(event: any, stepIndex: number, funnel: any) {
    const step = funnel.steps[stepIndex];

    switch (step.type) {
      case 'event':
        return event.eventType === step.eventType;
      case 'path':
        return event.path && event.path.includes(step.contains);
      case 'search':
        return event.meta?.query && event.meta.query.includes(step.queryContains);
      default:
        return false;
    }
  }

  /**
   * Invalidate funnel cache
   */
  private async invalidateFunnelCache(tenantId: number, key: string) {
    const pattern = this.getCacheKey(tenantId, key, {});
    // In production, use SCAN to delete all matching keys
    await this.redis.del(pattern);
  }

  /**
   * Get cache key
   */
  private getCacheKey(tenantId: number, key: string, params: Record<string, any>): string {
    const hash = JSON.stringify({ tenantId, key, ...params });
    return `analytics:funnel:${hash}`;
  }
}
