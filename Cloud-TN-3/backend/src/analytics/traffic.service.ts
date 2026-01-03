import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { AuthContextService } from '../auth/auth-context.service';
import { DataAccessLogService } from '../logging/data-access-log.service';

/**
 * Analytics Traffic Service
 * 
 * Breakdown by referrers, devices, UTM
 */

@Injectable()
export class TrafficService {
  private readonly logger = new Logger(TrafficService.name);
  private readonly CACHE_TTL_SECONDS = 120; // 2 min

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly authContext: AuthContextService,
    private readonly dataAccessLog: DataAccessLogService,
  ) {}

  /**
   * Get referrers breakdown
   */
  async getReferrers(params: {
    from?: string;
    to?: string;
    limit?: number;
  }) {
    const actorId = this.authContext.getUserId();
    const tenantId = this.authContext.getTenantId();

    // Log sensitive read
    await this.dataAccessLog.logAccess({
      actorUserId: actorId,
      action: 'read_sensitive',
      targetType: 'TrafficReferrers',
      targetId: 0,
      metadata: params,
    });

    if (!tenantId) {
      throw new ForbiddenException('Tenant ID required');
    }

    const { from, to, limit = 20 } = params;
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    const cacheKey = this.getCacheKey('referrers', { tenantId, from, to, limit });
    
    return await this.redis.cacheWrap(
      cacheKey,
      this.CACHE_TTL_SECONDS,
      async () => {
        const events = await this.prisma.analyticsEvent.findMany({
          where: {
            timestamp: { gte: fromDate, lte: toDate },
            meta: {
              path: ['referrer'],
              not: null,
            },
          },
          orderBy: { timestamp: 'desc' },
          take: 10000, // Limit batch size
        });

        // Aggregate by referrer
        const referrerCounts = new Map<string, number>();
        for (const event of events) {
          const referrer = event.meta?.referrer || 'Direct';
          referrerCounts.set(referrer, (referrerCounts.get(referrer) || 0) + 1);
        }

        const referrers = Array.from(referrerCounts.entries())
          .map(([referrer, count]) => ({ referrer, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, limit);

        return { data: referrers, from: fromDate, to: toDate };
      },
    );
  }

  /**
   * Get devices breakdown
   */
  async getDevices(params: {
    from?: string;
    to?: string;
  }) {
    const actorId = this.authContext.getUserId();
    const tenantId = this.authContext.getTenantId();

    // Log sensitive read
    await this.dataAccessLog.logAccess({
      actorUserId: actorId,
      action: 'read_sensitive',
      targetType: 'TrafficDevices',
      targetId: 0,
      metadata: params,
    });

    if (!tenantId) {
      throw new ForbiddenException('Tenant ID required');
    }

    const { from, to } = params;
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    const cacheKey = this.getCacheKey('devices', { tenantId, from, to });
    
    return await this.redis.cacheWrap(
      cacheKey,
      this.CACHE_TTL_SECONDS,
      async () => {
        const events = await this.prisma.analyticsEvent.findMany({
          where: {
            timestamp: { gte: fromDate, lte: toDate },
            meta: {
              path: ['deviceType'],
              not: null,
            },
          },
          orderBy: { timestamp: 'desc' },
          take: 10000,
        });

        // Aggregate by device type
        const deviceCounts = new Map<string, number>();
        for (const event of events) {
          const device = event.meta?.deviceType || 'Unknown';
          deviceCounts.set(device, (deviceCounts.get(device) || 0) + 1);
        }

        const devices = Array.from(deviceCounts.entries())
          .map(([device, count]) => ({ device, count }))
          .sort((a, b) => b.count - a.count);

        return { data: devices, from: fromDate, to: toDate };
      },
    );
  }

  /**
   * Get UTM breakdown
   */
  async getUtm(params: {
    from?: string;
    to?: string;
    limit?: number;
  }) {
    const actorId = this.authContext.getUserId();
    const tenantId = this.authContext.getTenantId();

    // Log sensitive read
    await this.dataAccessLog.logAccess({
      actorUserId: actorId,
      action: 'read_sensitive',
      targetType: 'TrafficUTM',
      targetId: 0,
      metadata: params,
    });

    if (!tenantId) {
      throw new ForbiddenException('Tenant ID required');
    }

    const { from, to, limit = 20 } = params;
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    const cacheKey = this.getCacheKey('utm', { tenantId, from, to, limit });
    
    return await this.redis.cacheWrap(
      cacheKey,
      this.CACHE_TTL_SECONDS,
      async () => {
        const events = await this.prisma.analyticsEvent.findMany({
          where: {
            timestamp: { gte: fromDate, lte: toDate },
            meta: {
              path: ['utm'],
              not: null,
            },
          },
          orderBy: { timestamp: 'desc' },
          take: 10000,
        });

        // Aggregate by UTM source/medium/campaign
        const utmCounts = new Map<string, number>();
        for (const event of events) {
          const utm = event.meta?.utm;
          if (!utm || !utm.source) continue;

          const key = `${utm.source} / ${utm.medium || 'N/A'} / ${utm.campaign || 'N/A'}`;
          utmCounts.set(key, (utmCounts.get(key) || 0) + 1);
        }

        const utms = Array.from(utmCounts.entries())
          .map(([utm, count]) => ({ utm, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, limit);

        return { data: utms, from: fromDate, to: toDate };
      },
    );
  }

  /**
   * Get cache key
   */
  private getCacheKey(type: string, params: Record<string, any>): string {
    const hash = JSON.stringify(params);
    return `analytics:traffic:${type}:${hash}`;
  }
}
