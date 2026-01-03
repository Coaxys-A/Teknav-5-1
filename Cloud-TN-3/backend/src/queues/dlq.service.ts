import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { RedisService } from '../redis/redis.service';
import { QUEUE_NAMES, DLQ_NAMES } from './queue.module';

/**
 * DLQ Service - Dead Letter Queue Management (BullMQ)
 * 
 * BullMQ automatically moves failed jobs to DLQ if configured.
 * This service provides manual replay and deletion.
 */

@Injectable()
export class DLQService {
  private readonly logger = new Logger(DLQService.name);
  private readonly dlqQueues: Map<string, Queue> = new Map();

  constructor(
    private readonly redis: RedisService,
    @InjectQueue(DLQ_NAMES.AI_CONTENT) private readonly dlqAiContent: Queue,
    @InjectQueue(DLQ_NAMES.AI_SEO) private readonly dlqAiSeo: Queue,
    @InjectQueue(DLQ_NAMES.WORKFLOW) private readonly dlqWorkflow: Queue,
    @InjectQueue(DLQ_NAMES.PLUGIN) private readonly dlqPlugin: Queue,
    @InjectQueue(DLQ_NAMES.ANALYTICS) private readonly dlqAnalytics: Queue,
    @InjectQueue(DLQ_NAMES.EMAIL_OTP) private readonly dlqEmailOtp: Queue,
  ) {
    // Register DLQ queues
    this.dlqQueues.set(DLQ_NAMES.AI_CONTENT, dlqAiContent);
    this.dlqQueues.set(DLQ_NAMES.AI_SEO, dlqAiSeo);
    this.dlqQueues.set(DLQ_NAMES.WORKFLOW, dlqWorkflow);
    this.dlqQueues.set(DLQ_NAMES.PLUGIN, dlqPlugin);
    this.dlqQueues.set(DLQ_NAMES.ANALYTICS, dlqAnalytics);
    this.dlqQueues.set(DLQ_NAMES.EMAIL_OTP, dlqEmailOtp);
  }

  /**
   * Get DLQ jobs
   */
  async getDLQJobs(dlqName: string, filters: {
    cursor?: string;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const dlqQueue = this.getDLQ(dlqName);
    if (!dlqQueue) {
      return { jobs: [], total: 0, hasMore: false, nextCursor: null };
    }

    const jobs = await dlqQueue.getFailed(skip, limit);
    const total = await dlqQueue.getJobCounts();
    const hasMore = skip + limit < total.failed;
    const nextCursor = hasMore ? (page + 1).toString() : null;

    return {
      jobs: jobs.map(job => ({
        id: job.id,
        name: job.name,
        data: job.data,
        opts: job.opts,
        attemptsMade: job.attemptsMade,
        failedReason: job.failedReason,
        stacktrace: job.stacktrace,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
      })),
      total: total.failed,
      hasMore,
      nextCursor,
    };
  }

  /**
   * Replay DLQ job back to original queue
   */
  async replayDLQJob(params: {
    dlqName: string;
    dlqJobId: string;
  }) {
    this.logger.log(`Replaying DLQ job: ${params.dlqJobId}`);

    const dlqQueue = this.getDLQ(params.dlqName);
    if (!dlqQueue) {
      throw new Error(`DLQ not found: ${params.dlqName}`);
    }

    // Get DLQ job
    const job = await dlqQueue.getJob(params.dlqJobId);
    if (!job) {
      throw new Error(`DLQ job not found: ${params.dlqJobId}`);
    }

    // Extract original job data
    const originalQueueName = this.getOriginalQueueFromDLQ(params.dlqName);
    const originalQueueName2 = this.getOriginalQueueFromDLQ2(originalQueueName);
    
    // Add job to original queue
    const originalQueue = this.getOriginalQueue(originalQueueName);
    if (!originalQueue) {
      throw new Error(`Original queue not found: ${originalQueueName}`);
    }

    await originalQueue.add(job.name, job.data, {
      jobId: job.id,
      ...job.opts,
    });

    // Remove from DLQ
    await dlqQueue.remove(params.dlqJobId);

    this.logger.debug(`DLQ job replayed: ${params.dlqJobId} -> ${originalQueueName}`);
  }

  /**
   * Remove DLQ job
   */
  async removeDLQJob(params: {
    dlqName: string;
    dlqJobId: string;
  }) {
    this.logger.log(`Removing DLQ job: ${params.dlqJobId}`);

    const dlqQueue = this.getDLQ(params.dlqName);
    if (!dlqQueue) {
      throw new Error(`DLQ not found: ${params.dlqName}`);
    }

    await dlqQueue.remove(params.dlqJobId);
    this.logger.debug(`DLQ job removed: ${params.dlqJobId}`);
  }

  /**
   * Replay all DLQ jobs
   */
  async replayAllDLQJobs(dlqName: string) {
    this.logger.log(`Replaying all DLQ jobs: ${dlqName}`);

    const dlqQueue = this.getDLQ(dlqName);
    if (!dlqQueue) {
      return { replayed: 0 };
    }

    const jobs = await dlqQueue.getFailed(0, 1000); // Get all (up to 1000)
    let replayed = 0;

    for (const job of jobs) {
      try {
        await this.replayDLQJob({
          dlqName,
          dlqJobId: job.id.toString(),
        });
        replayed++;
      } catch (err) {
        this.logger.error(`Failed to replay job ${job.id}:`, err.message);
      }
    }

    this.logger.log(`Replayed ${replayed} DLQ jobs from ${dlqName}`);
    return { replayed };
  }

  /**
   * Clear DLQ (remove all jobs)
   */
  async clearDLQ(dlqName: string) {
    this.logger.log(`Clearing DLQ: ${dlqName}`);

    const dlqQueue = this.getDLQ(dlqName);
    if (!dlqQueue) {
      throw new Error(`DLQ not found: ${dlqName}`);
    }

    await dlqQueue.drain();
    this.logger.debug(`DLQ cleared: ${dlqName}`);
  }

  /**
   * Get DLQ queue instance
   */
  private getDLQ(dlqName: string): Queue | null {
    // DLQ names are mapped to queue instances in constructor
    // Note: The DLQ queue instances are stored in this.dlqQueues map
    return this.dlqQueues.get(dlqName) || null;
  }

  /**
   * Get original queue name from DLQ name
   */
  private getOriginalQueueFromDLQ(dlqName: string): string {
    // dlq:ai:content -> ai:content
    return dlqName.replace('dlq:', '');
  }

  /**
   * Get original queue name from DLQ name (variant)
   */
  private getOriginalQueueFromDLQ2(dlqName: string): string {
    return dlqName.replace('dlq:', '');
  }

  /**
   * Get original queue instance
   */
  private getOriginalQueue(originalQueueName: string): Queue | null {
    // This would require QueueService or inject all original queues
    // For now, return null (will be handled in controller via QueueStatsService)
    return null;
  }
}
