import { Injectable, Logger } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { AuditService } from '../audit/audit.service';
import { SearchService } from '../search/search.service';

type StepContext = { [key: string]: any };

type StepHandler = (ctx: StepContext) => Promise<{ output?: any; stop?: boolean }>;

@Injectable()
export class WorkflowRegistry {
  private readonly logger = new Logger(WorkflowRegistry.name);
  private handlers = new Map<string, StepHandler>();

  constructor(
    private readonly notifications: NotificationsService,
    private readonly ai: AiService,
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
    private readonly audit: AuditService,
    private readonly search: SearchService,
  ) {
    this.registerDefaults();
  }

  private registerDefaults() {
    this.handlers.set('notify_editor', async (ctx) => {
      await this.notifications.createForRole('EDITOR', 'مقاله جدید برای بررسی', ctx?.article?.title ?? '', `/dashboard/admin`);
      return {};
    });

    this.handlers.set('notify_creator_status_change', async (ctx) => {
      if (!ctx?.article?.authorId) return {};
      await this.notifications.createNotification(
        ctx.article.authorId,
        'وضعیت مقاله',
        `وضعیت مقاله به ${ctx.article.status} تغییر کرد.`,
        `/articles/${ctx.article.slug}`,
      );
      return {};
    });

    this.handlers.set('auto_tag_article', async (ctx) => {
      if (!ctx?.article?.id || !ctx?.article?.content) return {};
      const meta = await this.ai.suggestMetadata(ctx.article.content, ctx.article.authorId);
      await this.prisma.article.update({
        where: { id: ctx.article.id },
        data: { tags: meta.keywords as any, metaTitle: meta.title, metaDescription: meta.metaDescription },
      });
      return { output: meta };
    });

    this.handlers.set('schedule_social_share', async (ctx) => {
      await this.queue.enqueue({ type: 'social.share', payload: ctx });
      return {};
    });

    this.handlers.set('update_search_index', async (ctx) => {
      if (ctx?.article?.id) {
        await this.search.indexArticle(ctx.article.id, ctx?.locale ?? ctx?.article?.locale);
        await this.audit.log('search.index', ctx?.actorId, { articleId: ctx?.article?.id });
      }
      return {};
    });

    this.handlers.set('trigger_webhooks', async (ctx) => {
      await this.queue.enqueue({ type: 'webhook.dispatch', payload: ctx });
      return {};
    });
  }

  async execute(stepKey: string, ctx: StepContext) {
    const handler = this.handlers.get(stepKey);
    if (!handler) {
      this.logger.warn(`No handler for step ${stepKey}`);
      return { output: null };
    }
    return handler(ctx);
  }
}
