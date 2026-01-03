import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { QueueService } from '../queue.service';
import { DlqService } from '../dlq/dlq.service';
import { QueueRegistryService } from '../queue.registry';
import { AuditLogService } from '../../logging/audit-log.service';
import { QUEUE_NAMES, getDLQName } from '../queue.config';

/**
 * Owner Queues Service
 *
 * Handles:
 * - Queue list (with stats)
 * - Queue control (pause, resume, purge)
 * - Job list (waiting, active, completed, failed, delayed)
 * - Job detail (payload, attempts, timeline, replay/remove)
 * - DLQ list (with filters)
 * - DLQ replay/purge/delete
 */

@Injectable()
export class OwnerQueuesService {
  private readonly logger = new Logger(OwnerQueuesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly queueService: QueueService,
    private readonly dlqService: DlqService,
    private readonly queueRegistry: QueueRegistryService,
    private readonly auditLog: AuditLogService,
  ) {}

  // ==========================================================================
  // QUEUE LIST
  // ==========================================================================

  /**
   * List all queues with live stats
   */
  async listQueues(): Promise<any[]> {
    const queues: any[] = [];

    for (const queueName of QUEUE_NAMES) {
      const statsKey = `teknav:queue:${queueName}:stats`;
      const statsStr = await this.redis.get(statsKey);

      if (!statsStr) {
        // Fallback to BullMQ getJobCounts
        const queue = this.queueRegistry.getQueue(queueName);
        if (!queue) {
          continue;
        }
        const counts = await queue.getJobCounts();
        const stats = {
          waiting: counts.waiting,
          active: counts.active,
          completed: counts.completed,
          failed: counts.failed,
          delayed: counts.delayed,
          paused: queue.isPaused(),
          workers: 0,
          rate: 0,
          avgDurationMs: 0,
          p95DurationMs: 0,
          lastUpdatedAt: new Date(),
        };
        queues.push({ name: queueName, stats });
        continue;
      }

      const stats = JSON.parse(statsStr);
      queues.push({ name: queueName, stats });
    }

    return queues;
  }

  // ==========================================================================
  // QUEUE CONTROL
  // ==========================================================================

  /**
   * Pause queue
   */
  async pauseQueue(queueName: string, actorId: number): Promise<void> {
    await this.queueService.pauseQueue(queueName);
    await this.auditLog.logAction({
      actorId,
      action: 'queue.paused',
      resource: queueName,
      payload: {},
    });
  }

  /**
   * Resume queue
   */
  async resumeQueue(queueName: string, actorId: number): Promise<void> {
    await this.queueService.resumeQueue(queueName);
    await this.auditLog.logAction({
      actorId,
      action: 'queue.resumed',
      resource: queueName,
      payload: {},
    });
  }

  /**
   * Purge queue
   */
  async purgeQueue(queueName: string, actorId: number): Promise<void> {
    await this.queueService.purgeQueue(queueName);
    await this.auditLog.logAction({
      actorId,
      action: 'queue.purged',
      resource: queueName,
      payload: {},
    });
  }

  // ==========================================================================
  // JOB LIST
  // ==========================================================================

  /**
   * Get jobs by state
   */
  async getJobs(
    queueName: string,
    state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed',
    start = 0,
    end = 50,
  ): Promise<any> {
    const jobs = await this.queueService.getJobsByState(queueName, state, start, end);

    return {
      data: jobs,
      state,
      total: jobs.length,
    };
  }

  // ==========================================================================
  // JOB DETAIL
  // ==========================================================================

  /**
   * Get job detail
   */
  async getJob(queueName: string, jobId: string): Promise<any> {
    const job = await this.queueService.getJob(queueName, jobId);

    if (!job) {
      return { error: 'Job not found' };
    }

    // Enrich with idempotency key (if available)
    const idempotencyKey = await this.queueService.getJobIdempotencyKey(job.id!);

    return {
      id: job.id,
      name: job.name,
      data: job.data,
      opts: job.opts,
      progress: job.progress,
      returnvalue: job.returnvalue,
      stacktrace: job.stacktrace,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      isFailed: job.failedReason !== undefined,
      isCompleted: job.finishedOn !== undefined && job.returnvalue !== undefined,
      idempotencyKey,
      timeline: {
        created: job.timestamp,
        processed: job.processedOn,
        completed: job.finishedOn,
      },
    };
  }

  // ==========================================================================
  // JOB ACTIONS
  // ==========================================================================

  /**
   * Retry job
   */
  async retryJob(queueName: string, jobId: string, actorId: number): Promise<void> {
    await this.queueService.retryJob(queueName, jobId);
    await this.auditLog.logAction({
      actorId,
      action: 'job.retried',
      resource: queueName,
      payload: { jobId },
    });
  }

  /**
   * Remove job
   */
  async removeJob(queueName: string, jobId: string, actorId: number): Promise<void> {
    await this.queueService.removeJob(queueName, jobId);
    await this.auditLog.logAction({
      actorId,
      action: 'job.removed',
      resource: queueName,
      payload: { jobId },
    });
  }

  // ==========================================================================
  // DLQ ACTIONS
  // ==========================================================================

  /**
   * List DLQ jobs
   */
  async getDLQJobs(
    queueName: string,
    filters: {
      page?: number;
      pageSize?: number;
      startTime?: Date;
      endTime?: Date;
      errorType?: string;
      jobId?: string;
    } = {},
  ): Promise<any> {
    return await this.dlqService.getDLQJobs(queueName, filters);
  }

  /**
   * Search DLQ jobs
   */
  async searchDLQJobs(
    queueName: string,
    query: string,
    page = 1,
    pageSize = 20,
  ): Promise<any> {
    return await this.dlqService.searchDLQJobs(queueName, query, page, pageSize);
  }

  /**
   * Replay DLQ job
   */
  async replayDLQJob(queueName: string, dlqJobId: string, actorId: number): Promise<void> {
    await this.dlqService.replayJob(queueName, dlqJobId, actorId);
  }

  /**
   * Replay batch DLQ jobs
   */
  async replayDLQBatch(queueName: string, dlqJobIds: string[], actorId: number): Promise<{ success: number; failed: number }> {
    return await this.dlqService.replayBatch(queueName, dlqJobIds, actorId);
  }

  /**
   * Purge DLQ
   */
  async purgeDLQ(queueName: string, actorId: number): Promise<number> {
    return await this.dlqService.purgeDLQ(queueName, actorId);
  }

  /**
   * Delete DLQ job
   */
  async deleteDLQJob(queueName: string, dlqJobId: string, actorId: number): Promise<void> {
    await this.dlqService.deleteDLQJob(queueName, dlqJobId, actorId);
  }
}
