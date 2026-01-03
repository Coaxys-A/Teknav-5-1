import { Injectable, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { QueueProducerService } from '../../../queue/queue-producer.service';
import { AuditLogService } from '../../../logging/audit-log.service';
import { PolicyService, Action, Resource, PolicyContext } from '../../../auth/policy/policy.service';
import { AuthContextService } from '../../../auth/auth-context.service';
import { z } from 'zod';

@Injectable()
export class ArticlesAutomationService {
  private readonly logger = new Logger(ArticlesAutomationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueProducer: QueueProducerService,
    private readonly auditLog: AuditLogService,
    private readonly policyService: PolicyService,
    private readonly authContext: AuthContextService,
  ) {}

  private async checkPolicy(req: any, action: Action, resource: Resource, resourceId?: number) {
    const authCtx = await this.authContext.getContext(req);
    const policyCtx: PolicyContext = {
      userId: authCtx.userId || 0,
      role: authCtx.role || 'GUEST',
      tenantId: authCtx.tenantId,
      workspaceId: authCtx.workspaceId,
      ip: req.ip,
      deviceId: authCtx.deviceId,
      sessionId: authCtx.sessionId,
    };
    await this.policyService.assert(policyCtx, action, resource, resourceId);
  }

  async generateDraft(params: {
    articleId: number;
    modelId: number;
  }) {
    const schema = z.object({
      articleId: z.number(),
      modelId: z.number(),
    });
    const validated = schema.parse(params);

    const article = await this.prisma.article.findUnique({
      where: { id: validated.articleId },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // Enqueue AI job
    await this.queueProducer.enqueueAIContentGeneration({
      tenantId: article.tenantId,
      workspaceId: article.workspaceId,
      articleId: validated.articleId,
      modelConfigId: validated.modelId,
      createdByUserId: 0, // System
    });

    await this.auditLog.logAction({
      actorId: 0,
      action: 'article.ai.draft.started',
      resource: 'Article',
      payload: { articleId: validated.articleId },
      ip: '127.0.0.1',
      ua: 'Automation Service',
    });

    return { data: { message: 'Draft generation started', jobId: `ai.content:${validated.articleId}` } };
  }

  async generateSeo(params: {
    articleId: number;
    locale: string;
  }) {
    const schema = z.object({
      articleId: z.number(),
      locale: z.string(),
    });
    const validated = schema.parse(params);

    const article = await this.prisma.article.findUnique({
      where: { id: validated.articleId },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    await this.queueProducer.enqueueAISeoOptimization({
      articleId: validated.articleId,
      localeCode: validated.locale,
      modelConfigId: 1,
    });

    return { data: { message: 'SEO optimization started' } };
  }

  async translate(params: {
    articleId: number;
    fromLocale: string;
    toLocale: string;
  }) {
    const schema = z.object({
      articleId: z.number(),
      fromLocale: z.string(),
      toLocale: z.string(),
    });
    const validated = schema.parse(params);

    await this.auditLog.logAction({
      actorId: 0,
      action: 'article.translation.started',
      resource: 'Article',
      payload: { articleId: validated.articleId },
      ip: '127.0.0.1',
      ua: 'Automation Service',
    });

    return { data: { message: 'Translation queued' } };
  }

  async submitForReview(req: any, params: {
    articleId: number;
  }) {
    await this.checkPolicy(req, Action.UPDATE, Resource.ARTICLE, params.articleId);

    const schema = z.object({
      articleId: z.number(),
    });
    const validated = schema.parse(params);

    const article = await this.prisma.article.findUnique({
      where: { id: validated.articleId },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const updated = await this.prisma.article.update({
      where: { id: validated.articleId },
      data: {
        status: 'SUBMITTED',
        reviewStatus: 'ENDING',
        submittedAt: new Date(),
      },
    });

    // Trigger workflow queue:workflows (article_auto_review)
    await this.queueProducer.enqueueWorkflowRun({
      workflowInstanceId: 0, // Placeholder
    });

    await this.auditLog.logAction({
      actorId: req.user?.id,
      action: 'article.submitted_for_review',
      resource: 'Article',
      payload: { articleId: validated.articleId },
      ip: req.ip,
      ua: req.ua,
    });

    return { data: updated };
  }

  async approve(req: any, params: {
    articleId: number;
  }) {
    await this.checkPolicy(req, Action.APPROVE, Resource.ARTICLE, params.articleId);

    const schema = z.object({
      articleId: z.number(),
    });
    const validated = schema.parse(params);

    const updated = await this.prisma.article.update({
      where: { id: validated.articleId },
      data: {
        status: 'READY_FOR_PUBLISH',
        reviewStatus: 'APPROVED',
        approvedAt: new Date(),
      },
    });

    await this.auditLog.logAction({
      actorId: req.user?.id,
      action: 'article.approved',
      resource: 'Article',
      payload: { articleId: validated.articleId },
      ip: req.ip,
      ua: req.ua,
    });

    return { data: updated };
  }

  async reject(req: any, params: {
    articleId: number;
    reason: string;
  }) {
    await this.checkPolicy(req, Action.UPDATE, Resource.ARTICLE, params.articleId);

    const schema = z.object({
      articleId: z.number(),
      reason: z.string(),
    });
    const validated = schema.parse(params);

    const updated = await this.prisma.article.update({
      where: { id: validated.articleId },
      data: {
        status: 'REJECTED',
        reviewStatus: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: validated.reason,
      },
    });

    await this.auditLog.logAction({
      actorId: req.user?.id,
      action: 'article.rejected',
      resource: 'Article',
      payload: { articleId: validated.articleId, reason: validated.reason },
      ip: req.ip,
      ua: req.ua,
    });

    return { data: updated };
  }

  async publishNow(req: any, params: {
    articleId: number;
    placement: string;
    featured: boolean;
  }) {
    await this.checkPolicy(req, Action.PUBLISH, Resource.ARTICLE, params.articleId);

    const schema = z.object({
      articleId: z.number(),
      placement: z.string(),
      featured: z.boolean(),
    });
    const validated = schema.parse(params);

    const article = await this.prisma.article.findUnique({
      where: { id: validated.articleId },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const tags = (article.tags as any) || {};
    tags.placement = validated.placement.split(',');
    tags.featured = validated.featured;

    const updated = await this.prisma.article.update({
      where: { id: validated.articleId },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        publishedById: req.user?.id,
        tags: tags as any,
      },
    });

    // Enqueue article.publish job
    await this.queueProducer.enqueueArticlePublish({
      articleId: validated.articleId,
      publisherId: req.user?.id,
      placement: validated.placement,
      featured: validated.featured,
    });

    await this.auditLog.logAction({
      actorId: req.user?.id,
      action: 'article.published_now',
      resource: 'Article',
      payload: {
        articleId: validated.articleId,
        placement: validated.placement,
        featured: validated.featured,
      },
      ip: req.ip,
      ua: req.ua,
    });

    return { data: updated };
  }

  async schedulePublish(req: any, params: {
    articleId: number;
    scheduledFor: string;
  }) {
    await this.checkPolicy(req, Action.PUBLISH, Resource.ARTICLE, params.articleId);

    const schema = z.object({
      articleId: z.number(),
      scheduledFor: z.string(),
    });
    const validated = schema.parse(params);

    const updated = await this.prisma.article.update({
      where: { id: validated.articleId },
      data: {
        status: 'SCHEDULED',
        scheduledFor: new Date(validated.scheduledFor),
      },
    });

    // Enqueue article.publish job at time
    await this.queueProducer.enqueueArticlePublish({
      articleId: validated.articleId,
      scheduledFor: validated.scheduledFor,
    });

    await this.auditLog.logAction({
      actorId: req.user?.id,
      action: 'article.scheduled_for_publish',
      resource: 'Article',
      payload: { articleId: validated.articleId, scheduledFor: validated.scheduledFor },
      ip: req.ip,
      ua: req.ua,
    });

    return { data: updated };
  }

  async getAuditTrail(articleId: number) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        resource: 'Article',
        action: {
          contains: 'article',
        },
        payload: {
          path: ['articleId'],
          equals: articleId,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return { data: logs };
  }
}
