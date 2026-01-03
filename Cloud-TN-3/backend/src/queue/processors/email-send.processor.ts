import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed, Job } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../logging/audit-log.service';
import { DlqService } from '../dlq/dlq.service';
import { QueueMetricsService } from '../metrics/queue-metrics.service';

@Processor('email:send')
export class EmailSendProcessor {
  private readonly logger = new Logger(EmailSendProcessor.name);

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
    this.metrics.publishJobEvent('email:send', job.id!, 'completed');
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${job.name}`, error);
    this.metrics.publishJobEvent('email:send', job.id!, 'failed', { error: error.message });

    if (job.attemptsMade >= (job.opts.attempts || 5)) {
      this.moveToDLQ(job, error);
    }
  }

  @Process('send-email')
  async handleSendEmail(job: Job) {
    this.logger.log(`Processing send-email job ${job.id}`);

    try {
      const { userId, emailId, template } = job.data;

      // 1. Send email (mock)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 2. Update EmailLog status
      await this.prisma.emailQueue.update({
        where: { id: emailId },
        data: {
          status: 'sent',
          sentAt: new Date(),
        },
      });

      // 3. Log audit
      await this.auditLog.logAction({
        actorUserId: userId,
        action: 'email.sent',
        resource: 'Email',
        payload: { emailId, template },
      });

      return { emailId };
    } catch (error) {
      this.logger.error(`Failed to process job ${job.id}:`, error);
      throw error;
    }
  }

  private async moveToDLQ(job: Job, error: Error) {
    await this.dlq.getDLQQueue('email:send').add(
      'failed-job',
      {
        originalQueue: 'email:send',
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
