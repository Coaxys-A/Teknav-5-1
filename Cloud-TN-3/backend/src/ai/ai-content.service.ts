import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BullQueueService } from '../queue/bullmq.service';
import { AiEventService } from './ai-event.service';

@Injectable()
export class AiContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bull: BullQueueService,
    private readonly events: AiEventService,
  ) {}

  async analyzeArticle(body: any) {
    const { articleId, workspaceId, tenantId } = body;
    const task = await this.prisma.aiTask.create({
      data: {
        workspaceId,
        tenantId,
        type: 'content.analyze',
        payload: { articleId },
        status: 'pending',
      },
    });
    await this.bull.addJob('ai-content', { taskId: task.id }, { attempts: 3 });
    await this.events.log({
      taskId: task.id,
      workspaceId,
      tenantId,
      level: 'info',
      message: 'ai.content.enqueued',
      metadata: { articleId },
    });
    return { id: task.id, status: 'queued' };
  }
}
