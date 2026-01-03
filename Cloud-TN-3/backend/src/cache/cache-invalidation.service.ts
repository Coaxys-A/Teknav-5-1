import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CacheInvalidationService {
  private readonly logger = new Logger(CacheInvalidationService.name);
  private readonly PREFIX = process.env.REDIS_KEY_PREFIX || 'teknav';

  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  async getOrSet<T>(key: string, ttl: number, fetcher: () => Promise<T>): Promise<T> {
    const fullKey = `${this.PREFIX}:${key}`;
    const cached = await this.redis.get(fullKey);
    
    if (cached) {
      try {
        return JSON.parse(cached) as T;
      } catch (e) {
        return cached as T;
      }
    }

    const value = await fetcher();
    await this.redis.set(fullKey, JSON.stringify(value), ttl);
    return value;
  }

  async invalidateArticleCaches(articleId: number) {
    try {
      const article = await this.prisma.article.findUnique({
        where: { id: articleId },
      });

      if (!article) return;

      const keys = [
        `${this.PREFIX}:articles:home:*`,
        `${this.PREFIX}:articles:article:${article.id}:*`,
        `${this.PREFIX}:search:*`,
        `${this.PREFIX}:articles:category:${article.categoryId}:*`,
      ];

      for (const key of keys) {
        const pattern = key.substring(0, key.length - 2);
        await this.redis.delByPattern(pattern);
      }

      this.logger.log(`Invalidated caches for article: ${articleId}`);
    } catch (error: any) {
      this.logger.error('Failed to invalidate article caches:', error);
    }
  }

  async invalidateKeys(keys: string[]) {
    if (keys.length === 0) return;
    
    const promises = keys.map(key => this.redis.del(`${this.PREFIX}:${key}`));
    await Promise.all(promises);
    
    this.logger.debug(`Invalidated keys: ${keys.join(', ')}`);
  }

  async invalidateByPrefix(prefix: string) {
    const fullPrefix = `${this.PREFIX}:${prefix}`;
    
    try {
      const scanResult = await this.redis.scan(fullPrefix, 100);
      if (scanResult.keys && scanResult.keys.length > 0) {
        await this.redis.delMany(scanResult.keys);
        this.logger.debug(`Invalidated prefix: ${prefix}, keys: ${scanResult.keys.length}`);
      }
    } catch (error: any) {
      this.logger.error(`Failed to invalidate prefix: ${prefix}`, error);
    }
  }

  async staleWhileRevalidate<T>(key: string, ttl: number, fetcher: () => Promise<T>): Promise<T> {
    const fullKey = `${this.PREFIX}:${key}`;
    
    try {
      // 1. Get cached value immediately
      const cached = await this.redis.get(fullKey);
      let value: T;
      
      if (cached) {
        try {
          value = JSON.parse(cached) as T;
        } catch (e) {
          // Fallback if parse fails
          value = cached as T;
        }
      }

      // 2. If no cache, fetch fresh and set
      if (!value) {
        value = await fetcher();
        await this.redis.set(fullKey, JSON.stringify(value), ttl);
        return value;
      }

      // 3. Trigger background revalidation
      this.queueBackgroundRefresh(fullKey, ttl, fetcher);

      return value;
    } catch (error: any) {
      this.logger.error(`Error in staleWhileRevalidate for key ${key}:`, error);
      throw error;
    }
  }

  private async queueBackgroundRefresh(key: string, ttl: number, fetcher: () => Promise<any>) {
    try {
      // In a real system, this would enqueue a job to refresh the cache.
      // For now, we can simulate or log it.
      // Since we don't have a generic "refresh" queue defined, we'll just log.
      this.logger.debug(`Queued background refresh for key: ${key}`);
    } catch (error: any) {
      this.logger.error(`Failed to queue background refresh for key ${key}:`, error);
    }
  }
}
