import { Injectable, Logger } from '@nestjs/common';
import { Queue, QueueOptions } from 'bullmq';
import { QueueEvents } from 'bullmq';
import { QueueConnectionService } from './queue-connection.service';
import { QueueRegistryService } from './queue.registry.service';

/**
 * Queue Factory Service
 * 
 * Responsible for creating queues lazily, creating QueueEvents, and returning queue instances.
 */

@Injectable()
export class QueueFactoryService {
  private readonly logger = new Logger(QueueFactoryService.name);
  private readonly queues = new Map<string, Queue<any>>();

  constructor(
    private readonly connection: QueueConnectionService,
    private readonly registry: QueueRegistryService,
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
   * Get queue by registry type
   */
  getQueueByType(type: keyof typeof this.registry.QUEUES): Queue<any> {
    const queueName = this.registry.getQueueName(type);
    return this.getQueue(queueName);
  }

  /**
   * Get all queues
   */
  getAllQueues(): Queue<any>[] {
    return this.registry.getAllQueueNames().map(name => this.getQueue(name));
  }

  /**
   * Create queue instance
   */
  private createQueue(name: string): Queue<any> {
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

    const queue = new Queue(name, queueOptions);

    // Attach QueueEvents listeners
    const queueEvents = new QueueEvents(queue);

    queueEvents.on('completed', async (job: any) => {
      this.logger.debug(`Job completed: ${job.id} in queue: ${name}`);
    });

    queueEvents.on('failed', async (job: any, error: any) => {
      this.logger.warn(`Job failed: ${job.id} in queue: ${name}, error: ${error.message}`);
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
}
