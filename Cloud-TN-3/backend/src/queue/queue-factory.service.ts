import { Injectable, Logger } from '@nestjs/common';
import { Queue, QueueOptions, WorkerOptions } from 'bullmq';
import { QueueEvents } from 'bullmq';
import { QueueConnectionService } from './queue-connection.service';

/**
 * Queue Factory Service
 * 
 * Responsible for creating queues lazily, creating QueueEvents, and returning queue instances.
 */

@Injectable()
export class QueueFactoryService {
  private readonly logger = new Logger(QueueFactoryService.name);
  private readonly queues = new Map<string, Queue<any>>();
  private readonly PREFIX = process.env.REDIS_KEY_PREFIX || 'teknav';
  private readonly QUEUE_NAMES = [
    'ai.content',
    'ai.seo',
    'workflow.run',
    'plugin.execute',
    'analytics.process',
    'email.send',
    'otp.send',
  ];

  constructor(
    private readonly connection: QueueConnectionService,
  ) {}

  /**
   * Get or create queue
   */
  getQueue(name: string): Queue<any> {
    if (this.queues.has(name)) {
      return this.queues.get(name);
    }

    this.logger.debug(`Creating queue: ${name}`);
    const queue = this.createQueue(name);
    this.queues.set(name, queue);
    return queue;
  }

  /**
   * Get all queues
   */
  getAllQueues(): Queue<any>[] {
    return this.QUEUE_NAMES.map(name => this.getQueue(name));
  }

  /**
   * Create queue instance
   */
  private createQueue(name: string): Queue<any> {
    const queueName = `${this.PREFIX}:q:${name}`;

    const queueOptions: QueueOptions = {
      connection: this.connection.getRedis(),
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 10000, // 10s base
        },
        removeOnComplete: {
          age: 3600, // 1 hour
          count: 1000,
        },
        removeOnFail: false,
      },
    };

    const queue = new Queue(queueName, queueOptions);

    // Attach QueueEvents listeners
    const queueEvents = new QueueEvents(queue);

    // Log lifecycle events
    queueEvents.on('completed', async (job: any) => {
      this.logger.debug(`Job completed: ${job.id} in queue: ${name}`);
      // Update DB status (e.g., WorkflowStepExecution, EmailLog)
      // Implementation depends on job data
      if (name === 'workflow.run') {
        // Update WorkflowInstance status
      } else if (name === 'email.send') {
        // Update EmailLog status
      }
    });

    queueEvents.on('failed', async (job: any, error: any) => {
      this.logger.warn(`Job failed: ${job.id} in queue: ${name}, error: ${error.message}`);
      
      // Update DB status to failed
      if (name === 'workflow.run') {
        // Update WorkflowStepExecution status
      } else if (name === 'email.send') {
        // Update EmailLog status with error
      }
    });

    queueEvents.on('stalled', async (job: any) => {
      this.logger.warn(`Job stalled: ${job.id} in queue: ${name}`);
    });

    queueEvents.on('progress', async (job: any, progress: number) => {
      this.logger.debug(`Job progress: ${job.id} in queue: ${name}, progress: ${progress}%`);
    });

    return queue;
  }

  /**
   * Close all queues
   */
  async closeAll() {
    this.logger.debug('Closing all queues');
    const promises = Array.from(this.queues.values()).map(queue => queue.close());
    await Promise.all(promises);
    this.queues.clear();
  }

  /**
   * Obfuscate queue (DLQ) name
   */
  getDLQName(originalQueue: string): string {
    return `${this.PREFIX}:q:dlq`;
  }
}
