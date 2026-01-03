import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed, Job } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../logging/audit-log.service';
import { DlqService } from '../dlq/dlq.service';
import { QueueMetricsService } from '../metrics/queue-metrics.service';
import { z } from 'zod';

/**
 * Search Processor
 *
 * Handles search indexing jobs.
 * Job names:
 * - index-article: Create/Update SearchDocument for Article
 */

@Processor('search:index')
export class SearchProcessor {
  private readonly logger = new Logger(SearchProcessor.name);

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
    this.metrics.publishJobEvent('search:index', job.id!, 'completed');
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${job.name}`, error);
    this.metrics.publishJobEvent('search:index', job.id!, 'failed', { error: error.message });

    if (job.attemptsMade >= (job.opts.attempts || 5)) {
      this.moveToDLQ(job, error);
    }
  }

  @Process('index-article')
  async handleIndexArticle(job: Job) {
    this.logger.log(`Processing index-article job ${job.id}`);

    const schema = z.object({
      articleId: z.number(),
      userId: z.number(),
      tenantId: z.string(),
    });

    try {
      const data = schema.parse(job.data);

      // 1. Get Article (with relations)
      const article = await this.prisma.article.findUnique({
        where: { id: data.articleId },
        include: { author: true },
      });

      if (!article) {
        throw new Error(`Article ${data.articleId} not found`);
      }

      // 2. Build SearchDocument (mock)
      const searchDocument = {
        id: `article:${data.articleId}`,
        title: article.title,
        content: article.content,
        type: 'article',
        tenantId: data.tenantId,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        authorId: article.authorId,
        metadata: {
          status: article.status,
          publishedAt: article.publishedAt,
          category: article.categoryId,
        },
      };

      // 3. Upsert to SearchDocument (mock)
      // In production, use Meilisearch or Elasticsearch
      // For now, we'll just write to a mock table (if exists) or AuditLog
      await this.prisma.searchDocument.upsert({
        where: {
          id_type: {
            id: searchDocument.id,
            type: searchDocument.type,
          },
        },
        create: {
          id: searchDocument.id,
          type: searchDocument.type,
          tenantId: searchDocument.tenantId,
          title: searchDocument.title,
          content: searchDocument.content,
          meta: searchDocument.metadata,
          authorId: searchDocument.authorId,
          createdAt: searchDocument.createdAt,
          updatedAt: searchDocument.updatedAt,
        },
        update: {
          title: searchDocument.title,
          content: searchDocument.content,
          meta: searchDocument.metadata,
          updatedAt: searchDocument.updatedAt,
        },
      });

      // 4. Log Audit
      await this.auditLog.logAction({
        actorUserId: data.userId,
        action: 'search.indexed',
        resource: 'Article',
        payload: {
          articleId: data.articleId,
          searchId: searchDocument.id,
        },
      });

      return { articleId: data.articleId, searchId: searchDocument.id };
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
    await this.dlq.getDLQQueue('search:index').add(
      'failed-job',
      {
        originalQueue: 'search:index',
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
