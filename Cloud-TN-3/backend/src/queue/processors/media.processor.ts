import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed, Job } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../logging/audit-log.service';
import { DlqService } from '../dlq/dlq.service';
import { QueueMetricsService } from '../metrics/queue-metrics.service';
import { z } from 'zod';

/**
 * Media Processor
 *
 * Handles media optimization jobs.
 * Job names:
 * - optimize-image: Optimize image, generate size variants, update File record
 */

@Processor('media:optimize')
export class MediaProcessor {
  private readonly logger = new Logger(MediaProcessor.name);

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
    this.metrics.publishJobEvent('media:optimize', job.id!, 'completed');
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${job.name}`, error);
    this.metrics.publishJobEvent('media:optimize', job.id!, 'failed', { error: error.message });

    if (job.attemptsMade >= (job.opts.attempts || 5)) {
      this.moveToDLQ(job, error);
    }
  }

  @Process('optimize-image')
  async handleOptimizeImage(job: Job) {
    this.logger.log(`Processing optimize-image job ${job.id}`);

    const schema = z.object({
      fileId: z.number(),
      userId: z.number(),
      tenantId: z.string(),
    });

    try {
      const data = schema.parse(job.data);

      // 1. Get File
      const file = await this.prisma.file.findUnique({
        where: { id: data.fileId },
      });

      if (!file) {
        throw new Error(`File ${data.fileId} not found`);
      }

      // 2. Optimize image (mock)
      // In production, use Sharp or ImageMagick
      const optimizedUrl = `${file.url}?optimized=1`; // Mock
      const sizeVariantUrl = `${file.url}?variant=small`; // Mock

      // 3. Update File record
      await this.prisma.file.update({
        where: { id: data.fileId },
        data: {
          meta: {
            ...file.meta,
            optimized: true,
            optimizedUrl,
            sizeVariantUrl,
            optimizedAt: new Date(),
          },
        },
      });

      // 4. Log Audit
      await this.auditLog.logAction({
        actorUserId: data.userId,
        action: 'media.optimized',
        resource: 'File',
        payload: {
          fileId: data.fileId,
          originalUrl: file.url,
          optimizedUrl,
        },
      });

      return { fileId: data.fileId, optimizedUrl };
    } catch (error) {
      this.logger.error(`Failed to process job ${job.id}:`, error);
      throw error;
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  /**
   * Move job to DLQ
   */
  private async moveToDLQ(job: Job, error: Error) {
    await this.dlq.getDLQQueue('media:optimize').add(
      'failed-job',
      {
        originalQueue: 'media:optimize',
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
