import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BullQueueService } from '../bullmq.service';
import { PluginEventDispatcherService } from '../../plugins/plugin-event-dispatcher.service';
import { LoggingService } from '../../logging/logging.service';

@Injectable()
export class PluginWebhookProcessor implements OnModuleInit {
  private readonly logger = new Logger(PluginWebhookProcessor.name);

  constructor(
    private readonly bull: BullQueueService,
    private readonly dispatcher: PluginEventDispatcherService,
    private readonly logging: LoggingService,
  ) {}

  async onModuleInit() {
    this.bull.createWorker('plugin-webhook', async (job) => this.handle(job));
  }

  async enqueue(data: { event: string; payload: any; tenantId?: number | null; workspaceId?: number | null }) {
    await this.bull.addJob('plugin-webhook', data, { attempts: 5 });
  }

  private async handle(job: { id: string; data: { event: string; payload: any; tenantId?: number | null; workspaceId?: number | null } }) {
    try {
      await this.dispatcher.dispatch(job.data.event, job.data.payload, job.data.tenantId, job.data.workspaceId);
      await this.bull.metrics('plugin-webhook');
    } catch (error) {
      this.logger.error('Plugin webhook job failed', error as Error);
      await this.logging.logError('plugin-webhook', error);
      throw error;
    }
  }
}
