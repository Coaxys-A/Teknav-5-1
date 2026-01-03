import { Processor, ProcessError, Logger } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { Job } from 'bullmq';

/**
 * Analytics Aggregation Job Consumer
 * 
 * Queue: analytics
 * Job Types:
 * - aggregate_daily_stats
 */

@Injectable()
export class AnalyticsAggregationConsumer {
  private readonly logger = new Logger(AnalyticsAggregationConsumer.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Processor('aggregate_daily_stats')
  async handleAggregateDailyStats(job: Job) {
    this.logger.debug(`Processing aggregate_daily_stats job ${job.id}`);
    
    try {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Get last aggregation checkpoint from Redis
      const checkpointKey = 'analytics:checkpoint:daily';
      const lastAggregationAt = await this.redis.get(checkpointKey);

      // Query raw analytics events since last checkpoint
      const events = await this.prisma.analyticsEvent.findMany({
        where: {
          createdAt: lastAggregationAt
            ? { gte: new Date(lastAggregationAt) }
            : undefined,
        },
        orderBy: { createdAt: 'asc' },
        take: 10000, // Limit batch size
      });

      // Update checkpoint
      await this.redis.set(checkpointKey, now.toISOString(), 60 * 60 * 24); // 24 hours TTL

      // Compute daily aggregates (simple counts)
      const viewsCount = events.filter(e => e.eventType === 'page_view' || e.eventType === 'article_view').length;
      const articleViewsCount = events.filter(e => e.eventType === 'article_view').length;
      const clicksCount = events.filter(e => e.eventType === 'click').length;
      const searchesCount = events.filter(e => e.eventType === 'search').length;
      const dashboardViewsCount = events.filter(e => e.eventType === 'dashboard_view').length;
      const uniqueUsersCount = new Set(events.map(e => e.userId).filter(Boolean)).size;

      // Update AnalyticsAggregate (hour bucket)
      await this.prisma.analyticsAggregate.upsert({
        where: {
          bucket: new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), 0, 0, 0),
          period: 'hour',
        },
        update: {
          count: { increment: viewsCount + clicksCount + searchesCount },
          meta: { events: events.length },
        },
        create: {
          bucket: new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), 0, 0, 0),
          period: 'hour',
          count: viewsCount + clicksCount + searchesCount,
          meta: { events: events.length },
        },
      });

      // Update ArticleStatsDaily (date bucket)
      const articleIdCounts = new Map<number, number>();
      events.filter(e => e.eventType === 'article_view').forEach(e => {
        if (e.articleId) {
          articleIdCounts.set(e.articleId, (articleIdCounts.get(e.articleId) || 0) + 1);
        }
      });

      const articleStats = Array.from(articleIdCounts.entries()).map(([articleId, count]) => ({
        articleId,
        date: new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0),
        views: count,
      }));

      // Upsert article stats (simplified - use existing table if exists)
      // Note: ArticleStatsDaily table was assumed to exist in schema
      // If not, skip this part
      await this.prisma.articleStatsDaily.createMany({
        data: articleStats,
        skipDuplicates: true,
      });

      // Update SearchQueryStatsDaily (date bucket)
      const searchQueryCounts = new Map<string, number>();
      events.filter(e => e.eventType === 'search').forEach(e => {
        const query = e.meta?.query || 'unknown';
        searchQueryCounts.set(query, (searchQueryCounts.get(query) || 0) + 1);
      });

      const searchStats = Array.from(searchQueryCounts.entries()).map(([query, count]) => ({
        query,
        date: new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0),
        count,
      }));

      // Upsert search stats
      await this.prisma.searchQueryStatsDaily.createMany({
        data: searchStats,
        skipDuplicates: true,
      });

      // Update UserEngagementDaily (date bucket)
      const userEngagementCounts = new Map<number, number>();
      events.filter(e => e.eventType === 'article_view' || e.eventType === 'dashboard_view').forEach(e => {
        if (e.userId) {
          userEngagementCounts.set(e.userId, (userEngagementCounts.get(e.userId) || 0) + 1);
        }
      });

      const userEngagementStats = Array.from(userEngagementCounts.entries()).map(([userId, engagement]) => ({
        userId,
        date: new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0),
        engagement,
      }));

      // Upsert user engagement stats
      await this.prisma.userEngagementDaily.createMany({
        data: userEngagementStats,
        skipDuplicates: true,
      });

      this.logger.debug(`Aggregated daily stats: ${events.length} events processed`);

      return {
        views: viewsCount,
        articleViews: articleViewsCount,
        clicks: clicksCount,
        searches: searchesCount,
        dashboardViews: dashboardViewsCount,
        uniqueUsers: uniqueUsersCount,
      };

    } catch (error: any) {
      this.logger.error(`Failed to aggregate daily stats:`, error.message);
      throw new ProcessError(error.message, error.stack);
    }
  }
}
