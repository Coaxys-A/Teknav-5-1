import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { ConfigService } from '@nestjs/config';

/**
 * Redis Session Cache
 * 
 * Caches session data with TTL.
 */

@Injectable()
export class SessionCacheService {
  private readonly logger = new Logger(SessionCacheService.name);
  private readonly PREFIX = process.env.REDIS_KEY_PREFIX || 'teknav';

  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Set session in cache
   */
  async setSession(sessionId: string, data: any) {
    const key = this.getRedisKey(sessionId);
    const ttl = this.getSessionTTL();
    
    await this.redis.set(key, JSON.stringify(data), ttl);
    this.logger.debug(`Session cached: ${sessionId}`);
  }

  /**
   * Get session from cache
   */
  async getSession(sessionId: string): Promise<any | null> {
    const key = this.getRedisKey(sessionId);
    const data = await this.redis.get(key);
    
    if (!data) return null;
    
    try {
      return JSON.parse(data);
    } catch (error) {
      this.logger.error('Failed to parse session data from Redis:', error);
      return null;
    }
  }

  /**
   * Invalidate session
   */
  async invalidateSession(sessionId: string) {
    const key = this.getRedisKey(sessionId);
    await this.redis.del(key);
    this.logger.debug(`Session invalidated: ${sessionId}`);
  }

  /**
   * Get Redis key for session
   */
  private getRedisKey(sessionId: string): string {
    return `${this.PREFIX}:sess:${sessionId}`;
  }

  /**
   * Get session TTL
   */
  private getSessionTTL(): number {
    return this.config.get('REFRESH_TOKEN_TTL_SECONDS', 604800); // 7 days
  }
}
