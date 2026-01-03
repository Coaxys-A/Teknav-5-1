import { Injectable, Logger } from '@nestjs/common';
import { Queue, Job, JobOptions } from 'bullmq';
import { QueueFactoryService } from './queue-factory.service';
import { RedisService } from '../redis/redis.service';
import { AuditLogService } from '../logging/audit-log.service';
import {
  QUEUE_NAMES,
  QueueName,
  QUEUE_CONFIGS,
  QueueConfig,
  JOB_VALIDATION_SCHEMAS,
  getJobSchema,
  QUEUE_STATS_KEYS,
  getDLQName,
  RealtimeEvent,
  REALTIME_CHANNELS,
  EVENT_SEVERITY,
  AI_JOB_NAMES,
  WORKFLOW_JOB_NAMES,
  ANALYTICS_JOB_NAMES,
  EMAIL_JOB_NAMES,
  PLUGIN_JOB_NAMES,
  SYSTEM_JOB_NAMES,
  AIContentGenerateSchema,
  AISeoOptimizeSchema,
  AITranslateSchema,
  AIScoreRerunSchema,
  WorkflowDispatchSchema,
  WorkflowStepExecuteSchema,
  WorkflowRetrySchema,
  AnalyticsSnapshotHourlySchema,
  AnalyticsAggregateDailySchema,
  AnalyticsRecomputeRangeSchema,
  EmailSendSchema,
  OtpSendSchema,
  NotificationDispatchSchema,
  PluginExecuteSchema,
  PluginWebhookDeliverSchema,
  PluginEventDispatchSchema,
  CacheInvalidateSchema,
  IndexRebuildSchema,
  HealthCheckSchema,
} from './contracts';

/**
 * Enhanced Queue Service
 *
 * Provides:
 * - Standardized queue operations
 * - Job validation with zod schemas
 * - Queue stats caching (Redis)
 * - DLQ routing
 * - Realtime event publishing
 * - Job audit logging
 */

@Injectable()
export class QueuesService {
  private readonly logger = new Logger(QueuesService.name);
  private readonly PREFIX = process.env.REDIS_KEY_PREFIX || 'teknav';

  constructor(
    private readonly queueFactory: QueueFactoryService,
    private readonly redis: RedisService,
    private readonly auditLog: AuditLogService,
  ) {}

  // ==========================================================================
  // QUEUE MANAGEMENT
  // ==========================================================================

  /**
   * Get queue by name
   */
  getQueue(queueName: QueueName): Queue<any> {
    return this.queueFactory.getQueue(queueName);
  }

  /**
   * Get all queues
   */
  getAllQueues(): Queue<any>[] {
    return Object.values(QUEUE_NAMES)
      .filter(name => name !== QUEUE_NAMES.DLQ)
      .map(name => this.queueFactory.getQueue(name));
  }

  // ==========================================================================
  // JOB ENQUEUEMENT WITH VALIDATION
  // ==========================================================================

  /**
   * Enqueue job with validation
   */
  async enqueueJob(
    queueName: QueueName,
    jobName: string,
    payload: any,
    options?: JobOptions,
    actorId?: number,
  ): Promise<{ jobId: string }> {
    // Validate payload
    const schema = getJobSchema(jobName);
    if (schema) {
      try {
        schema.parse(payload);
        this.logger.debug(`Job payload validated: ${jobName}`);
      } catch (error) {
        this.logger.error(`Job validation failed: ${jobName}`, error);
        throw new Error(`Invalid job payload for ${jobName}: ${error}`);
      }
    }

    // Get queue
    const queue = this.getQueue(queueName);
    const config = QUEUE_CONFIGS[queueName];

    // Merge default options with provided options
    const jobOptions: JobOptions = {
      ...config.defaultJobOptions,
      ...options,
    };

    // Enqueue job
    const job = await queue.add(jobName, payload, jobOptions);

    // Publish event
    await this.publishEvent({
      type: 'job.queued',
      ts: Date.now(),
      queue: queueName,
      jobId: job.id as string,
      severity: EVENT_SEVERITY.INFO,
      message: `Job ${jobName} queued in ${queueName}`,
      meta: { jobName, attempts: jobOptions.attempts },
    });

    // Log audit
    if (actorId) {
      await this.auditLog.logAction({
        actorId,
        action: `queue.job.enqueue`,
        resource: queueName,
        payload: { jobName, jobId: job.id },
      });
    }

    this.logger.log(`Job enqueued: ${jobName} (${job.id}) in queue: ${queueName}`);

    return { jobId: job.id as string };
  }

