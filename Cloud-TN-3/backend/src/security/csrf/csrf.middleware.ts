import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CsrfService } from './csrf.service';

/**
 * CSRF Middleware
 *
 * Validates CSRF tokens for state-changing requests (POST/PUT/PATCH/DELETE).
 * Strategy: Double-submit cookie.
 * 1. Checks for existence of CSRF cookie.
 * 2. Checks for existence of CSRF header.
 * 3. Validates that header token matches cookie token.
 */

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  constructor(private readonly csrfService: CsrfService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    // 1. Skip CSRF for safe methods (GET, HEAD, OPTIONS)
    const method = req.method.toUpperCase();
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return next();
    }

    // 2. Check for CSRF cookie
    const cookieToken = req.cookies[this.csrfService.getCookieName()];
    if (!cookieToken) {
      throw new ForbiddenException('CSRF token cookie missing');
    }

    // 3. Check for CSRF header
    const headerToken = req.headers[this.csrfService.getHeaderName()] as string;
    if (!headerToken) {
      throw new ForbiddenException('CSRF token header missing');
    }

    // 4. Validate tokens
    const isValid = this.csrfService.validateToken(cookieToken, headerToken);
    if (!isValid) {
      throw new ForbiddenException('CSRF token validation failed');
    }

    // 5. Token is valid, proceed
    next();
  }
}

/**
 * CSRF Middleware Factory (for NestJS use)
 */
export function csrfMiddlewareFactory() {
  return (req, res, next) => {
    // Assumed CsrfService is injected via NestJS DI, so we can't use this directly in a factory.
    // We'll use Class-based middleware approach in module configuration.
    next();
  };
}
