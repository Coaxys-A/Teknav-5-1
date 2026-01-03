import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { RedisService } from '../redis/redis.service';
import { QUEUE_NAMES } from './queue.module';

export interface QueueStats {
  queue: string;
  waiting: number;
  active: number;
  delayed: number;
  completed: number;
  failed: number;
  paused: number;
  throughput: {
    jobsPerMin: number;
    jobsPerHour: number;
  };
  lastError: any;
}

@Injectable()
export class QueueStatsService {
  private readonly logger = new Logger(QueueStatsService.name);

  constructor(
    private readonly redis: RedisService,
    @InjectQueue(QUEUE_NAMES.AI_CONTENT) private readonly aiContentQueue: Queue,
    @InjectQueue(QUEUE_NAMES.AI_SEO) private readonly aiSeoQueue: Queue,
    @InjectQueue(QUEUE_NAMES.WORKFLOW) private readonly workflowQueue: Queue,
    @InjectQueue(QUEUE_NAMES.PLUGIN) private readonly pluginQueue: Queue,
    @InjectQueue(QUEUE_NAMES.ANALYTICS) private readonly analyticsQueue: Queue,
    @InjectQueue(QUEUE_NAMES.EMAIL_OTP) private readonly emailOtpQueue: Queue,
  ) {}

  /**
   * Get stats for a single queue
   */
  async getQueueStats(queueName: string): Promise<QueueStats> {
    const cacheKey = this.getCacheKey(queueName);
    
    try {
      return await this.redis.cacheWrap(
        cacheKey,
        10, // 10s TTL
        async () => {
          const queue = this.getQueue(queueName);
          if (!queue) {
            return this.getEmptyStats(queueName);
          }

          const counts = await queue.getJobCounts();
          const workers = await queue.getWorkers();

          return {
            queue: queueName,
            waiting: counts.waiting,
            active: counts.active,
            delayed: counts.delayed,
            completed: counts.completed,
            failed: counts.failed,
            paused: workers.length === 0 || workers.every(w => w.isPaused()),
            throughput: {
              jobsPerMin: await this.computeJobsPerMin(queue),
              jobsPerHour: await this.computeJobsPerHour(queue),
            },
            lastError: await this.getLastError(queue),
          };
        },
      );
    } catch (err) {
      this.logger.error(`Failed to get stats for queue ${queueName}:`, err.message);
      return this.getEmptyStats(queueName);
    }
  }

  /**
   * Get stats for all queues
   */
  async getAllQueueStats(): Promise<{ total: number; queues: QueueStats[] }> {
    const queueNames = Object.values(QUEUE_NAMES);
    const statsPromises = queueNames.map(name => this.getQueueStats(name));
    const statsArray = await Promise.all(statsPromises);
    
    return {
      total: statsArray.length,
      queues: statsArray,
    };
  }

  /**
   * Get jobs list for a queue
   */
  async getJobs(queueName: string, filters: {
    status?: 'waiting' | 'active' | 'delayed' | 'completed' | 'failed';
    cursor?: string;
    page?: number;
    limit?: number;
    q?: string;
  }) {
    const queue = this.getQueue(queueName);
    if (!queue) {
      return { jobs: [], total: 0, hasMore: false, nextCursor: null };
    }

    const { status, page = 1, limit = 20, q } = filters;
    const skip = (page - 1) * limit;

    let jobQuery;
    switch (status) {
      case 'waiting':
        jobQuery = queue.getWaiting(skip, limit);
        break;
      case 'active':
        jobQuery = queue.getActive(skip, limit);
        break;
      case 'delayed':
        jobQuery = queue.getDelayed(skip, limit);
        break;
      case 'completed':
        jobQuery = queue.getCompleted(skip, limit);
        break;
      case 'failed':
        jobQuery = queue.getFailed(skip, limit);
        break;
      default:
        jobQuery = queue.getJobs(['waiting', 'active', 'delayed'], { start: skip, end: skip + limit });
    }

    let jobs = await jobQuery;
    
    // Search filter
    if (q) {
      jobs = jobs.filter(job => 
        job.name?.toLowerCase().includes(q.toLowerCase()) ||
        job.id.toString().includes(q)
      );
    }

    const total = await queue.getJobCounts();
    const totalCount = total[status || 'waiting'] || 0;
    const hasMore = skip + limit < totalCount;
    const nextCursor = hasMore ? (page + 1).toString() : null;

    return {
      jobs: jobs.map(job => ({
        id: job.id,
        name: job.name,
        data: job.data,
        opts: job.opts,
        progress: job.progress,
        attemptsMade: job.attemptsMade,
        failedReason: job.failedReason,
        stacktrace: job.stacktrace,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
      })),
      total: totalCount,
      hasMore,
      nextCursor,
    };
  }

