import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed, Job } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../logging/audit-log.service';
import { DlqService } from '../dlq/dlq.service';
import { QueueMetricsService } from '../metrics/queue-metrics.service';
import { z } from 'zod';

@Processor('webhooks:deliver')
export class WebhookProcessor {
  private readonly logger = new Logger(WebhookProcessor.name);

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
    this.metrics.publishJobEvent('webhooks:deliver', job.id!, 'completed');
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${job.name}`, error);
    this.metrics.publishJobEvent('webhooks:deliver', job.id!, 'failed', { error: error.message });

    if (job.attemptsMade >= (job.opts.attempts || 5)) {
      this.moveToDLQ(job, error);
    }
  }

  @Process('deliver-webhook')
  async handleDeliverWebhook(job: Job) {
    this.logger.log(`Processing deliver-webhook job ${job.id}`);

    const schema = z.object({
      endpointId: z.number(),
      payload: z.any(),
      userId: z.number(),
      tenantId: z.string(),
    });

    try {
      const data = schema.parse(job.data);

      // 1. Get Endpoint
      const endpoint = await this.prisma.webhookEndpoint.findUnique({
        where: { id: data.endpointId },
      });

      if (!endpoint) {
        throw new Error(`Webhook endpoint ${data.endpointId} not found`);
      }

      // 2. Log delivery start
      await this.prisma.webhookDeliveryLog.create({
        data: {
          endpointId: data.endpointId,
          tenantId: data.tenantId,
          payload: data.payload,
          status: 'in_progress',
          attempts: job.attemptsMade,
        },
      });

      // 3. Send request (using fetch)
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Teknav-Webhooks/1.0',
        },
        body: JSON.stringify(data.payload),
      });

      const statusCode = response.status;

      // 4. Log delivery result
      await this.prisma.webhookDeliveryLog.updateMany({
        where: {
          endpointId: data.endpointId,
          status: 'in_progress',
        },
        data: {
          status: statusCode >= 200 && statusCode < 300 ? 'delivered' : 'failed',
          statusCode,
          responseBody: await response.text(),
          completedAt: new Date(),
        },
      });

      // 5. Audit Log
      await this.auditLog.logAction({
        actorUserId: data.userId,
        action: 'webhook.delivered',
        resource: 'Webhook',
        payload: {
          endpointId: data.endpointId,
          statusCode,
        },
      });

      if (statusCode >= 200 && statusCode < 300) {
        return { delivered: true, statusCode };
      } else {
        throw new Error(`Webhook delivery failed with status ${statusCode}`);
      }
    } catch (error) {
      this.logger.error(`Failed to process job ${job.id}:`, error);
      throw error;
    }
  }

  private async moveToDLQ(job: Job, error: Error) {
    await this.dlq.getDLQQueue('webhooks:deliver').add(
      'failed-job',
      {
        originalQueue: 'webhooks:deliver',
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
