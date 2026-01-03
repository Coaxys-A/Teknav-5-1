import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService, private readonly redis: RedisService) {}

  async overview() {
    const cacheKey = 'analytics:overview';
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;
    const [articles, searches, engagement] = await Promise.all([
      this.prisma.articleStatsDaily.count(),
      this.prisma.searchQueryStatsDaily.count(),
      this.prisma.userEngagementDaily.count(),
    ]);
    const snapshot = { articles, searches, engagement, ts: Date.now() };
    await this.redis.set(cacheKey, snapshot, 60);
    return snapshot;
  }

  async log(eventType: string, meta: any, userId?: number) {
    return this.prisma.analyticsEvent.create({ data: { eventType, meta, userId } });
  }

  async articleStats() {
    const cacheKey = 'analytics:article';
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;
    const rows = await this.prisma.articleStatsDaily.findMany({ take: 30, orderBy: { date: 'desc' } });
    await this.redis.set(cacheKey, rows, 60);
    return rows;
  }

  async searchStats() {
    const cacheKey = 'analytics:search';
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;
    const rows = await this.prisma.searchQueryStatsDaily.findMany({ take: 30, orderBy: { date: 'desc' } });
    await this.redis.set(cacheKey, rows, 60);
    return rows;
  }

  async engagementStats(limit = 30) {
    const cacheKey = `analytics:engagement:${limit}`;
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;
    const rows = await this.prisma.userEngagementDaily.findMany({ take: limit, orderBy: { date: 'desc' } });
    await this.redis.set(cacheKey, rows, 60);
    return rows;
  }

  async funnelSteps(limit = 30) {
    const cacheKey = `analytics:funnel:${limit}`;
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;
    const rows = await this.prisma.analyticsEvent.findMany({
      where: { eventType: { startsWith: 'funnel.' } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    await this.redis.set(cacheKey, rows, 60);
    return rows;
  }

  async retention(limit = 30) {
    const cacheKey = `analytics:retention:${limit}`;
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;
    const rows = await this.prisma.userEngagementDaily.findMany({
      orderBy: { date: 'desc' },
      take: limit,
    });
    await this.redis.set(cacheKey, rows, 60);
    return rows;
  }

  async crashLogs(limit = 50) {
    const cacheKey = `analytics:crashes:${limit}`;
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;
    const rows = await this.prisma.analyticsEvent.findMany({
      where: { eventType: 'crash' },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    await this.redis.set(cacheKey, rows, 30);
    return rows;
  }
}
