import { Injectable, Logger } from '@nestjs/common';
import { Queue, Worker, QueueEvents, JobsOptions, BackoffOptions } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';

type Processor<T = any> = (job: { id: string; name: string; data: T; attemptsMade: number }) => Promise<any>;

const DEFAULT_ATTEMPTS = 5;
const DEFAULT_BACKOFF: BackoffOptions = { type: 'exponential', delay: 2000 };
const DEFAULT_TIMEOUT = 30000;

@Injectable()
export class BullQueueService {
  private readonly queues = new Map<string, Queue>();
  private readonly dlqs = new Map<string, Queue>();
  private readonly logger = new Logger(BullQueueService.name);

  constructor(private readonly config: ConfigService, private readonly redis: RedisService) {}

  private queueConfig(name: string) {
    const attempts = Number(this.config.get(`queue.${name}.attempts`)) || DEFAULT_ATTEMPTS;
    const delay = Number(this.config.get(`queue.${name}.backoffDelay`)) || DEFAULT_BACKOFF.delay!;
    const timeout = Number(this.config.get(`queue.${name}.timeout`)) || DEFAULT_TIMEOUT;
    const concurrency = Number(this.config.get(`queue.${name}.concurrency`)) || undefined;
    return { attempts, delay, timeout, concurrency };
  }

  private connection() {
    const url = this.config.get<string>('redis.url') ?? process.env.REDIS_URL;
    return url ? { url } : undefined;
  }

  private defaultJobOptions(): JobsOptions {
    return {
      attempts: DEFAULT_ATTEMPTS,
      backoff: DEFAULT_BACKOFF,
      removeOnComplete: true,
      removeOnFail: false,
    };
  }

  private getDlq(name: string) {
    if (!this.dlqs.has(name)) {
      const dlq = new Queue(`${name}:dlq`, { connection: this.connection() });
      this.dlqs.set(name, dlq);
    }
    return this.dlqs.get(name)!;
  }

  getQueue(name: string) {
    if (!this.queues.has(name)) {
      const cfg = this.queueConfig(name);
      const queue = new Queue(name, {
        connection: this.connection(),
        defaultJobOptions: {
          ...this.defaultJobOptions(),
          attempts: cfg.attempts,
          backoff: { type: 'exponential', delay: cfg.delay },
        },
      });
      this.queues.set(name, queue);
    }
    return this.queues.get(name)!;
  }

  createWorker(name: string, processor: Processor, opts?: { concurrency?: number; attempts?: number; timeoutMs?: number }) {
    const cfg = this.queueConfig(name);
    const worker = new Worker(
      name,
      async (job) => {
        return processor({ id: job.id as string, name: job.name, data: job.data, attemptsMade: job.attemptsMade });
      },
      {
        connection: this.connection(),
        concurrency: opts?.concurrency ?? cfg.concurrency ?? 5,
        lockDuration: opts?.timeoutMs ?? cfg.timeout,
        maxStalledCount: 1,
      },
    );
    const events = new QueueEvents(name, { connection: this.connection() });
    events.on('failed', async ({ jobId, failedReason, prev }) => {
      this.logger.warn(`Job failed in ${name} id=${jobId} reason=${failedReason}`);
      await this.getDlq(name).add(
        'failed',
        { jobId, reason: failedReason, queue: name, prev },
        { removeOnComplete: true, attempts: 1 },
      );
    });
    events.on('completed', async () => {
      await this.metrics(name);
    });
    return worker;
  }

  async addJob<T = any>(queueName: string, data: T, opts?: JobsOptions) {
    const queue = this.getQueue(queueName);
    await queue.add(queueName, data, {
      ...this.defaultJobOptions(),
      ...opts,
    });
  }

  async metrics(name: string) {
    const queue = this.getQueue(name);
    const counts = await queue.getJobCounts('waiting', 'active', 'delayed', 'failed', 'completed');
    await this.redis.set(`queue:metrics:${name}`, counts, 30);
    return counts;
  }

  async failed(name: string, limit = 20) {
    const queue = this.getQueue(name);
    return queue.getFailed(0, limit);
  }

  async retry(name: string, jobId: string) {
    const queue = this.getQueue(name);
    const job = await queue.getJob(jobId);
    if (!job) return null;
    await job.retry();
    return { ok: true };
  }

  async requeueFromDlq(name: string, limit = 20) {
    const dlq = this.getDlq(name);
    const jobs = await dlq.getJobs(['waiting', 'failed'], 0, limit);
    const queue = this.getQueue(name);
    for (const job of jobs) {
      await queue.add(name, job.data, { ...this.defaultJobOptions() });
      await job.remove();
    }
    return { ok: true, moved: jobs.length };
  }

  async health(name?: string) {
    const client = this.redis.getClient();
    const pong = client ? await client.ping() : 'rest-only';
    if (!name) return { redis: pong, queues: [...this.queues.keys()] };
    const counts = await this.metrics(name);
    const dlqCounts = await this.getDlq(name).getJobCounts('waiting', 'failed', 'completed');
    return { redis: pong, counts, dlq: dlqCounts };
  }
}
