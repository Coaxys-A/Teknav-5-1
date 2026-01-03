import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BullQueueService } from '../bullmq.service';
import { OtpService } from '../../auth/otp.service';
import { LoggingService } from '../../logging/logging.service';

@Injectable()
export class OtpProcessor implements OnModuleInit {
  private readonly logger = new Logger(OtpProcessor.name);

  constructor(
    private readonly bull: BullQueueService,
    private readonly otp: OtpService,
    private readonly logging: LoggingService,
  ) {}

  async onModuleInit() {
    this.bull.createWorker('otp', async (job) => this.handle(job));
  }

  async enqueue(data: { userId: number }) {
    await this.bull.addJob('otp', data, { attempts: 3 });
  }

  private async handle(job: { id: string; data: { userId: number } }) {
    try {
      await this.otp.createLoginOtp(job.data.userId);
      await this.bull.metrics('otp');
    } catch (error) {
      this.logger.error('OTP job failed', error as Error);
      await this.logging.logError('otp', error);
      throw error;
    }
  }
}
