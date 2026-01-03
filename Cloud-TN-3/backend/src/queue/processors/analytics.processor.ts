import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BullQueueService } from '../bullmq.service';
import { PrismaService } from '../../prisma/prisma.service';
import { LoggingService } from '../../logging/logging.service';

@Injectable()
export class AnalyticsProcessor implements OnModuleInit {
  private readonly logger = new Logger(AnalyticsProcessor.name);

  constructor(
    private readonly bull: BullQueueService,
    private readonly prisma: PrismaService,
    private readonly logging: LoggingService,
  ) {}

  async onModuleInit() {
    this.bull.createWorker('analytics', async (job) => this.handle(job));
  }

  async enqueue(data: { scope: string; payload?: any }) {
    await this.bull.addJob('analytics', data, { attempts: 3 });
  }

  private async handle(job: { id: string; data: { scope: string; payload?: any } }) {
    try {
      await this.prisma.analyticsEvent.create({
        data: {
          eventType: `queue:${job.data.scope}`,
          payload: job.data.payload ?? {},
        } as any,
      });
      await this.bull.metrics('analytics');
    } catch (error) {
      this.logger.error('Analytics job failed', error as Error);
      await this.logging.logError('analytics', error);
      throw error;
    }
  }
}
