import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class AiTemplatesService {
  constructor(private readonly prisma: PrismaService, private readonly ai: AiService) {}

  async createTemplate(workspaceId: number, dto: { name: string; description?: string; type: string; parameters?: any; createdById?: number }) {
    return (this.prisma as any).aiTemplate.create({
      data: {
        workspaceId,
        name: dto.name,
        description: dto.description,
        type: dto.type,
        parameters: dto.parameters ?? {},
        createdById: dto.createdById ?? null,
      },
    });
  }

  async listTemplates(workspaceId: number) {
    return (this.prisma as any).aiTemplate.findMany({ where: { workspaceId }, orderBy: { createdAt: 'desc' } });
  }

  async runTemplate(workspaceId: number, templateId: number, payload: { content?: string; topic?: string; keyword?: string; articleId?: number; userId?: number }) {
    const template = await (this.prisma as any).aiTemplate.findFirst({ where: { id: templateId, workspaceId } });
    if (!template) throw new NotFoundException('TEMPLATE_NOT_FOUND');
    const type = template.type;
    if (type === 'outline' && payload.topic) {
      const outline = await this.ai.outline(payload.topic, payload.userId);
      await (this.prisma as any).aiDraft.create({
        data: { workspaceId, articleId: payload.articleId ?? null, content: outline.join('\n'), meta: { type }, createdById: payload.userId ?? null },
      });
      return { result: outline };
    }
    if (type === 'rewrite' && payload.content) {
      const text = await this.ai.rewrite(payload.content, payload.userId);
      await (this.prisma as any).aiDraft.create({
        data: { workspaceId, articleId: payload.articleId ?? null, content: text, meta: { type }, createdById: payload.userId ?? null },
      });
      return { result: text };
    }
    if (type === 'meta_description' && payload.content) {
      const meta = await this.ai.suggestMetadata(payload.content, payload.userId);
      await (this.prisma as any).aiDraft.create({
        data: {
          workspaceId,
          articleId: payload.articleId ?? null,
          content: `${meta.title}\n${meta.metaDescription}`,
          meta: { type, meta },
          createdById: payload.userId ?? null,
        },
      });
      return { result: meta };
    }
    return { result: null };
  }
}
