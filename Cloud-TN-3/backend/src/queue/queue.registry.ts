import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES, getDLQName } from './queue.config';

/**
 * Queue Registry Service
 *
 * Provides access to registered BullMQ queue instances.
 * Used by producers, consumers, DLQ, and metrics services.
 */

@Injectable()
export class QueueRegistryService {
  private readonly logger = new Logger(QueueRegistryService.name);
  private queues: Map<string, Queue> = new Map();
  private dlqs: Map<string, Queue> = new Map();

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
    @InjectQueue('ai:content:dlq') private aiContentDLQ: Queue,
    @InjectQueue('ai:seo:dlq') private aiSeoDLQ: Queue,
    @InjectQueue('ai:review:dlq') private aiReviewDLQ: Queue,
    @InjectQueue('workflows:run:dlq') private workflowsDLQ: Queue,
    @InjectQueue('plugins:execute:dlq') private pluginsDLQ: Queue,
    @InjectQueue('analytics:process:dlq') private analyticsProcessDLQ: Queue,
    @InjectQueue('analytics:snapshot:dlq') private analyticsSnapshotDLQ: Queue,
    @InjectQueue('email:send:dlq') private emailDLQ: Queue,
    @InjectQueue('otp:send:dlq') private otpDLQ: Queue,
    @InjectQueue('webhooks:deliver:dlq') private webhooksDLQ: Queue,
    @InjectQueue('media:optimize:dlq') private mediaDLQ: Queue,
    @InjectQueue('search:index:dlq') private searchDLQ: Queue,
  ) {
    this.registerQueue('ai:content', this.aiContentQueue);
    this.registerQueue('ai:seo', this.aiSeoQueue);
    this.registerQueue('ai:review', this.aiReviewQueue);
    this.registerQueue('workflows:run', this.workflowsQueue);
    this.registerQueue('plugins:execute', this.pluginsQueue);
    this.registerQueue('analytics:process', this.analyticsProcessQueue);
    this.registerQueue('analytics:snapshot', this.analyticsSnapshotQueue);
    this.registerQueue('email:send', this.emailQueue);
    this.registerQueue('otp:send', this.otpQueue);
    this.registerQueue('webhooks:deliver', this.webhooksQueue);
    this.registerQueue('media:optimize', this.mediaQueue);
    this.registerQueue('search:index', this.searchQueue);

    this.registerDLQ('ai:content', this.aiContentDLQ);
    this.registerDLQ('ai:seo', this.aiSeoDLQ);
    this.registerDLQ('ai:review', this.aiReviewDLQ);
    this.registerDLQ('workflows:run', this.workflowsDLQ);
    this.registerDLQ('plugins:execute', this.pluginsDLQ);
    this.registerDLQ('analytics:process', this.analyticsProcessDLQ);
    this.registerDLQ('analytics:snapshot', this.analyticsSnapshotDLQ);
    this.registerDLQ('email:send', this.emailDLQ);
    this.registerDLQ('otp:send', this.otpDLQ);
    this.registerDLQ('webhooks:deliver', this.webhooksDLQ);
    this.registerDLQ('media:optimize', this.mediaDLQ);
    this.registerDLQ('search:index', this.searchDLQ);

    this.logger.log('Queue Registry initialized with all queues');
  }

  private registerQueue(name: string, queue: Queue) {
    this.queues.set(name, queue);
  }

  private registerDLQ(name: string, queue: Queue) {
    this.dlqs.set(name, queue);
  }

  /**
   * Get queue instance by name
   */
  getQueue(name: string): Queue | undefined {
    return this.queues.get(name);
  }

  /**
   * Get all queues
   */
  getQueues(): Map<string, Queue> {
    return this.queues;
  }

  /**
   * Get DLQ instance by queue name
   */
  getDLQ(queueName: string): Queue | undefined {
    const dlqName = getDLQName(queueName);
    return this.dlqs.get(dlqName);
  }

  /**
   * Get all DLQs
   */
  getDLQs(): Map<string, Queue> {
    return this.dlqs;
  }

  /**
   * Close all queues
   */
  async close() {
    const closePromises = [];

    for (const [name, queue] of this.queues.entries()) {
      closePromises.push(
        queue.close()
          .then(() => this.logger.log(`Queue ${name} closed`))
          .catch(err => this.logger.error(`Failed to close queue ${name}:`, err)),
      );
    }

    for (const [name, queue] of this.dlqs.entries()) {
      closePromises.push(
        queue.close()
          .then(() => this.logger.log(`DLQ ${name} closed`))
          .catch(err => this.logger.error(`Failed to close DLQ ${name}:`, err)),
      );
    }

    await Promise.all(closePromises);
    this.logger.log('All queues and DLQs closed');
  }
}
