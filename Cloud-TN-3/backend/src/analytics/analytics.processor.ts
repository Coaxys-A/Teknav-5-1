import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type EventItem = { eventType: string; meta?: Record<string, unknown>; userId?: number; createdAt: Date };

@Injectable()
export class AnalyticsProcessor implements OnModuleInit {
  private readonly logger = new Logger(AnalyticsProcessor.name);
  private queue: EventItem[] = [];
  private timer: NodeJS.Timeout | null = null;
  private aggregateTimer: NodeJS.Timeout | null = null;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.timer = setInterval(() => this.flush().catch(() => {}), 2000);
    this.aggregateTimer = setInterval(() => this.aggregate().catch(() => {}), 60_000);
  }

  enqueue(item: EventItem) {
    this.queue.push(item);
  }

  private async flush() {
    const batch = this.queue.splice(0, this.queue.length);
    if (!batch.length) return;
    try {
      await this.prisma.analyticsEvent.createMany({
        data: batch.map((b) => ({
          eventType: b.eventType,
          meta: (b.meta as unknown as Prisma.InputJsonValue) ?? undefined,
          userId: b.userId ?? null,
          createdAt: b.createdAt,
        })),
      });
    } catch (error) {
      this.logger.error('Failed to persist analytics batch', error as Error);
    }
  }

  private async aggregate() {
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const events = await this.prisma.analyticsEvent.groupBy({
      by: ['eventType'],
      _count: { eventType: true },
      where: { createdAt: { gte: since } },
    });
    for (const ev of events) {
      await this.prisma.analyticsAggregate.upsert({
        where: { bucket_period_eventType: { bucket: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate(), new Date().getUTCHours(), 0, 0)), period: 'hour', eventType: ev.eventType } },
        update: { count: ev._count.eventType },
        create: {
          bucket: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate(), new Date().getUTCHours(), 0, 0)),
          period: 'hour',
          eventType: ev.eventType,
          count: ev._count.eventType,
        },
      });
    }
  }
}
