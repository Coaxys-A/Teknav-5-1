import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

/**
 * Abuse Detection Service
 *
 * Handles:
 * - API Token abuse counters (Redis)
 * - Per-IP rate limit counters (Redis)
 * - Per-User brute force counters (Redis)
 * - Temporary bans (Redis)
 *
 * Uses Redis keys with TTL.
 */

@Injectable()
export class AbuseDetectionService {
  private readonly logger = new Logger(AbuseDetectionService.name);
  private readonly REDIS_PREFIX = process.env.REDIS_KEY_PREFIX || 'q';
  private readonly BAN_TTL = 60 * 60 * 24; // 24 hours
  private readonly COUNTER_TTL = 60 * 15; // 15 mins

  constructor(private readonly redis: RedisService) {}

  // ==========================================================================
  // BANS (TEMPORARY)
  // ==========================================================================

  /**
   * Ban User
   */
  async banUser(userId: number, reason: string, durationMs?: number): Promise<void> {
    const key = `${this.REDIS_PREFIX}:ban:user:${userId}`;
    const ttl = durationMs ? durationMs / 1000 : this.BAN_TTL;
    const value = JSON.stringify({ reason, bannedAt: new Date(), bannedUntil: new Date(Date.now() + ttl * 1000) });

    await this.redis.set(key, value, ttl);
    this.logger.log(`User ${userId} banned: ${reason} for ${ttl}s`);
  }

  /**
   * Ban IP
   */
  async banIp(ip: string, reason: string, durationMs?: number): Promise<void> {
    const key = `${this.REDIS_PREFIX}:ban:ip:${ip}`;
    const ttl = durationMs ? durationMs / 1000 : this.BAN_TTL;
    const value = JSON.stringify({ reason, bannedAt: new Date(), bannedUntil: new Date(Date.now() + ttl * 1000) });

    await this.redis.set(key, value, ttl);
    this.logger.log(`IP ${ip} banned: ${reason} for ${ttl}s`);
  }

  /**
   * Check Ban (User or IP)
   */
  async checkBan(identifier: string, type: 'user' | 'ip'): Promise<{ banned: boolean; reason?: string; until?: Date }> {
    const key = `${this.REDIS_PREFIX}:ban:${type}:${identifier}`;
    const value = await this.redis.get(key);

    if (!value) {
      return { banned: false };
    }

    const data = JSON.parse(value);
    return {
      banned: true,
      reason: data.reason,
      until: new Date(data.bannedUntil),
    };
  }

  /**
   * Unban (User or IP)
   */
  async unban(identifier: string, type: 'user' | 'ip'): Promise<void> {
    const key = `${this.REDIS_PREFIX}:ban:${type}:${identifier}`;
    await this.redis.del(key);
    this.logger.log(`${type} ${identifier} unbanned`);
  }

  // ==========================================================================
  // ABUSE COUNTERS (API TOKEN, BRUTE FORCE)
  // ==========================================================================

  /**
   * Increment Token Usage
   */
  async incrementTokenUsage(tokenId: string): Promise<number> {
    const key = `${this.REDIS_PREFIX}:token:usage:${tokenId}`;
    return await this.redis.incr(key);
  }

  /**
   * Get Token Usage
   */
  async getTokenUsage(tokenId: string): Promise<number> {
    const key = `${this.REDIS_PREFIX}:token:usage:${tokenId}`;
    const val = await this.redis.get(key);
    return val ? parseInt(val, 10) : 0;
  }

  /**
   * Increment Brute Force Attempt (User)
   */
  async incrementBruteForce(userId: number): Promise<number> {
    const key = `${this.REDIS_PREFIX}:abuse:brute:user:${userId}`;
    // Set TTL on first increment to clear out after window
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, this.COUNTER_TTL);
    }
    return count;
  }

  /**
   * Get Brute Force Attempts (User)
   */
  async getBruteForceAttempts(userId: number): Promise<number> {
    const key = `${this.REDIS_PREFIX}:abuse:brute:user:${userId}`;
    const val = await this.redis.get(key);
    return val ? parseInt(val, 10) : 0;
  }

  /**
   * Clear Brute Force Attempts (User)
   */
  async clearBruteForce(userId: number): Promise<void> {
    const key = `${this.REDIS_PREFIX}:abuse:brute:user:${userId}`;
    await this.redis.del(key);
  }

  /**
   * Increment Rate Limit Hit (IP)
   */
  async incrementRateLimit(ip: string): Promise<number> {
    const key = `${this.REDIS_PREFIX}:abuse:ratelimit:ip:${ip}`;
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, 60); // 1 min window
    }
    return count;
  }

  /**
   * Get Rate Limit Hits (IP)
   */
  async getRateLimitHits(ip: string): Promise<number> {
    const key = `${this.REDIS_PREFIX}:abuse:ratelimit:ip:${ip}`;
    const val = await this.redis.get(key);
    return val ? parseInt(val, 10) : 0;
  }

  /**
   * Clear Rate Limit Hits (IP)
   */
  async clearRateLimit(ip: string): Promise<void> {
    const key = `${this.REDIS_PREFIX}:abuse:ratelimit:ip:${ip}`;
    await this.redis.del(key);
  }
}
