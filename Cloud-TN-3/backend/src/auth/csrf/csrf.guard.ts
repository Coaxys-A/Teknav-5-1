import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Request } from 'express';
import { CsrfService } from './csrf.service';
import { AuthContextService } from '../../auth/auth-context.service';

/**
 * CSRF Guard
 * 
 * Validates CSRF token for state-changing requests.
 */

@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly logger = new Logger(CsrfGuard.name);

  // Whitelisted routes (webhooks, health)
  private readonly WHITELISTED_PATHS = [
    '/webhooks/',
    '/health',
    '/api/health',
    '/api/analytics/ingest',
    '/api/auth/login',
    '/api/auth/register',
  ];

  constructor(
    private readonly csrfService: CsrfService,
    private readonly authContext: AuthContextService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;

    // Skip validation for GET/HEAD/OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) {
      return true;
    }

    // Check if path is whitelisted
    const path = request.path;
    if (this.WHITELISTED_PATHS.some(whitelist => path.includes(whitelist))) {
      this.logger.debug(`CSRF skipped for whitelisted path: ${path}`);
      return true;
    }

    // Get CSRF token from header
    const token = request.headers['x-csrf-token'] as string | undefined;

    if (!token) {
      this.logger.warn(`CSRF token missing for ${method} ${path}`);
      throw new ForbiddenException('CSRF token is missing.');
    }

    // Get Session ID
    const sessionId = await this.authContext.getSessionId(request);

    if (!sessionId) {
      this.logger.warn(`Session ID not found for CSRF validation`);
      throw new ForbiddenException('Session not found.');
    }

    // Validate token
    const isValid = await this.csrfService.validateToken(sessionId, token);

    if (!isValid) {
      this.logger.warn(`CSRF token invalid for ${method} ${path}`);
      throw new ForbiddenException('CSRF token is invalid or expired.');
    }

    this.logger.debug(`CSRF token valid for ${method} ${path}`);
    return true;
  }
}