  /**
   * Get single job details
   */
  async getJob(queueName: string, jobId: string) {
    const queue = this.getQueue(queueName);
    if (!queue) {
      return null;
    }

    return await queue.getJob(jobId);
  }

  /**
   * Get DLQ jobs
   */
  async getDLQJobs(queueName: string, filters: {
    cursor?: string;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;
    
    const cacheKey = this.getCacheKey(queueName, 'dlq');
    
    return await this.redis.cacheWrap(
      cacheKey,
      10,
      async () => {
        // In BullMQ, DLQ is just another queue with name 'dlq:...'
        const dlqName = this.getDLQName(queueName);
        const dlqQueue = this.getQueue(dlqName);
        
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
      },
    );
  }

  /**
   * Compute jobs per minute (estimate)
   */
  private async computeJobsPerMin(queue: Queue): Promise<number> {
    // Count completed jobs in last minute
    const oneMinuteAgo = Date.now() - 60 * 1000;
    const jobs = await queue.getCompleted(0, 1000); // Get last 1000 completed jobs
    const recentJobs = jobs.filter(job => job.finishedOn && job.finishedOn.getTime() >= oneMinuteAgo);
    return recentJobs.length;
  }

  /**
   * Compute jobs per hour (estimate)
   */
  private async computeJobsPerHour(queue: Queue): Promise<number> {
    // Count completed jobs in last hour
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const jobs = await queue.getCompleted(0, 1000); // Get last 1000 completed jobs
    const recentJobs = jobs.filter(job => job.finishedOn && job.finishedOn.getTime() >= oneHourAgo);
    return recentJobs.length;
  }

  /**
   * Get last error
   */
  private async getLastError(queue: Queue): Promise<any> {
    const jobs = await queue.getFailed(0, 1);
    if (jobs.length === 0) {
      return null;
    }
    const job = jobs[0];
    return {
      jobId: job.id,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
      finishedOn: job.finishedOn,
    };
  }

  /**
   * Get queue instance
   */
  private getQueue(queueName: string): Queue | null {
    switch (queueName) {
      case QUEUE_NAMES.AI_CONTENT:
        return this.aiContentQueue;
      case QUEUE_NAMES.AI_SEO:
        return this.aiSeoQueue;
      case QUEUE_NAMES.WORKFLOW:
        return this.workflowQueue;
      case QUEUE_NAMES.PLUGIN:
        return this.pluginQueue;
      case QUEUE_NAMES.ANALYTICS:
        return this.analyticsQueue;
      case QUEUE_NAMES.EMAIL_OTP:
        return this.emailOtpQueue;
      default:
        return null;
    }
  }

  /**
   * Get DLQ name
   */
  private getDLQName(queueName: string): string {
    return 'dlq:' + queueName;
  }

  /**
   * Get cache key
   */
  private getCacheKey(queueName: string, suffix?: string): string {
    const parts = ['queue:stats', queueName];
    if (suffix) {
      parts.push(suffix);
    }
    return parts.join(':');
  }

  /**
   * Get empty stats
   */
  private getEmptyStats(queueName: string): QueueStats {
    return {
      queue: queueName,
      waiting: 0,
      active: 0,
      delayed: 0,
      completed: 0,
      failed: 0,
      paused: false,
      throughput: {
        jobsPerMin: 0,
        jobsPerHour: 0,
      },
      lastError: null,
    };
  }

  /**
   * Cache helper
   */
  private async cacheWrap<T>(key: string, ttl: number, factory: () => Promise): Promise {
    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }

    const result = await factory();
    await this.redis.set(key, JSON.stringify(result), ttl);
    return result;
  }
}
  /**
   * Cache helper
   */
  private async cacheWrap<T>(key: string, ttl: number, factory: () => Promise): Promise {
    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }

    const result = await factory();
    await this.redis.set(key, JSON.stringify(result), ttl);
    return result;
  }
}
