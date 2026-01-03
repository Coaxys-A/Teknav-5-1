import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AggregationService {
  constructor(private readonly prisma: PrismaService) {}

  async aggregateDaily(date: Date = new Date()) {
    const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const next = new Date(target);
    next.setUTCDate(target.getUTCDate() + 1);

    const views = await this.prisma.analyticsEvent.groupBy({
      by: ['eventType', 'meta'],
      _count: true,
      where: { createdAt: { gte: target, lt: next } },
    });

    // Article stats
    for (const item of views) {
      const meta = (item.meta as any) ?? {};
      if (item.eventType === 'article_view' && meta.articleId) {
        await (this.prisma as any).articleStatsDaily.upsert({
          where: { articleId_date: { articleId: Number(meta.articleId), date: target } },
          update: { views: { increment: item._count }, uniqueUsers: { increment: 1 } },
          create: {
            articleId: Number(meta.articleId),
            date: target,
            views: item._count,
            uniqueUsers: 1,
            localeCode: meta.locale ?? null,
            avgReadDepth: meta.readDepth ?? 0,
            clicksOut: 0,
            conversions: 0,
            revenueEstimate: 0,
          },
        });
      }
      if (item.eventType === 'article_click' && meta.articleId) {
        await (this.prisma as any).articleStatsDaily.upsert({
          where: { articleId_date: { articleId: Number(meta.articleId), date: target } },
          update: { clicksOut: { increment: item._count } },
          create: {
            articleId: Number(meta.articleId),
            date: target,
            views: 0,
            uniqueUsers: 0,
            localeCode: meta.locale ?? null,
            avgReadDepth: 0,
            clicksOut: item._count,
            conversions: 0,
            revenueEstimate: 0,
          },
        });
      }
      if (item.eventType === 'article_conversion' && meta.articleId) {
        await (this.prisma as any).articleStatsDaily.upsert({
          where: { articleId_date: { articleId: Number(meta.articleId), date: target } },
          update: { conversions: { increment: item._count } },
          create: {
            articleId: Number(meta.articleId),
            date: target,
            views: 0,
            uniqueUsers: 0,
            localeCode: meta.locale ?? null,
            avgReadDepth: 0,
            clicksOut: 0,
            conversions: item._count,
            revenueEstimate: 0,
          },
        });
      }
      if (item.eventType === 'search' && meta.query) {
        const zero = meta.zeroResults ? 1 : 0;
        await (this.prisma as any).searchQueryStatsDaily.upsert({
          where: { queryText_date: { queryText: String(meta.query).toLowerCase(), date: target } },
          update: { searchCount: { increment: item._count }, zeroResultsRate: { increment: zero } },
          create: {
            queryText: String(meta.query).toLowerCase(),
            date: target,
            searchCount: item._count,
            zeroResultsRate: zero,
            clickThroughRate: 0,
          },
        });
      }
    }
    return { ok: true, date: target };
  }

  async getArticleStats(articleId: number, from?: Date, to?: Date) {
    return (this.prisma as any).articleStatsDaily.findMany({
      where: {
        articleId,
        ...(from && to ? { date: { gte: from, lte: to } } : {}),
      },
      orderBy: { date: 'desc' },
    });
  }
}