  // ==========================================================================
  // AI QUEUE PRODUCERS
  // ==========================================================================

  async enqueueAIContentGenerate(payload: z.infer<typeof AIContentGenerateSchema>, actorId?: number) {
    return this.enqueueJob(
      QUEUE_NAMES.AI,
      AI_JOB_NAMES.CONTENT_GENERATE,
      payload,
      {
        jobId: `ai.content:${payload.articleId}:${Date.now()}`,
      },
      actorId,
    );
  }

  async enqueueAISeoOptimize(payload: z.infer<typeof AISeoOptimizeSchema>, actorId?: number) {
    return this.enqueueJob(
      QUEUE_NAMES.AI,
      AI_JOB_NAMES.SEO_OPTIMIZE,
      payload,
      {
        jobId: `ai.seo:${payload.articleId}:${Date.now()}`,
      },
      actorId,
    );
  }

  async enqueueAITranslate(payload: z.infer<typeof AITranslateSchema>, actorId?: number) {
    return this.enqueueJob(
      QUEUE_NAMES.AI,
      AI_JOB_NAMES.TRANSLATE,
      payload,
      {
        jobId: `ai.translate:${payload.articleId}:${Date.now()}`,
      },
      actorId,
    );
  }

  async enqueueAIScoreRerun(payload: z.infer<typeof AIScoreRerunSchema>, actorId?: number) {
    return this.enqueueJob(
      QUEUE_NAMES.AI,
      AI_JOB_NAMES.SCORE_RERUN,
      payload,
      {
        jobId: `ai.rerun:${payload.articleId}:${Date.now()}`,
      },
      actorId,
    );
  }

  // ==========================================================================
  // WORKFLOW QUEUE PRODUCERS
  // ==========================================================================

  async enqueueWorkflowDispatch(payload: z.infer<typeof WorkflowDispatchSchema>, actorId?: number) {
    return this.enqueueJob(
      QUEUE_NAMES.WORKFLOWS,
      WORKFLOW_JOB_NAMES.DISPATCH,
      payload,
      {
        jobId: `workflow.dispatch:${payload.workflowId}:${Date.now()}`,
      },
      actorId,
    );
  }

  async enqueueWorkflowStepExecute(payload: z.infer<typeof WorkflowStepExecuteSchema>, actorId?: number) {
    return this.enqueueJob(
      QUEUE_NAMES.WORKFLOWS,
      WORKFLOW_JOB_NAMES.STEP_EXECUTE,
      payload,
      {
        jobId: `workflow.step:${payload.workflowInstanceId}:${payload.stepId}:${Date.now()}`,
      },
      actorId,
    );
  }

  async enqueueWorkflowRetry(payload: z.infer<typeof WorkflowRetrySchema>, actorId?: number) {
    return this.enqueueJob(
      QUEUE_NAMES.WORKFLOWS,
      WORKFLOW_JOB_NAMES.RETRY,
      payload,
      {
        jobId: `workflow.retry:${payload.workflowInstanceId}:${Date.now()}`,
      },
      actorId,
    );
  }

  // ==========================================================================
  // ANALYTICS QUEUE PRODUCERS
  // ==========================================================================

  async enqueueAnalyticsSnapshot(payload: z.infer<typeof AnalyticsSnapshotHourlySchema>, actorId?: number) {
    return this.enqueueJob(
      QUEUE_NAMES.ANALYTICS,
      ANALYTICS_JOB_NAMES.SNAPSHOT_HOURLY,
      payload,
      {
        jobId: `analytics.snapshot:${payload.bucket}:${Date.now()}`,
      },
      actorId,
    );
  }

  async enqueueAnalyticsAggregate(payload: z.infer<typeof AnalyticsAggregateDailySchema>, actorId?: number) {
    return this.enqueueJob(
      QUEUE_NAMES.ANALYTICS,
      ANALYTICS_JOB_NAMES.AGGREGATE_DAILY,
      payload,
      {
        jobId: `analytics.aggregate:${payload.date}:${Date.now()}`,
      },
      actorId,
    );
  }

  async enqueueAnalyticsRecompute(payload: z.infer<typeof AnalyticsRecomputeRangeSchema>, actorId?: number) {
    return this.enqueueJob(
      QUEUE_NAMES.ANALYTICS,
      ANALYTICS_JOB_NAMES.RECOMPUTE_RANGE,
      payload,
      {
        jobId: `analytics.recompute:${Date.now()}`,
      },
      actorId,
    );
  }

