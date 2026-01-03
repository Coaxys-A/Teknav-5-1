import { Injectable, Logger } from '@nestjs/common';
import { Processor, ProcessError } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service';
import { QueueProducerService } from '../../queue-producer.service';
import { CacheInvalidationService } from '../../../cache/cache-invalidation.service';
import { AuditLogService } from '../../../logging/audit-log.service';

@Injectable()
export class ArticlePublishWorker {
  private readonly logger = new Logger(ArticlePublishWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueProducer: QueueProducerService,
    private readonly cacheInvalidation: CacheInvalidationService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Processor('publish-now')
  async handlePublishNow(job: Job) {
    const data = job.data;
    this.logger.debug(`Processing publish job: ${job.id}`);

    const article = await this.prisma.article.findUnique({
      where: { id: data.articleId },
    });

    if (!article) {
      throw new Error('Article not found');
    }

    const now = new Date();
    const updated = await this.prisma.article.update({
      where: { id: data.articleId },
      data: {
        status: 'PUBLISHED',
        publishedAt: now,
        autoPublished: true,
        reviewStatus: 'APPROVED',
        tags: { ...(article.tags || {}), placement: data.placement || 'home', featured: !!data.featured },
      },
    });

    await this.cacheInvalidation.invalidateArticleCaches(data.articleId);
    await this.queueProducer.enqueueSearchIndex({ articleId: data.articleId, locales: [article.localeCode || 'en'] });

    await this.auditLog.logAction({
      actorId: data.publisherId,
      action: 'article.published',
      resource: 'Article',
      payload: { articleId: data.articleId, placement: data.placement, featured: data.featured },
      ip: '127.0.0.1',
      ua: 'BullMQ Worker',
    });

    return { success: true, articleId: data.articleId };
  }

  @Processor('scheduled-publish')
  async handleScheduledPublish(job: Job) {
    const data = job.data;
    this.logger.debug(`Processing scheduled publish job: ${job.id}`);

    const article = await this.prisma.article.findUnique({
      where: { id: data.articleId },
    });

    if (!article) {
      throw new Error('Article not found');
    }

    const scheduledFor = new Date(data.scheduledFor);
    const now = new Date();

    if (scheduledFor <= now) {
      const updated = await this.prisma.article.update({
        where: { id: data.articleId },
        data: {
          status: 'PUBLISHED',
          publishedAt: now,
          autoPublished: true,
          reviewStatus: 'APPROVED',
        },
      });

      await this.cacheInvalidation.invalidateArticleCaches(data.articleId);
      await this.queueProducer.enqueueSearchIndex({ articleId: data.articleId, locales: [article.localeCode || 'en'] });

      await this.auditLog.logAction({
        actorId: 0,
        action: 'article.scheduled.published',
        resource: 'Article',
        payload: { articleId: data.articleId },
        ip: '127.0.0.1',
        ua: 'BullMQ Worker',
      });

      return { success: true, articleId: data.articleId };
    } else {
      this.logger.warn(`Scheduled time is in the future: ${scheduledFor}`);
      return { success: true, status: 'pending' };
    }
  }
}
