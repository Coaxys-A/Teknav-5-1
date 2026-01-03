import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed, Job } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../logging/audit-log.service';
import { DlqService } from '../dlq/dlq.service';
import { QueueMetricsService } from '../metrics/queue-metrics.service';

@Processor('otp:send')
export class OtpSendProcessor {
  private readonly logger = new Logger(OtpSendProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly dlq: DlqService,
    private readonly metrics: QueueMetricsService,
  ) {}

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`Job ${job.id} started: ${job.name}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(`Job ${job.id} completed: ${job.name}`);
    this.metrics.publishJobEvent('otp:send', job.id!, 'completed');
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${job.name}`, error);
    this.metrics.publishJobEvent('otp:send', job.id!, 'failed', { error: error.message });

    if (job.attemptsMade >= (job.opts.attempts || 5)) {
      this.moveToDLQ(job, error);
    }
  }

  @Process('send-otp')
  async handleSendOtp(job: Job) {
    this.logger.log(`Processing send-otp job ${job.id}`);

    try {
      const { userId, phoneNumber, otp, channel } = job.data;

      // 1. Send OTP (mock)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 2. Update OtpLog status
      await this.prisma.otpLog.updateMany({
        where: {
          userId,
          phoneNumber,
          status: 'pending',
        },
        data: {
          status: 'sent',
          sentAt: new Date(),
        },
      });

      // 3. Log audit
      await this.auditLog.logAction({
        actorUserId: userId,
        action: 'otp.sent',
        resource: 'Otp',
        payload: { phoneNumber, channel },
      });

      return { userId, phoneNumber };
    } catch (error) {
      this.logger.error(`Failed to process job ${job.id}:`, error);
      throw error;
    }
  }

  private async moveToDLQ(job: Job, error: Error) {
    await this.dlq.getDLQQueue('otp:send').add(
      'failed-job',
      {
        originalQueue: 'otp:send',
        originalJobId: job.id!,
        attemptsMade: job.attemptsMade,
        error: error.message,
        stack: error.stack,
        failedAt: new Date(),
        payload: job.data,
        traceId: (job.data as any).traceId,
      },
    );

    await job.remove();
    this.logger.log(`Moved job ${job.id} to DLQ`);
  }
}