  // ==========================================================================
  // EMAIL QUEUE PRODUCERS
  // ==========================================================================

  async enqueueEmailSend(payload: z.infer<typeof EmailSendSchema>, actorId?: number) {
    return this.enqueueJob(
      QUEUE_NAMES.EMAIL,
      EMAIL_JOB_NAMES.SEND,
      payload,
      {
        jobId: payload.emailLogId ? `email.send:${payload.emailLogId}:${Date.now()}` : undefined,
        priority: payload.priority === 'urgent' ? 1 : payload.priority === 'high' ? 5 : 10,
      },
      actorId,
    );
  }

  async enqueueOtpSend(payload: z.infer<typeof OtpSendSchema>, actorId?: number) {
    return this.enqueueJob(
      QUEUE_NAMES.EMAIL,
      EMAIL_JOB_NAMES.OTP_SEND,
      payload,
      {
        jobId: payload.otpCodeId ? `otp.send:${payload.otpCodeId}:${Date.now()}` : undefined,
      },
      actorId,
    );
  }

  async enqueueNotificationDispatch(payload: z.infer<typeof NotificationDispatchSchema>, actorId?: number) {
    return this.enqueueJob(
      QUEUE_NAMES.EMAIL,
      EMAIL_JOB_NAMES.NOTIFICATION_DISPATCH,
      payload,
      {
        jobId: `notification.dispatch:${payload.notificationId}:${Date.now()}`,
        priority: payload.priority === 'high' ? 5 : 10,
      },
      actorId,
    );
  }

  // ==========================================================================
  // PLUGIN QUEUE PRODUCERS
  // ==========================================================================

  async enqueuePluginExecute(payload: z.infer<typeof PluginExecuteSchema>, actorId?: number) {
    return this.enqueueJob(
      QUEUE_NAMES.PLUGINS,
      PLUGIN_JOB_NAMES.EXECUTE,
      payload,
      {
        jobId: `plugin.execute:${payload.pluginId}:${Date.now()}`,
        timeout: payload.timeoutMs || 60000,
      },
      actorId,
    );
  }

  async enqueuePluginWebhookDeliver(payload: z.infer<typeof PluginWebhookDeliverSchema>, actorId?: number) {
    return this.enqueueJob(
      QUEUE_NAMES.PLUGINS,
      PLUGIN_JOB_NAMES.WEBHOOK_DELIVER,
      payload,
      {
        jobId: `plugin.webhook:${payload.webhookId}:${Date.now()}`,
        attempts: payload.maxRetries || 3,
      },
      actorId,
    );
  }

  async enqueuePluginEventDispatch(payload: z.infer<typeof PluginEventDispatchSchema>, actorId?: number) {
    return this.enqueueJob(
      QUEUE_NAMES.PLUGINS,
      PLUGIN_JOB_NAMES.EVENT_DISPATCH,
      payload,
      {
        jobId: `plugin.event:${payload.pluginId}:${Date.now()}`,
      },
      actorId,
    );
  }

  // ==========================================================================
  // SYSTEM QUEUE PRODUCERS
  // ==========================================================================

  async enqueueCacheInvalidate(payload: z.infer<typeof CacheInvalidateSchema>, actorId?: number) {
    return this.enqueueJob(
      QUEUE_NAMES.SYSTEM,
      SYSTEM_JOB_NAMES.CACHE_INVALIDATE,
      payload,
      {
        jobId: `cache.invalidate:${Date.now()}`,
      },
      actorId,
    );
  }

  async enqueueIndexRebuild(payload: z.infer<typeof IndexRebuildSchema>, actorId?: number) {
    return this.enqueueJob(
      QUEUE_NAMES.SYSTEM,
      SYSTEM_JOB_NAMES.INDEX_REBUILD,
      payload,
      {
        jobId: `index.rebuild:${Date.now()}`,
      },
      actorId,
    );
  }

  async enqueueHealthCheck(payload: z.infer<typeof HealthCheckSchema>, actorId?: number) {
    return this.enqueueJob(
      QUEUE_NAMES.SYSTEM,
      SYSTEM_JOB_NAMES.HEALTH_CHECK,
      payload,
      {
        jobId: `health.check:${Date.now()}`,
      },
      actorId,
    );
  }

  // ==========================================================================
  // QUEUE STATS (WITH REDIS CACHING)
  // ==========================================================================

