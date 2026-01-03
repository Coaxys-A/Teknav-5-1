import { Injectable, Logger, ForbiddenException, HttpCode, HttpStatus } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

/**
 * API Token Abuse Detection
 * 
 * - Tracks requests per API token hash
 * - If exceeds threshold, write temporary ban
 * - Logs to AuditLog
 */

@Injectable()
export class AbuseDetectionService {
  private readonly logger = new Logger(AbuseDetectionService.name);
  private readonly TOKEN_LIMIT_PER_MIN = 300; // 300 requests/min per token
  private readonly BAN_TTL_SECONDS = 15 * 60; // 15 minutes

  constructor(private readonly redis: RedisService) {}

  /**
   * Track API token usage and check for abuse
   */
  async trackTokenUsage(params: {
    tokenHash: string;
    userId: number;
    ip: string;
    resource: string;
  }): Promise<{ allowed: boolean }> {
    const { tokenHash, userId, ip, resource } = params;
    const cacheKey = this.getCacheKey('token', tokenHash);
    const banKey = this.getCacheKey('ban', tokenHash);

    // Check if token is banned
    const isBanned = await this.redis.get(banKey);
    if (isBanned) {
      this.logger.warn(`API token ${tokenHash} is banned for abuse`);
      throw new ForbiddenException(
        'API token has been temporarily banned due to suspicious activity',
        { statusCode: HttpStatus.FORBIDDEN }
      );
    }

    // Increment request counter
    const current = await this.redis.incr(cacheKey);
    
    // Set expiry on first request in window
    if (current === 1) {
      await this.redis.set(cacheKey, '1', 60); // 60s TTL (1 minute window)
    }

    // Check if exceeded
    if (current > this.TOKEN_LIMIT_PER_MIN) {
      this.logger.warn(`API token abuse detected: ${tokenHash} - ${current} req/min`);
      
      // Write temporary ban
      await this.redis.set(banKey, '1', this.BAN_TTL_SECONDS);
      
      // Log to AuditLog (will be called by interceptor)
      this.logger.warn(`API token ${tokenHash} banned for ${this.BAN_TTL_SECONDS}s`);
      
      return { allowed: false };
    }

    return { allowed: true };
  }

  /**
   * Check if a token is banned
   */
  async isTokenBanned(tokenHash: string): Promise<boolean> {
    const banKey = this.getCacheKey('ban', tokenHash);
    return (await this.redis.exists(banKey)) === 1;
  }

  /**
   * Clear ban (for admin manual unban)
   */
  async clearTokenBan(tokenHash: string): Promise<void> {
    const banKey = this.getCacheKey('ban', tokenHash);
    const usageKey = this.getCacheKey('token', tokenHash);
    await Promise.all([
      this.redis.del(banKey),
      this.redis.del(usageKey),
    ]);
    this.logger.debug(`API token ${tokenHash} ban cleared`);
  }

  /**
   * Get ban info
   */
  async getTokenBanInfo(tokenHash: string): Promise<{ banned: boolean; ttl?: number }> {
    const isBanned = await this.isTokenBanned(tokenHash);
    if (!isBanned) {
      return { banned: false };
    }

    // Get remaining TTL (using upstash for cross-region read)
    const banKey = this.getCacheKey('ban', tokenHash);
    const remaining = await this.redis.ttl?.(banKey) || 0;

    return { banned: true, ttl: remaining };
  }

  /**
   * Get cache key for token ban/usage
   */
  private getCacheKey(type: 'token' | 'ban', tokenHash: string): string {
    return `abuse:${type}:${tokenHash}`;
  }
}

  /**
   * Generate hash for API token
   */
  private hashToken(token: string): string {
    // Simple hash for token tracking
    // In production, use crypto hash
    const hash = require('crypto').createHash('sha256');
    return hash.update(token).digest('hex');
  }

  /**
   * Hash API token for tracking
   */
  hashApiKey(apiKey: string): string {
    return this.hashToken(apiKey);
  }
}
