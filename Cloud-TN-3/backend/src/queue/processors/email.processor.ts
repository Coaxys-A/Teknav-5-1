import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BullQueueService } from '../bullmq.service';
import { LoggingService } from '../../logging/logging.service';
import { EmailService } from '../../email/email.service';

@Injectable()
export class EmailProcessor implements OnModuleInit {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    private readonly bull: BullQueueService,
    private readonly email: EmailService,
    private readonly logging: LoggingService,
  ) {}

  async onModuleInit() {
    this.bull.createWorker('email', async (job) => this.handle(job));
  }

  async enqueue(data: { to: string; subject: string; template: string; context?: any }) {
    await this.bull.addJob('email', data, { attempts: 5 });
  }

  private async handle(job: { id: string; data: { to: string; subject: string; template: string; context?: any } }) {
    try {
      await this.email.sendTemplate(job.data.to, job.data.template, job.data.context ?? {});
      await this.bull.metrics('email');
    } catch (error) {
      this.logger.error('Email job failed', error as Error);
      await this.logging.logError('email', error);
      throw error;
    }
  }
}
