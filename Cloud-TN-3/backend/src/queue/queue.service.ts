import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job, JobOptions } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { AuditLogService } from '../logging/audit-log.service';
import { QueueRegistryService } from './queue.registry';
import { QUEUE_NAMES, QUEUE_CONFIGS } from './queue.config';

/**
 * Queue Service
 *
 * Handles:
 * - Job enqueueing (producers)
 * - Job management (retry, remove, get job details)
 * - Queue control (pause, resume, purge, clean)
 * - Idempotency checks (Redis SET NX with TTL)
 */

@Injectable()
export class QueueService implements OnModuleInit {
  private readonly logger = new Logger(QueueService.name);
  private readonly IDEMPOTENCY_TTL = 60 * 60 * 24; // 24 hours

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
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly auditLog: AuditLogService,
    private readonly queueRegistry: QueueRegistryService,
  ) {}

  async onModuleInit() {
    this.logger.log('QueueService initialized');
  }

  // ==========================================================================
  // ENQUEUE (PRODUCERS)
  // ==========================================================================

  /**
   * Generic enqueue method with idempotency check
   */
  async enqueue(
    queueName: string,
    jobName: string,
    data: any,
    options: JobOptions & { idempotencyKey?: string; userId?: number; tenantId?: string; } = {},
  ): Promise<Job | null> {
    const queue = this.queueRegistry.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const { idempotencyKey, userId, tenantId, ...jobOptions } = options;

    // Check idempotency
    if (idempotencyKey) {
      const exists = await this.checkIdempotency(idempotencyKey);
      if (exists) {
        this.logger.warn(`Idempotency key ${idempotencyKey} already exists, skipping job`);
        // Optionally, return existing job ID from Redis mapping
        // For now, we just return null
        return null;
      }

      // Mark idempotency key as used
      await this.markIdempotency(idempotencyKey);
    }

    // Add jobId -> idempotencyKey mapping to Redis (for inspection)
    const jobId = jobOptions.jobId || `${queueName}:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    if (idempotencyKey) {
      await this.redis.set(`job:idempotency:${jobId}`, idempotencyKey, this.IDEMPOTENCY_TTL);
    }

    // Enqueue job
    const job = await queue.add(jobName, data, { jobId, ...jobOptions });

    // Log audit
    await this.auditLog.logAction({
      actorUserId: userId,
      action: `job.enqueue`,
      resource: queueName,
      payload: { jobName, jobId, data },
    });

    return job;
  }

  /**
   * Enqueue to ai:content queue
   */
  async enqueueAiContent(
    jobName: string,
    data: any,
    options?: JobOptions & { idempotencyKey?: string; userId?: number; tenantId?: string; },
  ): Promise<Job | null> {
    return this.enqueue('ai:content', jobName, data, options);
  }

  /**
   * Enqueue to ai:seo queue
   */
  async enqueueAiSeo(
    jobName: string,
    data: any,
    options?: JobOptions & { idempotencyKey?: string; userId?: number; tenantId?: string; },
  ): Promise<Job | null> {
    return this.enqueue('ai:seo', jobName, data, options);
  }

  /**
   * Enqueue to ai:review queue
   */
  async enqueueAiReview(
    jobName: string,
    data: any,
    options?: JobOptions & { idempotencyKey?: string; userId?: number; tenantId?: string; },
  ): Promise<Job | null> {
    return this.enqueue('ai:review', jobName, data, options);
  }

  /**
   * Enqueue to workflows:run queue
   */
  async enqueueWorkflow(
    jobName: string,
    data: any,
    options?: JobOptions & { idempotencyKey?: string; userId?: number; tenantId?: string; },
  ): Promise<Job | null> {
    return this.enqueue('workflows:run', jobName, data, options);
  }

  /**
   * Enqueue to plugins:execute queue
   */
  async enqueuePlugin(
    jobName: string,
    data: any,
    options?: JobOptions & { idempotencyKey?: string; userId?: number; tenantId?: string; },
  ): Promise<Job | null> {
    return this.enqueue('plugins:execute', jobName, data, options);
  }

  /**
   * Enqueue to analytics:process queue
   */
  async enqueueAnalyticsProcess(
    jobName: string,
    data: any,
    options?: JobOptions & { idempotencyKey?: string; userId?: number; tenantId?: string; },
  ): Promise<Job | null> {
    return this.enqueue('analytics:process', jobName, data, options);
  }

  /**
   * Enqueue to analytics:snapshot queue
   */
  async enqueueAnalyticsSnapshot(
    jobName: string,
    data: any,
    options?: JobOptions & { idempotencyKey?: string; userId?: number; tenantId?: string; },
  ): Promise<Job | null> {
    return this.enqueue('analytics:snapshot', jobName, data, options);
  }

  /**
   * Enqueue to email:send queue
   */
  async enqueueEmail(
    jobName: string,
    data: any,
    options?: JobOptions & { idempotencyKey?: string; userId?: number; tenantId?: string; },
  ): Promise<Job | null> {
    return this.enqueue('email:send', jobName, data, options);
  }

  /**
   * Enqueue to otp:send queue
   */
  async enqueueOtp(
    jobName: string,
    data: any,
    options?: JobOptions & { idempotencyKey?: string; userId?: number; tenantId?: string; },
  ): Promise<Job | null> {
    return this.enqueue('otp:send', jobName, data, options);
  }

  /**
   * Enqueue to webhooks:deliver queue
   */
  async enqueueWebhook(
    jobName: string,
    data: any,
    options?: JobOptions & { idempotencyKey?: string; userId?: number; tenantId?: string; },
  ): Promise<Job | null> {
    return this.enqueue('webhooks:deliver', jobName, data, options);
  }

  /**
   * Enqueue to media:optimize queue
   */
  async enqueueMediaOptimize(
    jobName: string,
    data: any,
    options?: JobOptions & { idempotencyKey?: string; userId?: number; tenantId?: string; },
  ): Promise<Job | null> {
    return this.enqueue('media:optimize', jobName, data, options);
  }

  /**
   * Enqueue to search:index queue
   */
  async enqueueSearchIndex(
    jobName: string,
    data: any,
    options?: JobOptions & { idempotencyKey?: string; userId?: number; tenantId?: string; },
  ): Promise<Job | null> {
    return this.enqueue('search:index', jobName, data, options);
  }

  // ==========================================================================
  // IDEMPOTENCY
  // ==========================================================================

  /**
   * Check idempotency key
   */
  private async checkIdempotency(key: string): Promise<boolean> {
    const exists = await this.redis.exists(`idempotency:${key}`);
    return exists === 1;
  }

  /**
   * Mark idempotency key as used
   */
  private async markIdempotency(key: string): Promise<void> {
    await this.redis.set(`idempotency:${key}`, '1', this.IDEMPOTENCY_TTL);
  }

  /**
   * Get idempotency key for job
   */
  async getJobIdempotencyKey(jobId: string): Promise<string | null> {
    return await this.redis.get(`job:idempotency:${jobId}`);
  }

  // ==========================================================================
  // QUEUE CONTROL
  // ==========================================================================

  /**
   * Pause queue
   */
  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.queueRegistry.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.pause();
    this.logger.log(`Queue ${queueName} paused`);
  }

  /**
   * Resume queue
   */
  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.queueRegistry.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.resume();
    this.logger.log(`Queue ${queueName} resumed`);
  }

  /**
   * Purge queue (delete all jobs)
   */
  async purgeQueue(queueName: string): Promise<void> {
    const queue = this.queueRegistry.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.drain();
    this.logger.log(`Queue ${queueName} purged`);
  }

  /**
   * Clean queue (remove completed/failed jobs)
   */
  async cleanQueue(queueName: string, grace?: number): Promise<void> {
    const queue = this.queueRegistry.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const count = await queue.clean(grace || 0, 'completed');
    await queue.clean(grace || 0, 'failed');
    this.logger.log(`Queue ${queueName} cleaned (removed ${count} jobs)`);
  }

  // ==========================================================================
  // JOB MANAGEMENT
  // ==========================================================================

  /**
   * Get job by ID
   */
  async getJob(queueName: string, jobId: string): Promise<Job | null> {
    const queue = this.queueRegistry.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    return await queue.getJob(jobId);
  }

  /**
   * Retry job
   */
  async retryJob(queueName: string, jobId: string): Promise<void> {
    const queue = this.queueRegistry.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.add(`retry-${jobId}`, {}, { jobId });
    this.logger.log(`Job ${jobId} in queue ${queueName} retryd`);
  }

  /**
   * Remove job
   */
  async removeJob(queueName: string, jobId: string): Promise<void> {
    const queue = this.queueRegistry.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.getJob(jobId);
    if (job) {
      await job.remove();
      this.logger.log(`Job ${jobId} in queue ${queueName} removed`);
    }
  }

  /**
   * Get jobs by state (paginated)
   */
  async getJobsByState(
    queueName: string,
    state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed',
    start = 0,
    end = 50,
  ): Promise<Job[]> {
    const queue = this.queueRegistry.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    return await queue.getJobs([start, end], state);
  }

  /**
   * Get job counts by state
   */
  async getJobCounts(queueName: string): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const queue = this.queueRegistry.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const counts = await queue.getJobCounts();
    return counts;
  }

  // ==========================================================================
  // QUEUE STATS (LIVE FROM BULLMQ)
  // ==========================================================================

  /**
   * Get queue stats (counts, rates, etc.)
   */
  async getQueueStats(queueName: string): Promise<any> {
    const queue = this.queueRegistry.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const counts = await queue.getJobCounts();
    const workers = await queue.getWorkers();

    return {
      counts,
      workers: workers.length,
      config: QUEUE_CONFIGS[queueName],
    };
  }

  /**
   * Get all queue stats
   */
  async getAllQueueStats(): Promise<Record<string, any>> {
    const stats: Record<string, any> = {};

    for (const queueName of QUEUE_NAMES) {
      stats[queueName] = await this.getQueueStats(queueName);
    }

    return stats;
  }
}
