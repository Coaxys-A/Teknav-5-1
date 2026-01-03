import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Redis Snapshot Cache Helper
 * 
 * Provides fast reads for aggregated analytics data
 */

@Injectable()
export class RedisSnapshotCacheService {
  private readonly logger = new Logger(RedisSnapshotCacheService.name);
  private readonly CACHE_TTL_SECONDS = 120; // 2 min

  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get overview stats (cached)
   */
  async getOverviewStats(from?: Date, to?: Date) {
    const cacheKey = this.getCacheKey('overview', { from, to });
    
    return await this.redis.cacheWrap(
      cacheKey,
      this.CACHE_TTL_SECONDS,
      async () => {
        // Query DB for real data (fallback)
        const articleViews = await this.prisma.articleStatsDaily.aggregate({
          _sum: { views: true },
          where: {
            date: { gte: new Date(from.getFullYear(), from.getUTCMonth(), from.getUTCDate(), 0, 0, 0), lte: to },
          },
        });

        const totalViews = await this.prisma.analyticsAggregate.sum({
          where: {
            bucket: { gte: new Date(from.getFullYear(), from.getUTCMonth(), from.getUTCDate(), 0, 0, 0), lte: to },
          },
          count: true,
        });

        const totalSearches = await this.prisma.searchQueryStatsDaily.sum({
          where: {
            date: { gte: new Date(from.getFullYear(), from.getUTCMonth(), from.getUTCDate(), 0, 0, 0), lte: to },
          },
          count: true,
        });

        const totalClicks = await this.prisma.analyticsEvent.findMany({
          where: {
            eventType: 'click',
            timestamp: { gte: from, lte: to },
          },
        });

        const totalDashboardViews = await this.prisma.analyticsEvent.findMany({
          where: {
            eventType: 'dashboard_view',
            timestamp: { gte: from, lte: to },
          },
        });

        return {
          totalViews: totalViews || 0,
          articleViews: articleViews._sum?.views || 0,
          totalSearches: totalSearches || 0,
          totalClicks: totalClicks.length,
          totalDashboardViews: totalDashboardViews.length,
          from,
          to,
        };
      },
    );
  }

  /**
   * Invalidate all analytics caches
   */
  async invalidateCaches() {
    this.logger.debug('Invalidating all analytics caches');
    
    // Delete cache keys by pattern (if Redis supports SCAN)
    // For now, we rely on TTL
  }

  /**
   * Get cache key
   */
  private getCacheKey(type: string, params: Record<string, any>): string {
    const hash = JSON.stringify(params);
    return `analytics:snapshot:${type}:${hash}`;
  }
}
