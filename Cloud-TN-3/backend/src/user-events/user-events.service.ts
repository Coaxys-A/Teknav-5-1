import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TopicsService } from '../topics/topics.service';
import { MemoryGraphService } from '../memory-graph/memory-graph.service';
import { PersonalizationService } from '../personalization/personalization.service';
import { IdentityService } from '../identity/identity.service';

@Injectable()
export class UserEventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly topics: TopicsService,
    private readonly memory: MemoryGraphService,
    private readonly personalization: PersonalizationService,
    private readonly identity: IdentityService,
  ) {}

  async logEvent(data: { userId?: number; workspaceId?: number; eventType: string; entityType?: string; entityId?: number; context?: any }) {
    const evt = await (this.prisma as any).userEvent.create({
      data: {
        userId: data.userId ?? null,
        workspaceId: data.workspaceId ?? null,
        eventType: data.eventType,
        entityType: data.entityType ?? null,
        entityId: data.entityId ?? null,
        context: data.context ?? {},
      },
    });
    // Push to memory graph and personalization
    const tenantId = data.context?.tenantId ?? null;
    await this.memory.recordEvent({
      userId: data.userId ?? null,
      tenantId,
      type: data.eventType,
      payload: data.context ?? {},
      nodeLabel: `${data.entityType ?? 'evt'}:${data.entityId ?? ''}`,
      nodeType: data.entityType ?? 'event',
    });
    if (data.userId) {
      await this.personalization.updateRealtimeState(data.userId, tenantId, {
        lastEvent: data.eventType,
        entityType: data.entityType,
        entityId: data.entityId,
      });
      await this.identity.resolveIdentity(data.userId, tenantId);
    }
    return evt;
  }

  async recomputeInterest(userId: number, workspaceId?: number) {
    const events = await (this.prisma as any).userEvent.findMany({
      where: { userId, workspaceId: workspaceId ?? null },
      orderBy: { timestamp: 'desc' },
      take: 200,
    });
    const score: Record<string, number> = {};
    for (const ev of events) {
      const weight = ev.eventType === 'bookmark' ? 3 : ev.eventType === 'like' ? 2 : 1;
      if (ev.entityType === 'tag' && ev.context?.tag) {
        const key = `tag:${ev.context.tag}`;
        score[key] = (score[key] ?? 0) + weight;
      }
      if (ev.entityType === 'article' && ev.entityId) {
        const at = await (this.prisma as any).articleTopic.findMany({ where: { articleId: ev.entityId }, include: { topic: true } });
        for (const t of at) {
          const key = `topic:${t.topicId}`;
          score[key] = (score[key] ?? 0) + weight;
        }
      }
    }
    const vector = Object.entries(score)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([k, v]) => ({ k, v }));
    await (this.prisma as any).userInterestVector.upsert({
      where: { userId_workspaceId: { userId, workspaceId: workspaceId ?? null } },
      update: { vector, lastUpdatedAt: new Date() },
      create: { userId, workspaceId: workspaceId ?? null, vector },
    });
    return vector;
  }
}
