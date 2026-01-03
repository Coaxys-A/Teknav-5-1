import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AiValidationService } from '../ai-validation/ai-validation.service';
import { SeoService } from '../seo/seo.service';
import { WorkflowService } from '../workflows/workflow.service';

@Injectable()
export class AgentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiValidation: AiValidationService,
    private readonly seoService: SeoService,
    private readonly workflows: WorkflowService,
  ) {}

  async listAgents() {
    return (this.prisma as any).agent.findMany({ orderBy: { key: 'asc' } });
  }

  async runAgent(key: string) {
    const agent = await (this.prisma as any).agent.findUnique({ where: { key } });
    if (!agent || !agent.isActive) return { ok: false };
    const run = await (this.prisma as any).agentRun.create({
      data: {
        agentId: agent.id,
        runType: 'manual',
        status: 'running',
        startedAt: new Date(),
      },
    });
    try {
      let summary: any = {};
      if (key === 'content_guardian') {
        summary = await this.guardianAgent();
      } else if (key === 'seo_checker') {
        summary = await this.seoCheckerAgent();
      } else if (key === 'topic_gap') {
        summary = await this.topicGapAgent();
      }
      await (this.prisma as any).agentRun.update({
        where: { id: run.id },
        data: { status: 'completed', finishedAt: new Date(), outputSummary: summary as Prisma.InputJsonValue },
      });
      return { ok: true, summary };
    } catch (error) {
      await (this.prisma as any).agentRun.update({
        where: { id: run.id },
        data: { status: 'failed', errorMessage: (error as Error).message, finishedAt: new Date() },
      });
      return { ok: false, error: (error as Error).message };
    }
  }

  private async guardianAgent() {
    const recentArticles = await this.prisma.article.findMany({
      where: { status: 'PUBLISH', createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      take: 20,
    });
    const flagged: number[] = [];
    for (const art of recentArticles) {
      const score = this.seoService.calcSeoScore({
        content: art.content,
        metaTitle: art.metaTitle,
        metaDescription: art.metaDescription,
        mainKeyword: art.mainKeyword,
      });
      if (score < 40 || (art.content && art.content.toLowerCase().includes('spam'))) {
        await (this.prisma as any).articleQualityReport.create({
          data: { articleId: art.id, score, notes: 'پرچم شده توسط نگهبان محتوا به دلیل ریسک کیفیت یا اسپم' },
        });
        await this.workflows.start('ai.flagged_content', { article: art });
        flagged.push(art.id);
      }
    }
    return { flagged };
  }

  private async seoCheckerAgent() {
    const underperforming = await this.prisma.article.findMany({
      where: { status: 'PUBLISH' },
      take: 20,
    });
    for (const art of underperforming) {
      const score = this.seoService.calcSeoScore({
        content: art.content,
        metaTitle: art.metaTitle,
        metaDescription: art.metaDescription,
        mainKeyword: art.mainKeyword,
      });
      await (this.prisma as any).articleQualityReport.create({
        data: { articleId: art.id, score, notes: 'پایش خودکار سئو: نیاز به بهبود ساختار، تیتر و لینک‌سازی داخلی' },
      });
    }
    return { checked: underperforming.length };
  }

  private async topicGapAgent() {
    const ideas: any[] = [];
    const tags = ['فناوری', 'امنیت', 'تحلیل'];
    for (let i = 0; i < 3; i++) {
      const idea = await (this.prisma as any).contentIdea.create({
        data: {
          title: `ایده محتوای جدید ${i + 1}`,
          description: 'ایده پیشنهادی توسط عامل شکاف موضوعی',
          tags: tags as Prisma.InputJsonValue,
          status: 'draft',
        },
      });
      ideas.push(idea);
    }
    return { ideas: ideas.map((i) => i.id) };
  }
}
