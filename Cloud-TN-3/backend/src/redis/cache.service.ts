import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class CacheService {
  private readonly prefix = process.env.REDIS_KEY_PREFIX || 'teknav';
  private readonly env = process.env.NODE_ENV || 'dev';

  constructor(private readonly redis: RedisService) {}

  buildKey(...parts: string[]): string {
    return [this.prefix, this.env, ...parts].join(':');
  }

  buildVersionedKey(baseKey: string, version: string = 'v1'): string {
    return this.buildKey(baseKey, version);
  }

  async cacheGetJson<T>(key: string): Promise<T | null> {
    if (!this.redis.isAvailable()) {
      return null;
    }

    const value = await this.redis.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch (err) {
      console.error(`Cache parse failed for key ${key}:`, err);
      return null;
    }
  }

  async cacheSetJson(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    if (!this.redis.isAvailable()) {
      return false;
    }

    // Size protection: skip caching if payload > 512KB
    const serialized = JSON.stringify(value);
    if (serialized.length > 512 * 1024) {
      console.warn(`Cache payload too large for key ${key}: ${serialized.length} bytes`);
      return false;
    }

    try {
      await this.redis.set(key, serialized, ttlSeconds);
      return true;
    } catch (err) {
      console.error(`Cache set failed for key ${key}:`, err);
      return false;
    }
  }

  async cacheDel(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async cacheDelByPattern(pattern: string): Promise<number> {
    return await this.redis.delByPattern(pattern);
  }

  async cacheWrap<T>(
    key: string,
    ttlSeconds: number,
    fn: () => Promise<T>
  ): Promise<T> {
    if (!this.redis.isAvailable()) {
      return await fn();
    }

    // Try cache first
    const cached = await this.cacheGetJson<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - run function and store result
    const result = await fn();
    await this.cacheSetJson(key, result, ttlSeconds);
    return result;
  }

  async invalidateDomain(domain: string): Promise<void> {
    const pattern = this.buildKey(domain, '*');
    await this.cacheDelByPattern(pattern);
  }
}
