import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { Redis as UpstashRedis } from '@upstash/redis';

/**
 * Redis Service - Unified interface for ioredis protocol client and Upstash REST client
 * 
 * - Uses ioredis (protocol) for high-throughput operations
 * - Uses Upstash REST for cross-region operations when needed
 * - Falls back to in-memory if not configured
 */

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  
  private readonly client: Redis;           // ioredis protocol client
  private readonly upstash: UpstashRedis;     // Upstash REST client
  private readonly isUpstashEnabled: boolean;
  
  private isHealthy = true;
  private redisDownLoggedAt: number | null = null;

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!redisUrl && !upstashUrl) {
      this.logger.warn('Redis not configured. Caching will be disabled.');
      this.isHealthy = false;
      this.client = new Redis('memory');
      this.upstash = new UpstashRedis({
        url: 'http://localhost:7379',
        token: '',
      });
      this.isUpstashEnabled = false;
      return;
    }

    // Initialize ioredis client (protocol)
    this.client = new Redis(redisUrl || 'memory', {
      maxRetriesPerRequest: 3,
      retryStrategy: 'fast',
      enableReadyCheck: true,
      connectTimeout: 5000,
      lazyConnect: true,
    });

    // Initialize Upstash REST client (if credentials provided)
    if (upstashUrl && upstashToken) {
      this.upstash = new UpstashRedis({
        url: upstashUrl,
        token: upstashToken,
      });
      this.isUpstashEnabled = true;
      this.logger.log('Upstash REST client enabled');
    } else {
      this.upstash = new UpstashRedis({
        url: 'http://localhost:7379',
        token: '',
      });
      this.isUpstashEnabled = false;
    }

    this.client.on('error', (err) => {
      this.isHealthy = false;
      this.logRedisDown(err);
    });

    this.client.on('ready', () => {
      this.isHealthy = true;
      this.logger.log('Redis connection established');
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  /**
   * Use ioredis for GET operations (fast, protocol-based)
   */
  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (err) {
      this.logger.error(`Redis GET failed for key ${key}:`, err.message);
      return null;
    }
  }

  /**
   * Use ioredis for SET operations (fast, protocol-based)
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (err) {
      this.logger.error(`Redis SET failed for key ${key}:`, err.message);
    }
  }

  /**
   * Increment counter (for rate limiting)
   */
  async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch (err) {
      this.logger.error(`Redis INCR failed for key ${key}:`, err.message);
      return 0;
    }
  }

  /**
   * Use ioredis for DEL operations
   */
  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (err) {
      this.logger.error(`Redis DEL failed for key ${key}:`, err.message);
    }
  }

  /**
   * SCAN-based safe delete using ioredis
   */
  async delByPattern(pattern: string): Promise<number> {
    try {
      let cursor = '0';
      let deleted = 0;
      const limit = 100;

      do {
        const result = await this.client.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          limit.toString(),
        );
        cursor = result[0];
        const keys = result[1];

        if (keys.length > 0) {
          deleted += await this.client.del(...keys);
        }
      } while (cursor !== '0');

      return deleted;
    } catch (err) {
      this.logger.error(`Redis DEL BY PATTERN failed for ${pattern}:`, err.message);
      return 0;
    }
  }

  /**
   * PING using ioredis
   */
  async ping(): Promise<{ ok: boolean; latencyMs: number }> {
    try {
      const start = Date.now();
      await this.client.ping();
      const latencyMs = Date.now() - start;
      return { ok: true, latencyMs };
    } catch (err) {
      return { ok: false, latencyMs: 0 };
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      return (await this.client.exists(key)) === 1;
    } catch (err) {
      this.logger.error(`Redis EXISTS failed for key ${key}:`, err.message);
      return false;
    }
  }

  /**
   * Use Upstash REST for cross-region reads (optional)
   * Falls back to ioredis if not enabled
   */
  async getViaRest(key: string): Promise<string | null> {
    if (!this.isUpstashEnabled) {
      return await this.get(key);
    }

    try {
      const value = await this.upstash.get(key);
      return value;
    } catch (err) {
      this.logger.error(`Upstash REST GET failed for key ${key}:`, err.message);
      return null;
    }
  }

  /**
   * Use Upstash REST for cross-region writes (optional)
   * Falls back to ioredis if not enabled
   */
  async setViaRest(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (!this.isUpstashEnabled) {
      await this.set(key, value, ttlSeconds);
      return;
    }

    try {
      await this.upstash.set(key, value, { ex: ttlSeconds });
    } catch (err) {
      this.logger.error(`Upstash REST SET failed for key ${key}:`, err.message);
    }
  }

  /**
   * Check if Redis is available
   */
  isAvailable(): boolean {
    return this.isHealthy;
  }

  /**
   * Log Redis down only once per 5 minutes
   */
  private logRedisDown(error: any) {
    const now = Date.now();
    if (!this.redisDownLoggedAt || now - this.redisDownLoggedAt > 5 * 60 * 1000) {
      this.logger.error('Redis connection failed:', error.message);
      this.redisDownLoggedAt = now;
    }
  }
}

  /**
   * Get TTL of a key
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (err) {
      this.logger.error(`Redis TTL failed for key ${key}:`, err.message);
      return -1;
    }
  }
}
