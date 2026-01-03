import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES, getDLQName } from '../queue.config';
import { RedisService } from '../../redis/redis.service';
import { AuditLogService } from '../../logging/audit-log.service';

/**
 * Queue Metrics Service
 *
 * Handles:
 * - Live metrics snapshot in Redis (every 10s)
 * - Periodic aggregates to DB (every 5 mins)
 * - Event publishing for UI (Redis pub/sub)
 */

@Injectable()
export class QueueMetricsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueMetricsService.name);
  private readonly STATS_INTERVAL = 10000; // 10s
  private readonly AGGREGATE_INTERVAL = 300000; // 5 mins
  private readonly STATS_TTL = 30; // 30s
  private statsInterval: NodeJS.Timeout;
  private aggregateInterval: NodeJS.Timeout;

  constructor(
    @InjectQueue('ai:content') private aiContentQueue: Queue,
    @InjectQueue('ai:seo') private aiSeoQueue: Queue,
    @InjectQueue('ai:review') private aiReviewQueue: Queue,
    @InjectQueue('workflows:run') private workflowsQueue: Queue,
    @InjectQueue('plugins:execute') private pluginsQueue: Queue,
    @InjectQueue('analytics:process') private analyticsProcessQueue: Queue,
    @InjectQueue('analytics:snapshot') private analyticsSnapshotQueue: Queue,
    @InjectQueue('email:send') private emailQueue: Queue,
    @InjectQueue('otp:send') private otpQueue: Queue,
    @InjectQueue('webhooks:deliver') private webhooksQueue: Queue,
    @InjectQueue('media:optimize') private mediaQueue: Queue,
    @InjectQueue('search:index') private searchQueue: Queue,
    private readonly redis: RedisService,
    private readonly auditLog: AuditLogService,
  ) {}

  async onModuleInit() {
    // Start stats snapshot interval
    this.statsInterval = setInterval(() => {
      this.snapshotStats();
    }, this.STATS_INTERVAL);

    // Start aggregate interval
    this.aggregateInterval = setInterval(() => {
      this.aggregateMetrics();
    }, this.AGGREGATE_INTERVAL);

    this.logger.log('QueueMetricsService initialized');
  }

  async onModuleDestroy() {
    if (this.statsInterval) clearInterval(this.statsInterval);
    if (this.aggregateInterval) clearInterval(this.aggregateInterval);
  }

  // ==========================================================================
  // STATS SNAPSHOT (REDIS)
  // ==========================================================================

  /**
   * Snapshot stats for all queues into Redis
   * Writes keys: teknav:queue:<name>:stats
   */
  private async snapshotStats() {
    const queues = {
      'ai:content': this.aiContentQueue,
      'ai:seo': this.aiSeoQueue,
      'ai:review': this.aiReviewQueue,
      'workflows:run': this.workflowsQueue,
      'plugins:execute': this.pluginsQueue,
      'analytics:process': this.analyticsProcessQueue,
      'analytics:snapshot': this.analyticsSnapshotQueue,
      'email:send': this.emailQueue,
      'otp:send': this.otpQueue,
      'webhooks:deliver': this.webhooksQueue,
      'media:optimize': this.mediaQueue,
      'search:index': this.searchQueue,
    };

    for (const [name, queue] of Object.entries(queues)) {
      try {
        const counts = await queue.getJobCounts();
        const workers = await queue.getWorkers();

        // Calculate avg/p95 duration from completed jobs (sample)
        // For simplicity, we'll just set 0 for now
        const avgDurationMs = 0;
        const p95DurationMs = 0;

        const stats = {
          waiting: counts.waiting,
          active: counts.active,
          completed: counts.completed,
          failed: counts.failed,
          delayed: counts.delayed,
          paused: queue.isPaused(),
          workers: workers.length,
          rate: counts.completed / (this.STATS_INTERVAL / 1000), // jobs/sec
          avgDurationMs,
          p95DurationMs,
          lastUpdatedAt: new Date(),
        };

        // Write to Redis
        await this.redis.set(
          `teknav:queue:${name}:stats`,
          JSON.stringify(stats),
          this.STATS_TTL,
        );

        // Publish event for UI
        await this.redis.publish(
          'teknav:owner:queue:events',
          JSON.stringify({
            type: 'queue.stats',
            queueName: name,
            stats,
            timestamp: new Date(),
          }),
        );
      } catch (error) {
        this.logger.error(`Failed to snapshot stats for queue ${name}:`, error);
      }
    }
  }

  // ==========================================================================
  // AGGREGATE METRICS (DB)
  // ==========================================================================

  /**
   * Persist periodic aggregates to DB
   * Writes to AuditLog with action="queue.metrics"
   */
  private async aggregateMetrics() {
    const queues = [
      'ai:content',
      'ai:seo',
      'ai:review',
      'workflows:run',
      'plugins:execute',
      'analytics:process',
      'analytics:snapshot',
      'email:send',
      'otp:send',
      'webhooks:deliver',
      'media:optimize',
      'search:index',
    ];

    for (const queueName of queues) {
      try {
        const statsKey = `teknav:queue:${queueName}:stats`;
        const statsStr = await this.redis.get(statsKey);

        if (!statsStr) {
          continue;
        }

        const stats = JSON.parse(statsStr);

        // Log to AuditLog
        await this.auditLog.logAction({
          action: 'queue.metrics',
          resource: queueName,
          payload: {
            stats,
            aggregateAt: new Date(),
          },
        });

        // Optionally, write to AnalyticsAggregate
        // For now, we'll just use AuditLog
      } catch (error) {
        this.logger.error(`Failed to aggregate metrics for queue ${queueName}:`, error);
      }
    }
  }

  // ==========================================================================
  // EVENT PUBLISHING
  // ==========================================================================

  /**
   * Publish job event
   */
  async publishJobEvent(
    queueName: string,
    jobId: string,
    eventType: 'completed' | 'failed' | 'stalled',
    data?: any,
  ): Promise<void> {
    const event = {
      type: `job.${eventType}`,
      queueName,
      jobId,
      data,
      timestamp: new Date(),
    };

    await this.redis.publish(
      'teknav:owner:queue:events',
      JSON.stringify(event),
    );
  }

  /**
   * Publish DLQ event
   */
  async publishDlqEvent(
    queueName: string,
    jobId: string,
    data?: any,
  ): Promise<void> {
    const event = {
      type: 'dlq.added',
      queueName,
      jobId,
      data,
      timestamp: new Date(),
    };

    await this.redis.publish(
      'teknav:owner:queue:events',
      JSON.stringify(event),
    );
  }

  /**
   * Publish queue event (pause/resume)
   */
  async publishQueueEvent(
    queueName: string,
    eventType: 'paused' | 'resumed',
  ): Promise<void> {
    const event = {
      type: `queue.${eventType}`,
      queueName,
      timestamp: new Date(),
    };

    await this.redis.publish(
      'teknav:owner:queue:events',
      JSON.stringify(event),
    );
  }
}
