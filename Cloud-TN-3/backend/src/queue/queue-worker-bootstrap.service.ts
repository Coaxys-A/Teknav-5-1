import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { QueueFactoryService } from './queue.factory.service';
import { AiContentWorker } from './workers/ai-content.worker';
import { AiSeoWorker } from './workers/ai-seo.worker';
import { WorkflowWorker } from './workers/workflow.worker';
import { PluginExecuteWorker } from './workers/plugin-execute.worker';
import { AnalyticsProcessWorker } from './workers/analytics-process.worker';
import { EmailSendWorker } from './workers/email-send.worker';
import { OtpSendWorker } from './workers/otp-send.worker';
import { SearchIndexWorker } from './workers/search-index.worker';
import { ArticlePublishWorker } from './workers/article-publish.worker';
import { ArticleAutosaveWorker } from './workers/article-autosave.worker';
import { DlqService } from './dlq/dlq.service';

/**
 * Queue Worker Bootstrap Service
 * 
 * Initializes all workers on app start.
 */

@Injectable()
export class QueueWorkerBootstrapService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueWorkerBootstrapService.name);
  private readonly workers: any[] = [];

  constructor(
    private readonly queueFactory: QueueFactoryService,
    private readonly aiContentWorker: AiContentWorker,
    private readonly aiSeoWorker: AiSeoWorker,
    private readonly workflowWorker: WorkflowWorker,
    private readonly pluginExecuteWorker: PluginExecuteWorker,
    private readonly analyticsProcessWorker: AnalyticsProcessWorker,
    private readonly emailSendWorker: EmailSendWorker,
    private readonly otpSendWorker: OtpSendWorker,
    private readonly searchIndexWorker: SearchIndexWorker,
    private readonly articlePublishWorker: ArticlePublishWorker,
    private readonly articleAutosaveWorker: ArticleAutosaveWorker,
    private readonly dlqService: DlqService,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing BullMQ workers');

    await this.startWorker('ai.content', this.aiContentWorker, { concurrency: 2 });
    await this.startWorker('ai.seo', this.aiSeoWorker, { concurrency: 1 });
    await this.startWorker('workflows', this.workflowWorker, { concurrency: 5 });
    await this.startWorker('plugins', this.pluginExecuteWorker, { concurrency: 3 });
    await this.startWorker('analytics', this.analyticsProcessWorker, { concurrency: 2 });
    await this.startWorker('email', this.emailSendWorker, { concurrency: 5 });
    await this.startWorker('otp', this.otpSendWorker, { concurrency: 3 });
    await this.startWorker('search.index', this.searchIndexWorker, { concurrency: 2 });
    await this.startWorker('article.publish', this.articlePublishWorker, { concurrency: 2 });
    await this.startWorker('article.autosave', this.articleAutosaveWorker, { concurrency: 2 });

    // Start DLQ worker (centralized failure handler)
    await this.startDLQWorker();

    this.logger.log('All BullMQ workers initialized');
  }

  /**
   * Start individual worker
   */
  private async startWorker(queueName: string, processor: any, options: any = {}) {
    const queue = this.queueFactory.getQueueByType(queueName as any);

    const worker = new Worker(queue.name, processor, {
      connection: this.queueFactory['connection'].getRedis(),
      concurrency: options.concurrency || 1,
      ...options,
    });

    this.workers.push(worker);

    // Log worker events
    worker.on('completed', (job: any) => {
      this.logger.debug(`Job completed: ${job.id} in queue ${queueName}`);
    });

    worker.on('failed', (job: any, error: any) => {
      this.logger.warn(`Job failed: ${job.id} in queue ${queueName}, error: ${error.message}`);
    });

    worker.on('error', (error: any) => {
      this.logger.error(`Worker error in queue ${queueName}:`, error);
    });

    this.logger.log(`Worker started for queue: ${queueName}`);
  }

  /**
   * Start DLQ worker (centralized failure handler)
   */
  private async startDLQWorker() {
    const dlqQueue = this.queueFactory.getQueueByType('DLQ');

    const dlqProcessor = async (job: any) => {
      // DLQ jobs are stored permanently
      this.logger.log(`DLQ Job received: ${job.id}, originalQueue: ${job.data.originalQueue}`);
    };

    const worker = new Worker(dlqQueue.name, dlqProcessor, {
      connection: this.queueFactory['connection'].getRedis(),
      concurrency: 1,
    });

    this.workers.push(worker);

    this.logger.log('DLQ Worker started');
  }

  /**
   * Close all workers gracefully
   */
  async onModuleDestroy() {
    this.logger.log('Closing all BullMQ workers');
    const promises = this.workers.map(worker => worker.close());
    await Promise.all(promises);
    this.workers.length = 0;
  }
}
