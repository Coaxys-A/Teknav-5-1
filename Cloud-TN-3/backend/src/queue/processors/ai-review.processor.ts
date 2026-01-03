import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed, Job } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../logging/audit-log.service';
import { DlqService } from '../dlq/dlq.service';
import { QueueMetricsService } from '../metrics/queue-metrics.service';
import { QueueService } from '../queue.service';
import { z } from 'zod';

/**
 * AI Review Processor
 *
 * Handles AI review jobs.
 * Job names:
 * - review-article: Run AI report + ArticleQualityReport and update reviewStatus/aiScore
 */

@Processor('ai:review')
export class AiReviewProcessor {
  private readonly logger = new Logger(AiReviewProcessor.name);

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
    this.metrics.publishJobEvent('ai:review', job.id!, 'completed');
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${job.name}`, error);
    this.metrics.publishJobEvent('ai:review', job.id!, 'failed', { error: error.message });

    if (job.attemptsMade >= (job.opts.attempts || 5)) {
      this.moveToDLQ(job, error);
    }
  }

  @Process('review-article')
  async handleReviewArticle(job: Job) {
    this.logger.log(`Processing review-article job ${job.id}`);

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
          type: 'review-article',
          status: 'in_progress',
        },
      });

      // 2. Call AI Service (Mock)
      const result = await this.callAIService(data.model, `Review: ${data.content}`);

      // 3. Create AIReport
      const aiReport = await this.prisma.aIReport.create({
        data: {
          articleId: data.articleId,
          aiRunId: aiRun.id,
          model: data.model,
          reportData: result.text,
          status: 'completed',
        },
      });

      // 4. Create ArticleQualityReport
      const qualityScore = Math.floor(Math.random() * 100); // Mock
      const qualityReport = await this.prisma.articleQualityReport.create({
        data: {
          articleId: data.articleId,
          aiReportId: aiReport.id,
          score: qualityScore,
          factors: {
            grammar: 80,
            readability: 90,
            seo: 70,
            engagement: 85,
          },
          status: 'completed',
        },
      });

      // 5. Update Article reviewStatus and aiScore
      await this.prisma.article.update({
        where: { id: data.articleId },
        data: {
          reviewStatus: qualityScore >= 80 ? 'approved' : 'needs_review',
          aiScore: qualityScore,
        },
      });

      // 6. Log Audit
      await this.auditLog.logAction({
        actorUserId: data.userId,
        action: 'ai.review.completed',
        resource: 'Article',
        payload: {
          articleId: data.articleId,
          aiRunId: aiRun.id,
          aiReportId: aiReport.id,
          qualityReportId: qualityReport.id,
          score: qualityScore,
        },
      });

      return { articleId: data.articleId, aiRunId: aiRun.id, aiReportId: aiReport.id, qualityReportId: qualityReport.id };
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
      text: `AI Review for model ${model}: ${prompt}`,
      tokens: 200,
      cost: 0.02,
    };
  }

  private async moveToDLQ(job: Job, error: Error) {
    await this.dlq.getDLQQueue('ai:review').add(
      'failed-job',
      {
        originalQueue: 'ai:review',
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
