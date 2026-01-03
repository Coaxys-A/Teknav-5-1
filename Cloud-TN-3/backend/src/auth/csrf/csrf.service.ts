import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { RedisService } from '../../../redis/redis.service';
import { ConfigService } from '@nestjs/config';

/**
 * CSRF Protection Service
 * 
 * Generates and validates CSRF tokens.
 */

@Injectable()
export class CsrfService {
  private readonly logger = new Logger(CsrfService.name);
  private readonly PREFIX = process.env.REDIS_KEY_PREFIX || 'teknav';
  private readonly TOKEN_LENGTH = 32;

  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Generate CSRF token for session
   */
  async generateToken(sessionId: string): Promise<string> {
    const token = randomBytes(this.TOKEN_LENGTH).toString('hex');
    const key = this.getRedisKey(sessionId);

    // Store token in Redis
    await this.redis.set(key, token, this.getTokenTTL());

    this.logger.debug(`CSRF token generated for session: ${sessionId}`);
    return token;
  }

  /**
   * Validate CSRF token
   */
  async validateToken(sessionId: string, token: string): Promise<boolean> {
    const key = this.getRedisKey(sessionId);
    const storedToken = await this.redis.get(key);

    if (!storedToken) {
      this.logger.warn(`CSRF token not found for session: ${sessionId}`);
      return false;
    }

    if (storedToken !== token) {
      this.logger.warn(`CSRF token mismatch for session: ${sessionId}`);
      return false;
    }

    this.logger.debug(`CSRF token valid for session: ${sessionId}`);
    return true;
  }

  /**
   * Refresh CSRF token (rotation)
   */
  async refreshToken(sessionId: string): Promise<string> {
    const oldToken = await this.redis.get(this.getRedisKey(sessionId));
    const newToken = await this.generateToken(sessionId);
    
    this.logger.debug(`CSRF token refreshed for session: ${sessionId}`);
    return newToken;
  }

  /**
   * Get Redis key for CSRF token
   */
  private getRedisKey(sessionId: string): string {
    return `${this.PREFIX}:csrf:${sessionId}`;
  }

  /**
   * Get token TTL (should match session TTL)
   */
  private getTokenTTL(): number {
    const sessionTTL = this.config.get('REFRESH_TOKEN_TTL_SECONDS', 604800); // 7 days default
    return sessionTTL;
  }
}
