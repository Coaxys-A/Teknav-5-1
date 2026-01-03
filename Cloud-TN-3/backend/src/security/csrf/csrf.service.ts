import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { createHmac } from 'crypto';

/**
 * CSRF Service
 *
 * Handles CSRF token generation, validation, and rotation.
 * Strategy: Double-submit cookie (httpOnly=false to allow JS access for header).
 */

@Injectable()
export class CsrfService {
  private readonly logger = new Logger(CsrfService.name);
  private readonly COOKIE_NAME = 'csrf_token';
  private readonly HEADER_NAME = 'x-csrf-token';
  private readonly SERVER_SECRET = process.env.SERVER_SECRET || 'change-me-in-production';
  private readonly TOKEN_TTL = 3600; // 1 hour

  /**
   * Generate new CSRF token
   * Returns token (string)
   */
  generateToken(): string {
    const token = uuidv4();
    return token;
  }

  /**
   * Generate a signed CSRF token (optional, for extra security)
   */
  generateSignedToken(): string {
    const token = this.generateToken();
    const signature = createHmac('sha256', this.SERVER_SECRET)
      .update(token)
      .digest('hex');
    return `${token}.${signature}`;
  }

  /**
   * Validate CSRF token
   * Compares cookie token with header token (or signed token)
   */
  validateToken(cookieToken: string, headerToken: string): boolean {
    if (!cookieToken || !headerToken) {
      return false;
    }

    // Simple string match
    if (cookieToken === headerToken) {
      return true;
    }

    // Try matching signed token (headerToken might be signed)
    // In this case, cookieToken should be the plain token
    // And we verify the signature in headerToken against plain token
    if (headerToken.includes('.')) {
      const [plain, signature] = headerToken.split('.');
      if (plain === cookieToken) {
        const expectedSignature = createHmac('sha256', this.SERVER_SECRET)
          .update(plain)
          .digest('hex');
        return signature === expectedSignature;
      }
    }

    return false;
  }

  /**
   * Get cookie name
   */
  getCookieName(): string {
    return this.COOKIE_NAME;
  }

  /**
   * Get header name
   */
  getHeaderName(): string {
    return this.HEADER_NAME;
  }
}
