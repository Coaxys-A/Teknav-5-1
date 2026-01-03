import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed, Job, JobReturn } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../logging/audit-log.service';
import { DlqService } from '../dlq/dlq.service';
import { QueueMetricsService } from '../metrics/queue-metrics.service';
import { QueueService } from '../queue.service';
import { z } from 'zod';

/**
 * AI SEO Processor
 *
 * Handles AI SEO generation jobs.
 * Job names:
 * - generate-seo: Generate SEO title/meta/keywords
 */

@Processor('ai:seo')
export class AiSeoProcessor {
  private readonly logger = new Logger(AiSeoProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly dlq: DlqService,
    private readonly metrics: QueueMetricsService,
    private readonly queueService: QueueService,
  ) {}

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`Job ${job.id} started: ${job.name}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(`Job ${job.id} completed: ${job.name}`);
    this.metrics.publishJobEvent('ai:seo', job.id!, 'completed');
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${job.name}`, error);
    this.metrics.publishJobEvent('ai:seo', job.id!, 'failed', { error: error.message });

    if (job.attemptsMade >= (job.opts.attempts || 5)) {
      this.moveToDLQ(job, error);
    }
  }

  @Process('generate-seo')
  async handleGenerateSeo(job: Job) {
    this.logger.log(`Processing generate-seo job ${job.id}`);

    const schema = z.object({
      articleId: z.number(),
      userId: z.number(),
      tenantId: z.string(),
      model: z.string(),
      content: z.string(),
    });

    try {
      const data = schema.parse(job.data);

      // 1. Create AiRun record
      const aiRun = await this.prisma.aiRun.create({
        data: {
          tenantId: data.tenantId,
          userId: data.userId,
          model: data.model,
          input: data.content,
          type: 'generate-seo',
          status: 'in_progress',
        },
      });

      // 2. Call AI Service (Mock)
      const result = await this.callAIService(data.model, `Generate SEO for: ${data.content}`);

      // 3. Update AiRun record
      await this.prisma.aiRun.update({
        where: { id: aiRun.id },
        data: {
          output: result.text,
          tokens: result.tokens,
          cost: result.cost,
          status: 'completed',
          completedAt: new Date(),
        },
      });

      // 4. Update Article SEO fields
      await this.prisma.article.update({
        where: { id: data.articleId },
        data: {
          seoTitle: result.seoTitle || result.text,
          metaDescription: result.seoMeta || result.text,
          keywords: result.keywords || [],
        },
      });

      // 5. Log Audit
      await this.auditLog.logAction({
        actorUserId: data.userId,
        action: 'ai.seo.generated',
        resource: 'Article',
        payload: {
          articleId: data.articleId,
          aiRunId: aiRun.id,
          model: data.model,
        },
      });

      return { articleId: data.articleId, aiRunId: aiRun.id };
    } catch (error) {
      this.logger.error(`Failed to process job ${job.id}:`, error);
      throw error;
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private async callAIService(model: string, prompt: string): Promise<any> {
    // Mock AI Service response
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      text: `AI SEO response for model ${model}: ${prompt}`,
      seoTitle: `Title from AI`,
      seoMeta: `Meta description from AI`,
      keywords: ['ai', 'seo', 'keyword'],
      tokens: 50,
      cost: 0.005,
    };
  }

  private async moveToDLQ(job: Job, error: Error) {
    await this.dlq.getDLQQueue('ai:seo').add(
      'failed-job',
      {
        originalQueue: 'ai:seo',
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
