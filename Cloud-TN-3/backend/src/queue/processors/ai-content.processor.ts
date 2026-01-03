import { Processor, ProcessLogger, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job, JobReturn } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../logging/audit-log.service';
import { DlqService } from '../dlq/dlq.service';
import { QueueMetricsService } from '../metrics/queue-metrics.service';
import { QueueService } from '../queue.service';
import { z } from 'zod';

/**
 * AI Content Processor
 *
 * Handles AI content generation jobs.
 * Job names:
 * - generate-draft: Generate article draft
 * - generate-summary: Generate article summary
 * - translate: Translate article content
 * - enhance-content: Enhance content with AI
 */

@Processor('ai:content')
export class AiContentProcessor {
  private readonly logger = new Logger(AiContentProcessor.name);

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
    this.metrics.publishJobEvent('ai:content', job.id!, 'completed');
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${job.name}`, error);
    this.metrics.publishJobEvent('ai:content', job.id!, 'failed', { error: error.message });

    // Move to DLQ if max attempts reached
    if (job.attemptsMade >= (job.opts.attempts || 5)) {
      this.moveToDLQ(job, error);
    }
  }

  /**
   * Process job
   */
  @Process('generate-draft')
  async handleGenerateDraft(job: Job) {
    this.logger.log(`Processing generate-draft job ${job.id}`);

    const schema = z.object({
      articleId: z.number(),
      userId: z.number(),
      tenantId: z.string(),
      model: z.string(),
      prompt: z.string(),
    });

    try {
      const data = schema.parse(job.data);

      // 1. Create AiRun record
      const aiRun = await this.prisma.aiRun.create({
        data: {
          tenantId: data.tenantId,
          userId: data.userId,
          model: data.model,
          input: data.prompt,
          type: 'generate-draft',
          status: 'in_progress',
        },
      });

      // 2. Call AI service (mock for now - in real implementation, use OpenAI/Anthropic)
      const result = await this.callAIService(data.model, data.prompt);

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

      // 4. Persist to AiDraft or ArticleVersion
      const aiDraft = await this.prisma.aiDraft.create({
        data: {
          articleId: data.articleId,
          userId: data.userId,
          tenantId: data.tenantId,
          aiRunId: aiRun.id,
          content: result.text,
          model: data.model,
          status: 'ready',
        },
      });

      // 5. Log audit
      await this.auditLog.logAction({
        actorUserId: data.userId,
        action: 'ai.content.generated',
        resource: 'Article',
        payload: {
          articleId: data.articleId,
          aiDraftId: aiDraft.id,
          model: data.model,
        },
      });

      // 6. Publish event (e.g., WebSocket)
      // For now, just log

      return { aiDraftId: aiDraft.id, aiRunId: aiRun.id };
    } catch (error) {
      this.logger.error(`Failed to process job ${job.id}:`, error);
      throw error;
    }
  }

  @Process('generate-summary')
  async handleGenerateSummary(job: Job) {
    this.logger.log(`Processing generate-summary job ${job.id}`);

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
          type: 'generate-summary',
          status: 'in_progress',
        },
      });

      // 2. Call AI service
      const result = await this.callAIService(data.model, `Summarize: ${data.content}`);

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

      // 4. Update Article (summary field)
      await this.prisma.article.update({
        where: { id: data.articleId },
        data: { summary: result.text },
      });

      // 5. Log audit
      await this.auditLog.logAction({
        actorUserId: data.userId,
        action: 'ai.summary.generated',
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

  @Process('translate')
  async handleTranslate(job: Job) {
    this.logger.log(`Processing translate job ${job.id}`);

    const schema = z.object({
      articleId: z.number(),
      userId: z.number(),
      tenantId: z.string(),
      model: z.string(),
      content: z.string(),
      targetLang: z.string(),
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
          type: 'translate',
          status: 'in_progress',
        },
      });

      // 2. Call AI service
      const result = await this.callAIService(data.model, `Translate to ${data.targetLang}: ${data.content}`);

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

      // 4. Persist to ArticleTranslation
      await this.prisma.articleTranslation.create({
        data: {
          articleId: data.articleId,
          language: data.targetLang,
          content: result.text,
          aiRunId: aiRun.id,
          createdAt: new Date(),
        },
      });

      // 5. Log audit
      await this.auditLog.logAction({
        actorUserId: data.userId,
        action: 'ai.translation.generated',
        resource: 'Article',
        payload: {
          articleId: data.articleId,
          aiRunId: aiRun.id,
          model: data.model,
          targetLang: data.targetLang,
        },
      });

      return { articleId: data.articleId, aiRunId: aiRun.id };
    } catch (error) {
      this.logger.error(`Failed to process job ${job.id}:`, error);
      throw error;
    }
  }

  @Process('enhance-content')
  async handleEnhanceContent(job: Job) {
    this.logger.log(`Processing enhance-content job ${job.id}`);

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
          type: 'enhance-content',
          status: 'in_progress',
        },
      });

      // 2. Call AI service
      const result = await this.callAIService(data.model, `Enhance: ${data.content}`);

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

      // 4. Update Article content
      await this.prisma.article.update({
        where: { id: data.articleId },
        data: { content: result.text },
      });

      // 5. Log audit
      await this.auditLog.logAction({
        actorUserId: data.userId,
        action: 'ai.content.enhanced',
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

  /**
   * Call AI Service (mock)
   * In production, call real AI service
   */
  private async callAIService(model: string, prompt: string): Promise<any> {
    // Mock AI service response
    // In production, use OpenAI/Anthropic
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay

    return {
      text: `AI response for model ${model}: ${prompt}`,
      tokens: 100,
      cost: 0.05,
    };
  }

  /**
   * Move job to DLQ
   */
  private async moveToDLQ(job: Job, error: Error) {
    await this.dlq.getDLQQueue('ai:content').add(
      'failed-job',
      {
        originalQueue: 'ai:content',
        originalJobId: job.id!,
        attemptsMade: job.attemptsMade,
        error: error.message,
        stack: error.stack,
        failedAt: new Date(),
        payload: job.data,
        traceId: (job.data as any).traceId,
      },
    );

    // Remove from main queue
    await job.remove();

    this.logger.log(`Moved job ${job.id} to DLQ`);
  }
}
