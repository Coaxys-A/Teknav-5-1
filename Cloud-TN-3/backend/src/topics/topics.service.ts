import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class TopicsService {
  constructor(private readonly prisma: PrismaService, private readonly ai: AiService) {}

  async list(workspaceId?: number) {
    return (this.prisma as any).topic.findMany({ where: { workspaceId: workspaceId ?? null } });
  }

  async related(workspaceId: number, slug: string) {
    const topic = await (this.prisma as any).topic.findFirst({ where: { slug, workspaceId: workspaceId ?? null } });
    if (!topic) return [];
    const rels = await (this.prisma as any).topicRelationship.findMany({ where: { sourceId: topic.id }, include: { target: true } });
    return rels.map((r: any) => r.target);
  }

  async articles(workspaceId: number, slug: string) {
    const topic = await (this.prisma as any).topic.findFirst({ where: { slug, workspaceId: workspaceId ?? null } });
    if (!topic) return [];
    const joins = await (this.prisma as any).articleTopic.findMany({ where: { topicId: topic.id }, include: { article: true } });
    return joins.map((j: any) => j.article);
  }

  async suggestForArticle(articleId: number) {
    const art = await this.prisma.article.findUnique({ where: { id: articleId }, include: { articleTags: { include: { tag: true } } } });
    if (!art) return [];
    const tagNames = art.articleTags.map((t) => t.tag.name);
    const topics = await (this.prisma as any).topic.findMany({ where: { name: { in: tagNames } } });
    return topics;
  }
}