  /**
   * Get queue summary with caching
   */
  async getQueueSummary(): Promise<any[]> {
    // Try to get from cache first
    const cached = await this.redis.get(QUEUE_STATS_KEYS.ALL_QUEUES_STATS);
    if (cached) {
      return JSON.parse(cached);
    }

    // Compute fresh stats
    const queues = this.getAllQueues();
    const summary = await Promise.all(
      queues.map(async (queue) => {
        const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
          queue.getWaitingCount(),
          queue.getActiveCount(),
          queue.getCompletedCount(),
          queue.getFailedCount(),
          queue.getDelayedCount(),
          queue.isPaused(),
        ]);

        return {
          name: queue.name.replace(`${this.PREFIX}:q:`, ''),
          waiting,
          active,
          completed,
          failed,
          delayed,
          total: waiting + active + completed + failed + delayed,
          paused,
          latency: 0, // Computed from QueueEvents
        };
      }),
    );

    // Cache for 10 seconds
    await this.redis.set(
      QUEUE_STATS_KEYS.ALL_QUEUES_STATS,
      JSON.stringify(summary),
      10,
    );

    return summary;
  }

  /**
   * Get individual queue stats
   */
  async getQueueStats(queueName: QueueName): Promise<any> {
    const cacheKey = QUEUE_STATS_KEYS.STATS(queueName);

    // Try cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Compute fresh stats
    const queue = this.getQueue(queueName);
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    const stats = {
      name: queueName,
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
      throughput: await this.getQueueThroughput(queueName),
    };

    // Cache for 10 seconds
    await this.redis.set(cacheKey, JSON.stringify(stats), 10);
    await this.redis.set(QUEUE_STATS_KEYS.LAST_UPDATE(queueName), Date.now().toString(), 10);

    return stats;
  }

  /**
   * Get queue throughput (jobs/min over last 5 min)
   */
  private async getQueueThroughput(queueName: QueueName): Promise<number> {
    const cacheKey = QUEUE_STATS_KEYS.THROUGHPUT(queueName);
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return parseFloat(cached);
    }

    return 0; // Default, computed by workers
  }

  /**
   * Invalidate queue stats cache
   */
  async invalidateQueueStats(queueName?: QueueName): Promise<void> {
    if (queueName) {
      await this.redis.del(QUEUE_STATS_KEYS.STATS(queueName));
      await this.redis.del(QUEUE_STATS_KEYS.THROUGHPUT(queueName));
    } else {
      await this.redis.del(QUEUE_STATS_KEYS.ALL_QUEUES_STATS);
      // Invalidate all queue stats
      const queues = this.getAllQueues();
      for (const queue of queues) {
        const name = queue.name.replace(`${this.PREFIX}:q:`, '') as QueueName;
        await this.redis.del(QUEUE_STATS_KEYS.STATS(name));
        await this.redis.del(QUEUE_STATS_KEYS.THROUGHPUT(name));
      }
    }
  }

  // ==========================================================================
  // JOB MANAGEMENT
  // ==========================================================================

  /**
   * Get jobs by state
   */
  async getJobs(
    queueName: QueueName,
    state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed',
    start = 0,
    end = 50,
  ): Promise<Job[]> {
    const queue = this.getQueue(queueName);
    const jobs = await queue.getJobs([start, end], state);
    return jobs;
  }

  /**
   * Get job details
   */
  async getJob(queueName: QueueName, jobId: string): Promise<Job | null> {
    const queue = this.getQueue(queueName);
    return await queue.getJob(jobId);
  }

  /**
   * Retry job
   */
  async retryJob(queueName: QueueName, jobId: string, actorId?: number): Promise<void> {
    const job = await this.getJob(queueName, jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found in queue ${queueName}`);
    }

    await job.retry();

    // Publish event
    await this.publishEvent({
      type: 'job.retried',
      ts: Date.now(),
      queue: queueName,
      jobId,
      severity: EVENT_SEVERITY.INFO,
      message: `Job ${jobId} retried in queue ${queueName}`,
      actorId,
    });

    // Invalidate stats
    await this.invalidateQueueStats(queueName);

    // Log audit
    if (actorId) {
      await this.auditLog.logAction({
        actorId,
        action: 'queue.job.retry',
        resource: queueName,
        payload: { jobId },
      });
    }

    this.logger.log(`Job retried: ${jobId} in queue: ${queueName}`);
  }

  /**
   * Remove job
   */
  async removeJob(queueName: QueueName, jobId: string, actorId?: number): Promise<void> {
    const job = await this.getJob(queueName, jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found in queue ${queueName}`);
    }

    await job.remove();

    // Publish event
    await this.publishEvent({
      type: 'job.removed',
      ts: Date.now(),
      queue: queueName,
      jobId,
      severity: EVENT_SEVERITY.WARN,
      message: `Job ${jobId} removed from queue ${queueName}`,
      actorId,
    });

    // Invalidate stats
    await this.invalidateQueueStats(queueName);

    // Log audit
    if (actorId) {
      await this.auditLog.logAction({
        actorId,
        action: 'queue.job.remove',
        resource: queueName,
        payload: { jobId },
      });
    }

    this.logger.log(`Job removed: ${jobId} from queue: ${queueName}`);
  }

  /**
   * Pause queue
   */
  async pauseQueue(queueName: QueueName, actorId?: number): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.pause();

    // Publish event
    await this.publishEvent({
      type: 'queue.paused',
      ts: Date.now(),
      queue: queueName,
      severity: EVENT_SEVERITY.INFO,
      message: `Queue ${queueName} paused`,
      actorId,
    });

    // Log audit
    if (actorId) {
      await this.auditLog.logAction({
        actorId,
        action: 'queue.pause',
        resource: queueName,
        payload: {},
      });
    }

    this.logger.log(`Queue paused: ${queueName}`);
  }

  /**
   * Resume queue
   */
  async resumeQueue(queueName: QueueName, actorId?: number): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.resume();

    // Publish event
    await this.publishEvent({
      type: 'queue.resumed',
      ts: Date.now(),
      queue: queueName,
      severity: EVENT_SEVERITY.INFO,
      message: `Queue ${queueName} resumed`,
      actorId,
    });

    // Log audit
    if (actorId) {
      await this.auditLog.logAction({
        actorId,
        action: 'queue.resume',
        resource: queueName,
        payload: {},
      });
    }

    this.logger.log(`Queue resumed: ${queueName}`);
  }

  /**
   * Purge queue (remove all jobs)
   */
  async purgeQueue(queueName: QueueName, actorId?: number): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.drain();

    // Publish event
    await this.publishEvent({
      type: 'queue.purged',
      ts: Date.now(),
      queue: queueName,
      severity: EVENT_SEVERITY.WARN,
      message: `Queue ${queueName} purged`,
      actorId,
    });

    // Invalidate stats
    await this.invalidateQueueStats(queueName);

    // Log audit
    if (actorId) {
      await this.auditLog.logAction({
        actorId,
        action: 'queue.purge',
        resource: queueName,
        payload: {},
      });
    }

    this.logger.log(`Queue purged: ${queueName}`);
  }

  // ==========================================================================
  // DLQ MANAGEMENT
  // ==========================================================================

  /**
   * Push job to DLQ
   */
  async pushToDLQ(
    originalQueue: QueueName,
    originalJob: Job,
    error: Error,
  ): Promise<void> {
    const dlqQueue = this.getQueue(QUEUE_NAMES.DLQ);
    const dlqJobId = `${originalJob.id}:${Date.now()}`;

    const dlqPayload = {
      originalQueue,
      originalJobId: originalJob.id as string,
      originalJobName: originalJob.name,
      payload: originalJob.data,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      firstFailedAt: new Date(originalJob.timestamp || Date.now()).toISOString(),
      lastFailedAt: new Date().toISOString(),
      attemptsMade: originalJob.attemptsMade,
      isReplayed: false,
      replayCount: 0,
      workspaceId: originalJob.data?.workspaceId,
      tenantId: originalJob.data?.tenantId,
      actorId: originalJob.data?.actorId,
    };

    await dlqQueue.add(dlqJobId, dlqPayload, {
      attempts: 1,
      removeOnFail: false,
    });

    // Publish event
    await this.publishEvent({
      type: 'dlq.job_added',
      ts: Date.now(),
      queue: originalQueue,
      jobId: originalJob.id as string,
      severity: EVENT_SEVERITY.ERROR,
      message: `Job ${originalJob.id} moved to DLQ from queue ${originalQueue}`,
      meta: { error: error.message },
    });

    this.logger.warn(`Job moved to DLQ: ${originalJob.id} from queue ${originalQueue}`);
  }

  /**
   * Replay DLQ job
   */
  async replayDLQJob(dlqJobId: string, actorId?: number): Promise<void> {
    const dlqQueue = this.getQueue(QUEUE_NAMES.DLQ);
    const dlqJob = await dlqQueue.getJob(dlqJobId);

    if (!dlqJob) {
      throw new Error(`DLQ job ${dlqJobId} not found`);
    }

    const data = dlqJob.data;

    // Check replay limit
    if (data.replayCount >= 5) {
      throw new Error(`DLQ job ${dlqJobId} has been replayed too many times`);
    }

    // Get original queue
    const originalQueue = this.getQueue(data.originalQueue);

    // Re-enqueue with original job ID
    await originalQueue.add(data.originalJobId, data.payload, {
      jobId: data.originalJobId,
    });

    // Update DLQ job
    data.isReplayed = true;
    data.replayCount = data.replayCount + 1;
    data.lastReplayedAt = new Date().toISOString();
    data.actorId = actorId;

    // Remove from DLQ
    await dlqJob.remove();

    // Publish event
    await this.publishEvent({
      type: 'dlq.job_replayed',
      ts: Date.now(),
      queue: data.originalQueue,
      jobId: data.originalJobId,
      severity: EVENT_SEVERITY.INFO,
      message: `DLQ job ${dlqJobId} replayed to queue ${data.originalQueue}`,
      actorId,
    });

    // Invalidate stats
    await this.invalidateQueueStats(data.originalQueue);

    // Log audit
    if (actorId) {
      await this.auditLog.logAction({
        actorId,
        action: 'dlq.job.replay',
        resource: QUEUE_NAMES.DLQ,
        payload: { dlqJobId, originalJobId: data.originalJobId },
      });
    }

    this.logger.log(`DLQ job replayed: ${dlqJobId} to queue ${data.originalQueue}`);
  }

  /**
   * Get DLQ jobs
   */
  async getDLQJobs(start = 0, end = 50): Promise<Job[]> {
    const dlqQueue = this.getQueue(QUEUE_NAMES.DLQ);
    return await dlqQueue.getJobs([start, end], 'wait');
  }

  /**
   * Delete DLQ job
   */
  async deleteDLQJob(dlqJobId: string, actorId?: number): Promise<void> {
    const dlqQueue = this.getQueue(QUEUE_NAMES.DLQ);
    const dlqJob = await dlqQueue.getJob(dlqJobId);

    if (!dlqJob) {
      throw new Error(`DLQ job ${dlqJobId} not found`);
    }

    await dlqJob.remove();

    // Publish event
    await this.publishEvent({
      type: 'dlq.job_deleted',
      ts: Date.now(),
      queue: QUEUE_NAMES.DLQ,
      jobId: dlqJobId,
      severity: EVENT_SEVERITY.WARN,
      message: `DLQ job ${dlqJobId} deleted`,
      actorId,
    });

    // Log audit
    if (actorId) {
      await this.auditLog.logAction({
        actorId,
        action: 'dlq.job.delete',
        resource: QUEUE_NAMES.DLQ,
        payload: { dlqJobId },
      });
    }

    this.logger.log(`DLQ job deleted: ${dlqJobId}`);
  }

  /**
   * Clear DLQ
   */
  async clearDLQ(actorId?: number): Promise<void> {
    const dlqQueue = this.getQueue(QUEUE_NAMES.DLQ);
    await dlqQueue.drain();

    // Publish event
    await this.publishEvent({
      type: 'dlq.cleared',
      ts: Date.now(),
      queue: QUEUE_NAMES.DLQ,
      severity: EVENT_SEVERITY.WARN,
      message: `DLQ cleared`,
      actorId,
    });

    // Log audit
    if (actorId) {
      await this.auditLog.logAction({
        actorId,
        action: 'dlq.clear',
        resource: QUEUE_NAMES.DLQ,
        payload: {},
      });
    }

    this.logger.log(`DLQ cleared`);
  }

  // ==========================================================================
  // REALTIME EVENT PUBLISHING (REDIS PUB/SUB)
  // ==========================================================================

  /**
   * Publish event to Redis
   */
  private async publishEvent(event: RealtimeEvent): Promise<void> {
    try {
      const message = JSON.stringify(event);
      await this.redis.set(`pubsub:${REALTIME_CHANNELS.OWNER_EVENTS}:latest`, message, 60);
      // Note: For actual pub/sub, we would use Redis PUBLISH
      // For now, we're storing the latest event
      this.logger.debug(`Event published: ${event.type}`);
    } catch (error) {
      this.logger.error(`Failed to publish event: ${event.type}`, error);
    }
  }
}
