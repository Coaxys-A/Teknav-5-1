import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from './queue.module';
import { randomUUID } from 'crypto';

export interface JobPayload {
  name: string;
  data: any;
  opts?: {
    delay?: number;
    attempts?: number;
  };
}

@Injectable()
export class QueueProducerService {
  private readonly logger = new Logger(QueueProducerService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.AI_CONTENT) private readonly aiContentQueue: Queue,
    @InjectQueue(QUEUE_NAMES.AI_SEO) private readonly aiSeoQueue: Queue,
    @InjectQueue(QUEUE_NAMES.WORKFLOW) private readonly workflowQueue: Queue,
    @InjectQueue(QUEUE_NAMES.PLUGIN) private readonly pluginQueue: Queue,
    @InjectQueue(QUEUE_NAMES.ANALYTICS) private readonly analyticsQueue: Queue,
    @InjectQueue(QUEUE_NAMES.EMAIL_OTP) private readonly emailOtpQueue: Queue,
  ) {}

  /**
   * Add job to AI Content queue
   */
  async addAiContentJob(name: string, data: any, opts?: any) {
    const job = await this.aiContentQueue.add(name, data, {
      jobId: randomUUID(),
      ...opts,
    });
    this.logger.debug(`Added AI content job: ${name} (id: ${job.id})`);
    return job;
  }

  /**
   * Add job to AI SEO queue
   */
  async addAiSeoJob(name: string, data: any, opts?: any) {
    const job = await this.aiSeoQueue.add(name, data, {
      jobId: randomUUID(),
      ...opts,
    });
    this.logger.debug(`Added AI SEO job: ${name} (id: ${job.id})`);
    return job;
  }

  /**
   * Add job to Workflow queue
   */
  async addWorkflowJob(name: string, data: any, opts?: any) {
    const job = await this.workflowQueue.add(name, data, {
      jobId: randomUUID(),
      ...opts,
    });
    this.logger.debug(`Added workflow job: ${name} (id: ${job.id})`);
    return job;
  }

  /**
   * Add job to Plugin queue
   */
  async addPluginJob(name: string, data: any, opts?: any) {
    const job = await this.pluginQueue.add(name, data, {
      jobId: randomUUID(),
      ...opts,
    });
    this.logger.debug(`Added plugin job: ${name} (id: ${job.id})`);
    return job;
  }

  /**
   * Add job to Analytics queue
   */
  async addAnalyticsJob(name: string, data: any, opts?: any) {
    const job = await this.analyticsQueue.add(name, data, {
      jobId: randomUUID(),
      ...opts,
    });
    this.logger.debug(`Added analytics job: ${name} (id: ${job.id})`);
    return job;
  }

  /**
   * Add job to Email/OTP queue
   */
  async addEmailOtpJob(name: string, data: any, opts?: any) {
    const job = await this.emailOtpQueue.add(name, data, {
      jobId: randomUUID(),
      ...opts,
    });
    this.logger.debug(`Added email/OTP job: ${name} (id: ${job.id})`);
    return job;
  }

  /**
   * Add bulk jobs to a queue
   */
  async addBulkJobs(queueName: string, jobs: JobPayload[]) {
    let queue: Queue;
    
    switch (queueName) {
      case QUEUE_NAMES.AI_CONTENT:
        queue = this.aiContentQueue;
        break;
      case QUEUE_NAMES.AI_SEO:
        queue = this.aiSeoQueue;
        break;
      case QUEUE_NAMES.WORKFLOW:
        queue = this.workflowQueue;
        break;
      case QUEUE_NAMES.PLUGIN:
        queue = this.pluginQueue;
        break;
      case QUEUE_NAMES.ANALYTICS:
        queue = this.analyticsQueue;
        break;
      case QUEUE_NAMES.EMAIL_OTP:
        queue = this.emailOtpQueue;
        break;
      default:
        throw new Error(`Unknown queue: ${queueName}`);
    }

    const addedJobs = await queue.addBulk(
      jobs.map(job => ({
        name: job.name,
        data: job.data,
        opts: {
          jobId: randomUUID(),
          ...job.opts,
        },
      })),
    );

    this.logger.debug(`Added ${addedJobs.length} jobs to queue ${queueName}`);
    return addedJobs;
  }
}
