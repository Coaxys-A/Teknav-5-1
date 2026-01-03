import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed, Job } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../logging/audit-log.service';
import { DlqService } from '../dlq/dlq.service';
import { QueueMetricsService } from '../metrics/queue-metrics.service';
import { z } from 'zod';

/**
 * Analytics Process Processor
 *
 * Handles processing raw analytics events.
 * Job names:
 * - process-events: Process raw AnalyticsEvent into aggregates
 */

@Processor('analytics:process')
export class AnalyticsProcessProcessor {
  private readonly logger = new Logger(AnalyticsProcessProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly dlq: DlqService,
    private readonly metrics: QueueMetricsService,
  ) {}

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`Job ${job.id} started: ${job.name}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(`Job ${job.id} completed: ${job.name}`);
    this.metrics.publishJobEvent('analytics:process', job.id!, 'completed');
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${job.name}`, error);
    this.metrics.publishJobEvent('analytics:process', job.id!, 'failed', { error: error.message });

    if (job.attemptsMade >= (job.opts.attempts || 5)) {
      this.moveToDLQ(job, error);
    }
  }

  @Process('process-events')
  async handleProcessEvents(job: Job) {
    this.logger.log(`Processing process-events job ${job.id}`);

    const schema = z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      eventTypes: z.array(z.string()).optional(),
    });

    try {
      const data = schema.parse(job.data);

      // 1. Process events into aggregates
      // This involves scanning AnalyticsEvent table (which can be large)
      // For production, this should be done in batches and potentially by a worker
      // For now, we'll do a simple aggregated query per aggregate table

      // 2. Update ArticleStatsDaily
      await this.updateArticleStatsDaily(data.startDate, data.endDate);

      // 3. Update SearchQueryStatsDaily
      await this.updateSearchQueryStatsDaily(data.startDate, data.endDate);

      // 4. Update UserEngagementDaily
      await this.updateUserEngagementDaily(data.startDate, data.endDate);

      // 5. Log Audit
      await this.auditLog.logAction({
        actorUserId: 0, // System job
        action: 'analytics.processed',
        resource: 'AnalyticsAggregate',
        payload: {
          startDate: data.startDate,
          endDate: data.endDate,
        },
      });

      return { processed: true };
    } catch (error) {
      this.logger.error(`Failed to process job ${job.id}:`, error);
      throw error;
    }
  }

  /**
   * Update Article Stats Daily
   */
  private async updateArticleStatsDaily(startDate?: string, endDate?: string) {
    const where: any = {};

    if (startDate) where.gte = new Date(startDate);
    if (endDate) where.lte = new Date(endDate);

    // Get all analytics events related to articles (page views, reads, etc.)
    const articleEvents = await this.prisma.analyticsEvent.findMany({
      where: {
        event: 'article.view', // Example event type
        ...(startDate || endDate ? where : {}),
      },
      select: {
        payload: true,
        timestamp: true,
        userId: true,
      },
      take: 10000, // Safety limit for this batch
    });

    // Aggregate by articleId
    const aggregatedStats = new Map<number, {
      views: number;
      reads: number;
      uniqueUsers: Set<number>;
    }>();

    for (const event of articleEvents) {
      const articleId = (event.payload as any).articleId;
      if (!articleId) continue;

      if (!aggregatedStats.has(articleId)) {
        aggregatedStats.set(articleId, {
          views: 0,
          reads: 0,
          uniqueUsers: new Set(),
        });
      }

      const stats = aggregatedStats.get(articleId)!;
      stats.views++;

      if (event.userId) {
        stats.uniqueUsers.add(event.userId);
        stats.reads++; // Assume read = user view (simple logic)
      }
    }

    // Write to ArticleStatsDaily
    const updates = Array.from(aggregatedStats.entries()).map(([articleId, stats]) => {
      return this.prisma.articleStatsDaily.upsert({
        where: {
          articleId_date: {
            articleId,
            date: new Date().toISOString().split('T')[0], // Today
          },
        },
        create: {
          articleId,
          date: new Date(),
          views: 0,
          reads: 0,
          uniqueUsers: 0,
        },
        update: {
          views: { increment: stats.views },
          reads: { increment: stats.reads },
          uniqueUsers: stats.uniqueUsers.size, // This isn't perfectly incremental, but ok for demo
        },
      });
    });

    await Promise.all(updates);
  }

  /**
   * Update Search Query Stats Daily
   */
  private async updateSearchQueryStatsDaily(startDate?: string, endDate?: string) {
    const where: any = {};

    if (startDate) where.gte = new Date(startDate);
    if (endDate) where.lte = new Date(endDate);

    const searchEvents = await this.prisma.analyticsEvent.findMany({
      where: {
        event: 'search.query',
        ...(startDate || endDate ? where : {}),
      },
      select: {
        payload: true,
      },
      take: 10000,
    });

    const aggregatedStats = new Map<string, { count: number; uniqueUsers: Set<number> }>();

    for (const event of searchEvents) {
      const query = (event.payload as any).query;
      const userId = (event.payload as any).userId; // Assume payload includes user

      if (!query) continue;

      if (!aggregatedStats.has(query)) {
        aggregatedStats.set(query, {
          count: 0,
          uniqueUsers: new Set(),
        });
      }

      const stats = aggregatedStats.get(query)!;
      stats.count++;
      if (userId) stats.uniqueUsers.add(userId);
    }

    const updates = Array.from(aggregatedStats.entries()).map(([query, stats]) => {
      return this.prisma.searchQueryStatsDaily.upsert({
        where: {
          query_date: {
            query,
            date: new Date(),
          },
        },
        create: {
          query,
          date: new Date(),
          count: 0,
          uniqueUsers: 0,
        },
        update: {
          count: { increment: stats.count },
          uniqueUsers: stats.uniqueUsers.size,
        },
      });
    });

    await Promise.all(updates);
  }

  /**
   * Update User Engagement Daily
   */
  private async updateUserEngagementDaily(startDate?: string, endDate?: string) {
    const where: any = {};

    if (startDate) where.gte = new Date(startDate);
    if (endDate) where.lte = new Date(endDate);

    const engagementEvents = await this.prisma.analyticsEvent.findMany({
      where: {
        event: 'user.engagement', // Example event
        ...(startDate || endDate ? where : {}),
      },
      select: {
        payload: true,
        userId: true,
      },
      take: 10000,
    });

    const aggregatedStats = new Map<number, {
      totalTimeMs: number;
      sessionCount: number;
    }>();

    for (const event of engagementEvents) {
      const userId = event.userId;
      const duration = (event.payload as any).duration || 0;

      if (!userId) continue;

      if (!aggregatedStats.has(userId)) {
        aggregatedStats.set(userId, {
          totalTimeMs: 0,
          sessionCount: 0,
        });
      }

      const stats = aggregatedStats.get(userId)!;
      stats.totalTimeMs += duration;
      stats.sessionCount++;
    }

    const updates = Array.from(aggregatedStats.entries()).map(([userId, stats]) => {
      return this.prisma.userEngagementDaily.upsert({
        where: {
          userId_date: {
            userId,
            date: new Date(),
          },
        },
        create: {
          userId,
          date: new Date(),
          totalTimeMs: 0,
          sessionCount: 0,
        },
        update: {
          totalTimeMs: { increment: stats.totalTimeMs },
          sessionCount: { increment: stats.sessionCount },
        },
      });
    });

    await Promise.all(updates);
  }

  /**
   * Move job to DLQ
   */
  private async moveToDLQ(job: Job, error: Error) {
    await this.dlq.getDLQQueue('analytics:process').add(
      'failed-job',
      {
        originalQueue: 'analytics:process',
        originalJobId: job.id!,
        attemptsMade: job.attemptsMade,
        error: error.message,
        stack: error.stack,
        failedAt: new Date(),
        payload: job.data,
        traceId: (job.data as any).traceId,
      },
    );

    await job.remove();
    this.logger.log(`Moved job ${job.id} to DLQ`);
  }
}
