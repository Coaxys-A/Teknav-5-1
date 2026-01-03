import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiMemoryService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertMemory(data: {
    workspaceId?: number;
    tenantId?: number;
    userId?: number;
    scope?: 'short' | 'mid' | 'long';
    source?: string;
    content: any;
    tags?: string[];
    importance?: number;
  }) {
    return this.prisma.aiMemory.create({
      data: {
        workspaceId: data.workspaceId,
        tenantId: data.tenantId,
        userId: data.userId,
        scope: data.scope ?? 'long',
        source: data.source ?? 'ai',
        content: data.content,
        tags: data.tags ?? [],
        importance: data.importance,
      },
    });
  }

  async list(workspaceId?: number, userId?: number, scope?: 'short' | 'mid' | 'long') {
    return this.prisma.aiMemory.findMany({
      where: { workspaceId, userId, scope: scope ?? undefined, deletedAt: null },
      orderBy: [{ importance: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  async retrieveForContext(opts: { workspaceId?: number; userId?: number; tags?: string[]; limit?: number }) {
    return this.prisma.aiMemory.findMany({
      where: {
        workspaceId: opts.workspaceId,
        userId: opts.userId,
        deletedAt: null,
        tags: opts.tags && opts.tags.length > 0 ? { hasSome: opts.tags } : undefined,
      },
      orderBy: [{ importance: 'desc' }, { updatedAt: 'desc' }],
      take: opts.limit ?? 12,
    });
  }

  async storeConversationMemory(input: {
    userId?: number;
    workspaceId?: number;
    tenantId?: number;
    role: 'user' | 'assistant';
    content: any;
    scope?: 'short' | 'mid' | 'long';
  }) {
    return this.upsertMemory({
      workspaceId: input.workspaceId,
      tenantId: input.tenantId,
      userId: input.userId,
      scope: input.scope ?? 'mid',
      source: `conversation.${input.role}`,
      content: input.content,
      tags: ['conversation'],
      importance: input.role === 'assistant' ? 0.4 : 0.6,
    });
  }

  async storeArticleContext(input: {
    workspaceId?: number;
    tenantId?: number;
    articleId: number;
    content: any;
    scope?: 'short' | 'mid' | 'long';
  }) {
    return this.upsertMemory({
      workspaceId: input.workspaceId,
      tenantId: input.tenantId,
      scope: input.scope ?? 'long',
      source: `article:${input.articleId}`,
      content: input.content,
      tags: ['article', String(input.articleId)],
      importance: 0.8,
    });
  }
}
