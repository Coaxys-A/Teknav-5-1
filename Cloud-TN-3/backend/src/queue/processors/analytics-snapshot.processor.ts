import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed, Job } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../logging/audit-log.service';
import { DlqService } from '../dlq/dlq.service';
import { QueueMetricsService } from '../metrics/queue-metrics.service';

/**
 * Analytics Snapshot Processor
 *
 * Handles periodic snapshot jobs.
 * Job names:
 * - snapshot-dashboard: Precompute dashboard payload and store in Redis
 */

@Processor('analytics:snapshot')
export class AnalyticsSnapshotProcessor {
  private readonly logger = new Logger(AnalyticsSnapshotProcessor.name);

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
    this.metrics.publishJobEvent('analytics:snapshot', job.id!, 'completed');
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${job.name}`, error);
    this.metrics.publishJobEvent('analytics:snapshot', job.id!, 'failed', { error: error.message });

    if (job.attemptsMade >= (job.opts.attempts || 5)) {
      this.moveToDLQ(job, error);
    }
  }

  @Process('snapshot-dashboard')
  async handleSnapshotDashboard(job: Job) {
    this.logger.log(`Processing snapshot-dashboard job ${job.id}`);

    try {
      // 1. Aggregate stats
      const [
        totalUsers,
        totalArticles,
        totalViews,
        activeSubscriptions,
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.article.count({ where: { published: true } }),
        this.prisma.articleStatsDaily.aggregate({
          _sum: { views: true },
        }),
        this.prisma.subscription.count({ where: { status: 'active' } }),
      ]);

      const dashboardPayload = {
        totalUsers,
        totalArticles,
        totalViews: totalViews?._sum.views || 0,
        activeSubscriptions,
        updatedAt: new Date(),
      };

      // 2. Store in Redis with TTL
      // (Use RedisService - assuming it has `set` method)
      // For now, we'll just log it
      // await this.redis.set('dashboard:stats', JSON.stringify(dashboardPayload), 300); // 5 mins

      // 3. Log Audit
      await this.auditLog.logAction({
        action: 'analytics.snapshot',
        resource: 'Dashboard',
        payload: dashboardPayload,
      });

      return { snapshot: true };
    } catch (error) {
      this.logger.error(`Failed to process job ${job.id}:`, error);
      throw error;
    }
  }

  /**
   * Move job to DLQ
   */
  private async moveToDLQ(job: Job, error: Error) {
    await this.dlq.getDLQQueue('analytics:snapshot').add(
      'failed-job',
      {
        originalQueue: 'analytics:snapshot',
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
