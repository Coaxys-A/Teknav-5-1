import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { randomBytes } from 'crypto';

/**
 * CSRF Service - Signed Token Approach
 */

@Injectable()
export class CsrfService {
  private readonly logger = new Logger(CsrfService.name);
  private readonly CSRF_COOKIE_NAME = 'x-csrf-token';
  private readonly CSRF_HEADER_NAME = 'x-csrf-token';
  private readonly CSRF_TOKEN_LENGTH = 32; // bytes
  private readonly CSRF_TTL_SECONDS = 3600; // 1 hour

  constructor(private readonly redis: RedisService) {}

  /**
   * Generate CSRF token
   */
  async generateToken(userId?: number): Promise<string> {
    const secret = randomBytes(16).toString('hex');
    const token = randomBytes(this.CSRF_TOKEN_LENGTH).toString('base64url');
    
    // Store token secret in Redis for validation
    const cacheKey = this.getCacheKey(token);
    await this.redis.set(cacheKey, secret, this.CSRF_TTL_SECONDS);
    
    this.logger.debug(`CSRF token generated for user ${userId}`);
    return token;
  }

  /**
   * Validate CSRF token
   */
  async validateToken(token: string): Promise<boolean> {
    const cacheKey = this.getCacheKey(token);
    const stored = await this.redis.get(cacheKey);
    const valid = stored !== null;

    if (valid) {
      this.logger.debug(`CSRF token validated`);
    } else {
      this.logger.warn(`CSRF token validation failed`);
    }
    
    return valid;
  }

  /**
   * Get cookie options
   */
  getCookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: this.CSRF_TTL_SECONDS * 1000,
      path: '/',
    };
  }

  /**
   * Get cache key for CSRF token
   */
  private getCacheKey(token: string): string {
    return `csrf:${token}`;
  }

  /**
   * Check if request should skip CSRF (API tokens, webhooks)
   */
  shouldSkipCSRF(request: any): boolean {
    const apiKey = request.headers?.['x-api-key'];
    const userAgent = request.headers?.['user-agent'] || request.headers?.['User-Agent'];

    // Skip CSRF for machine-to-machine API tokens
    if (apiKey) {
      return true;
    }

    // Skip for known CLI tools (optional)
    if (userAgent && (userAgent.includes('curl') || userAgent.includes('wget'))) {
      return true;
    }

    return false;
  }
}
