import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

/**
 * Rate Limit Service - Per-IP & Per-user rate limiting
 */

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);

  constructor(private readonly redis: RedisService) {}

  /**
   * Check rate limit for a key
   */
  async checkLimit(config: RateLimitConfig, key: string): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const cacheKey = this.getCacheKey(config.keyPrefix, key);
    const windowSeconds = Math.ceil(config.windowMs / 1000);

    // INCR current count
    const current = await this.redis.incr(cacheKey);
    
    // Set expiry on first request in window
    if (current === 1) {
      await this.redis.set(cacheKey, '1', windowSeconds);
    }

    const remaining = Math.max(0, config.maxRequests - current);
    const resetAt = Date.now() + config.windowMs;

    if (current > config.maxRequests) {
      this.logger.warn(`Rate limit exceeded for key ${key}: ${current} > ${config.maxRequests}`);
      return { allowed: false, remaining: 0, resetAt };
    }

    return { allowed: true, remaining, resetAt };
  }

  /**
   * Check and throw 429 if exceeded
   */
  async checkOrThrow(config: RateLimitConfig, key: string, errorMessage?: string): Promise<void> {
    const result = await this.checkLimit(config, key);
    
    if (!result.allowed) {
      throw new HttpException(
        errorMessage || 'Too many requests',
        HttpStatus.TOO_MANY_REQUESTS,
        {
          'X-RateLimit-Limit': config.maxRequests,
          'X-RateLimit-Remaining': result.remaining,
          'X-RateLimit-Reset': new Date(result.resetAt).toISOString(),
          'Retry-After': Math.ceil(config.windowMs / 1000).toString(),
        }
      );
    }
  }

  /**
   * Reset rate limit for a key (for testing or manual unban)
   */
  async resetLimit(config: RateLimitConfig, key: string): Promise<void> {
    const cacheKey = this.getCacheKey(config.keyPrefix, key);
    await this.redis.del(cacheKey);
    this.logger.debug(`Rate limit reset for key ${key}`);
  }

  /**
   * Get cache key for rate limit
   */
  private getCacheKey(prefix: string, key: string): string {
    return `ratelimit:${prefix}:${key}`;
  }

  /**
   * Default configurations
   */
  static readonly OWNER_PER_IP: RateLimitConfig = {
    windowMs: 60000, // 1 minute
    maxRequests: 120, // 2x regular limit for owners
    keyPrefix: 'owner:ip',
  };

  static readonly OWNER_PER_USER: RateLimitConfig = {
    windowMs: 60000, // 1 minute
    maxRequests: 120,
    keyPrefix: 'owner:user',
  };

  static readonly AUTH_PER_IP: RateLimitConfig = {
    windowMs: 60000, // 1 minute
    maxRequests: 10, // 10 login attempts per minute
    keyPrefix: 'auth:ip',
  };

  static readonly AI_PER_USER: RateLimitConfig = {
    windowMs: 60000, // 1 minute
    maxRequests: 30,
    keyPrefix: 'ai:user',
  };

  static readonly QUEUE_PER_IP: RateLimitConfig = {
    windowMs: 60000, // 1 minute
    maxRequests: 60,
    keyPrefix: 'queue:ip',
  };
}
