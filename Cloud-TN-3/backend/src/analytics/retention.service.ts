import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { AuthContextService } from '../auth/auth-context.service';
import { DataAccessLogService } from '../logging/data-access-log.service';

/**
 * Analytics Retention Service
 * 
 * Computes basic cohort retention (Day 0 -> N)
 */

@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name);
  private readonly CACHE_TTL_SECONDS = 300; // 5 min
  private readonly MAX_DAYS = 90;
  private readonly MAX_WEEKS = 52;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly authContext: AuthContextService,
    private readonly dataAccessLog: DataAccessLogService,
  ) {}

  /**
   * Get retention report
   */
  async getRetentionReport(params: {
    from?: string;
    to?: string;
    unit?: 'day' | 'week';
    maxPeriods?: number;
  }) {
    const tenantId = this.authContext.getTenantId();
    const actorId = this.authContext.getUserId();
    const { from = '', to = '', unit = 'day', maxPeriods } = params;

    // Log sensitive read
    await this.dataAccessLog.logAccess({
      actorUserId: actorId,
      action: 'read_sensitive',
      targetType: 'RetentionReport',
      targetId: 0,
      metadata: params,
    });

    if (!tenantId) {
      throw new ForbiddenException('Tenant ID required');
    }

    const limit = maxPeriods || (unit === 'day' ? 14 : 12);
    const maxSpan = unit === 'day' ? this.MAX_DAYS : this.MAX_WEEKS;

    // Compute cohorts
    const cohorts = await this.computeCohorts(tenantId, unit, limit, maxSpan, from, to);

    return { data: cohorts, unit, maxPeriods: limit };
  }

  /**
   * Compute cohorts (retention)
   */
  private async computeCohorts(
    tenantId: number,
    unit: 'day' | 'week',
    limit: number,
    maxSpan: number,
    from: string,
    to: string,
  ) {
    const fromDate = from ? new Date(from) : new Date(Date.now() - maxSpan * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    // Get all events for tenant in range
    const events = await this.prisma.analyticsEvent.findMany({
      where: {
        timestamp: { gte: fromDate, lte: toDate },
      },
      orderBy: { timestamp: 'asc' },
      take: 100000, // Limit heavy queries
    });

    // Group identities by their first event bucket (cohort)
    const cohortsMap = new Map<string, Set<string>>();

    // Create buckets
    const buckets: Date[] = [];
    let current = new Date(fromDate);
    while (current <= toDate) {
      buckets.push(new Date(current));
      if (unit === 'day') {
        current.setDate(current.getDate() + 1);
      } else {
        current.setDate(current.getDate() + 7);
      }
    }

    // Identify cohorts (first event per identity)
    const firstEventPerIdentity = new Map<string, Date>();
    const identityEvents = new Map<string, any[]>();

    for (const event of events) {
      const identityKey = event.userId ? `user:${event.userId}` : `anon:${event.meta?.anonymousId}`;
      if (!identityKey) continue;

      // Store events
      if (!identityEvents.has(identityKey)) {
        identityEvents.set(identityKey, []);
      }
      identityEvents.get(identityKey).push(event);

      // Track first event
      if (!firstEventPerIdentity.has(identityKey)) {
        firstEventPerIdentity.set(identityKey, event.timestamp);
      }
    }

    // Assign identities to cohorts (first event bucket)
    for (const [identityKey, firstEvent] of firstEventPerIdentity.entries()) {
      let cohortBucket: Date | null = null;
      
      // Find bucket for first event
      for (const bucket of buckets) {
        const bucketStart = new Date(bucket);
        const bucketEnd = new Date(bucket);
        
        if (unit === 'day') {
          bucketEnd.setDate(bucketEnd.getDate() + 1);
        } else {
          bucketEnd.setDate(bucketEnd.getDate() + 7);
        }

        if (firstEvent >= bucketStart && firstEvent < bucketEnd) {
          cohortBucket = bucketStart;
          break;
        }
      }

      if (cohortBucket) {
        const cohortKey = cohortBucket.toISOString();
        if (!cohortsMap.has(cohortKey)) {
          cohortsMap.set(cohortKey, new Set());
        }
        cohortsMap.get(cohortKey).add(identityKey);
      }
    }

    // Compute retention per cohort
    const cohorts = Array.from(cohortsMap.entries()).map(([cohortKey, identities], index) => {
      const cohortDate = new Date(cohortKey);
      
      // Compute retention for subsequent periods
      const retention = [100]; // p0 = 100%

      for (let i = 1; i <= limit; i++) {
        let nextPeriodStart: Date;
        let nextPeriodEnd: Date;

        if (unit === 'day') {
          nextPeriodStart = new Date(cohortDate);
          nextPeriodStart.setDate(cohortDate.getDate() + i);
          nextPeriodEnd = new Date(nextPeriodStart);
          nextPeriodEnd.setDate(nextPeriodStart.getDate() + 1);
        } else {
          nextPeriodStart = new Date(cohortDate);
          nextPeriodStart.setDate(cohortDate.getDate() + (i * 7));
          nextPeriodEnd = new Date(nextPeriodStart);
          nextPeriodEnd.setDate(nextPeriodStart.getDate() + 7);
        }

        // Count retained identities
        let retained = 0;
        for (const identityKey of identities) {
          const events = identityEvents.get(identityKey) || [];
          const hasEventInPeriod = events.some(e => e.timestamp >= nextPeriodStart && e.timestamp < nextPeriodEnd);
          if (hasEventInPeriod) {
            retained++;
          }
        }

        const retentionRate = (retained / identities.size) * 100;
        retention.push(Math.round(retentionRate));
      }

      return {
        cohortIndex: index,
        cohortDate,
        size: identities.size,
        retention,
      };
    });

    // Sort cohorts by date (desc)
    cohorts.sort((a, b) => b.cohortDate.getTime() - a.cohortDate.getTime());

    return cohorts;
  }

  /**
   * Export retention to CSV
   */
  async exportRetentionToCSV(params: {
    from?: string;
    to?: string;
    unit?: 'day' | 'week';
    maxPeriods?: number;
  }) {
    const report = await this.getRetentionReport(params);
    const rows = report.data.map((c: any) => ({
      Cohort: c.cohortDate.toISOString().split('T')[0],
      Size: c.size,
      Retention: c.retention.join(','),
    }));

    const csv = 'Cohort,Size,Retention\n' + rows.map(r => `${r.Cohort},${r.Size},"${r.Retention}"`).join('\n');

    return { data: csv, contentType: 'text/csv', filename: 'retention.csv' };
  }
}
