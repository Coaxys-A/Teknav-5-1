import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { WorkflowService } from '../workflows/workflow.service';

@Injectable()
export class SponsorshipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly workflows: WorkflowService,
  ) {}

  async assign(articleId: number, sponsor: { name: string; url?: string; logoUrl?: string; label?: string; startAt: Date; endAt: Date }, actorId?: number) {
    const article = await this.prisma.article.findUnique({ where: { id: articleId } });
    if (!article) throw new NotFoundException('ARTICLE_NOT_FOUND');
    const record = await this.prisma.sponsorship.create({
      data: {
        sponsor: sponsor.name,
        sponsorUrl: sponsor.url,
        logoUrl: sponsor.logoUrl,
        label: sponsor.label,
        articleId,
        startAt: sponsor.startAt,
        endAt: sponsor.endAt,
      },
    });
    await this.audit.log('sponsorship.assign', actorId, { articleId, sponsor: sponsor.name });
    await this.workflows.start('sponsorship.active', { articleId, sponsor: sponsor.name });
    return record;
  }

  async forArticle(articleId: number) {
    const now = new Date();
    return this.prisma.sponsorship.findFirst({
      where: { articleId, startAt: { lte: now }, endAt: { gte: now } },
    });
  }
}
