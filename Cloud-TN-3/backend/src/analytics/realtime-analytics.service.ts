import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

/**
 * Realtime Analytics Service
 * 
 * SSE streaming via Redis pub/sub
 */

@Injectable()
export class RealtimeAnalyticsService {
  private readonly logger = new Logger(RealtimeAnalyticsService.name);
  private readonly CHANNEL = 'analytics:realtime';

  constructor(
    private readonly redis: RedisService,
  ) {}

  /**
   * Subscribe to realtime events (returns AsyncIterator for SSE)
   */
  async *subscribeToRealtimeEvents() {
    this.logger.debug('Client subscribed to realtime analytics');

    // In production, use Redis SUBSCRIBE to the channel
    // For now, simulate with polling every 5s

    while (true) {
      const stats = await this.getRealtimeStats();
      yield {
        type: 'stats',
        data: stats,
        timestamp: new Date(),
      };

      // Poll interval
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  /**
   * Get realtime stats from Redis counters
   */
  async getRealtimeStats() {
    const [views, clicks, searches, lastUpdatedStr] = await Promise.all([
      this.redis.get('analytics:rt:views'),
      this.redis.get('analytics:rt:clicks'),
      this.redis.get('analytics:rt:searches'),
      this.redis.get('analytics:rt:views:lastUpdated'),
    ]);

    const lastUpdated = lastUpdatedStr ? new Date(parseInt(lastUpdatedStr)) : new Date();

    return {
      totalViews: parseInt(views || '0'),
      totalClicks: parseInt(clicks || '0'),
      totalSearches: parseInt(searches || '0'),
      lastUpdated,
    };
  }

  /**
   * Publish realtime event
   */
  async publishEvent(event: any) {
    // Publish to Redis pub/sub channel
    await this.redis.set(`${this.CHANNEL}:latest`, JSON.stringify(event), 10);
  }
}
