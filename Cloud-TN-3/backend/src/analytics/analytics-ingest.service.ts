import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RateLimitService } from '../security/rate-limit/rate-limit.service';
import { AnalyticsEventBatchSchema, AnalyticsEventInput } from './analytics-ingest.schema';

@Injectable()
export class AnalyticsIngestService {
  private readonly logger = new Logger(AnalyticsIngestService.name);
  private readonly MAX_BATCH_SIZE = 100;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly rateLimit: RateLimitService,
  ) {}

  /**
   * Ingest batched analytics events
   */
  async ingestBatch(events: AnalyticsEventInput[]) {
    // Rate limit check (per-IP)
    const ip = 'unknown'; // In production, extract from request context
    await this.rateLimit.checkOrThrow({
      key: `analytics:ingest:${ip}`,
      limit: 60,
      windowMs: 60000,
    });

    // Validate batch size
    if (events.length > this.MAX_BATCH_SIZE) {
      throw new HttpException(
        `Batch size exceeds maximum of ${this.MAX_BATCH_SIZE}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Sanitize events (strip secrets/tokens from meta)
    const sanitizedEvents = events.map(event => this.sanitizeEvent(event));

    // Set timestamps if missing (use server time)
    const now = new Date();
    const eventsWithTimestamp = sanitizedEvents.map(event => ({
      ...event,
      timestamp: event.timestamp || now.toISOString(),
    }));

    try {
      // Write to AnalyticsEvent table
      await this.prisma.analyticsEvent.createMany({
        data: eventsWithTimestamp.map(e => ({
          eventType: e.eventType,
          userId: e.userId,
          articleId: e.articleId,
          path: e.path,
          referrer: e.referrer,
          device: e.device,
          locale: e.locale,
          meta: e.meta,
          timestamp: new Date(e.timestamp),
          ingestedAt: now,
        })),
      });

      // Optionally write to UserEvent for authenticated users
      const userEvents = eventsWithTimestamp.filter(e => e.userId);
      if (userEvents.length > 0) {
        await this.prisma.userEvent.createMany({
          data: userEvents.map(e => ({
            userId: e.userId,
            eventType: e.eventType,
            path: e.path,
            articleId: e.articleId,
            timestamp: new Date(e.timestamp),
            meta: e.meta,
          })),
        });
      }

      // Update Redis realtime counters
      await this.updateRealtimeCounters(sanitizedEvents);

      return { success: true, ingested: events.length };
    } catch (error) {
      this.logger.error('Failed to ingest analytics events:', error);
      throw new HttpException(
        'Failed to ingest analytics events',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Sanitize event (remove sensitive data from meta)
   */
  private sanitizeEvent(event: AnalyticsEventInput): AnalyticsEventInput {
    if (!event.meta) {
      return event;
    }

    const sanitizedMeta: Record<string, any> = {};
    for (const [key, value] of Object.entries(event.meta)) {
      // Remove tokens, passwords, secrets from meta
      if (typeof value === 'string' && (
        value.toLowerCase().includes('token') ||
        value.toLowerCase().includes('password') ||
        value.toLowerCase().includes('secret') ||
        value.toLowerCase().includes('api_key')
      )) {
        sanitizedMeta[key] = '[REDACTED]';
      } else {
        sanitizedMeta[key] = value;
      }
    }

    return { ...event, meta: sanitizedMeta };
  }

  /**
   * Update Redis realtime counters
   */
  private async updateRealtimeCounters(events: AnalyticsEventInput[]) {
    const pipeline = this.redis.getPipeline();

    for (const event of events) {
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;

      // views counter
      if (event.eventType === 'page_view' || event.eventType === 'article_view') {
        const key = 'analytics:rt:views';
        await pipeline.incr(key);
        await pipeline.expire(key, 3600); // 1 hour TTL
        await pipeline.set('analytics:rt:views:lastUpdated', now.toString());
      }

      // clicks counter (external only)
      if (event.eventType === 'click') {
        const destination = event.meta?.destination;
        if (destination && this.isExternalUrl(destination)) {
          const key = 'analytics:rt:clicks';
          await pipeline.incr(key);
          await pipeline.expire(key, 3600);
          await pipeline.set('analytics:rt:clicks:lastUpdated', now.toString());
        }
      }

      // searches counter
      if (event.eventType === 'search') {
        const key = 'analytics:rt:searches';
        await pipeline.incr(key);
        await pipeline.expire(key, 3600);
        await pipeline.set('analytics:rt:searches:lastUpdated', now.toString());
      }
    }

    await this.redis.execPipeline(pipeline);
  }

  /**
   * Check if URL is external
   */
  private isExternalUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.hostname !== window.location.hostname;
    } catch {
      return true;
    }
  }

  /**
   * Get realtime counts
   */
  async getRealtimeCounts() {
    const pipeline = this.redis.getPipeline();
    
    const [views, clicks, searches] = await Promise.all([
      pipeline.get('analytics:rt:views'),
      pipeline.get('analytics:rt:clicks'),
      pipeline.get('analytics:rt:searches'),
    ]);

    const [viewsLastUpdated, clicksLastUpdated, searchesLastUpdated] = await Promise.all([
      pipeline.get('analytics:rt:views:lastUpdated'),
      pipeline.get('analytics:rt:clicks:lastUpdated'),
      pipeline.get('analytics:rt:searches:lastUpdated'),
    ]);

    await this.redis.execPipeline(pipeline);

    return {
      totalViews: parseInt(views || '0'),
      totalClicks: parseInt(clicks || '0'),
      totalSearches: parseInt(searches || '0'),
      lastUpdated: new Date(Math.max(
        viewsLastUpdated ? parseInt(viewsLastUpdated) : 0,
        clicksLastUpdated ? parseInt(clicksLastUpdated) : 0,
        searchesLastUpdated ? parseInt(searchesLastUpdated) : 0,
      )),
    };
  }
}
