import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Observable, throwError, from } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { RedisService } from './redis.service';

const RATE_LIMIT_REQUESTS = 60;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RateLimitInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly redis: RedisService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Only rate limit owner APIs
    if (!request.path?.startsWith('/api/owner/')) {
      return next.handle();
    }

    return from(this.checkRateLimit(request, response)).pipe(
      (allowed) => {
        if (!allowed) {
          throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
        }
        return next.handle();
      }
    );
  }

  private async checkRateLimit(request: any, response: any): Promise<boolean> {
    if (!this.redis.isAvailable()) {
      // Redis down - fail open
      return true;
    }

    const ip = this.getClientIp(request);
    const key = `ratelimit:owner:${ip}`;

    try {
      const current = await this.redis.get(key);
      if (!current) {
        await this.redis.set(key, '1', RATE_LIMIT_WINDOW_MS / 1000);
        return true;
      }

      const count = parseInt(current);
      if (count >= RATE_LIMIT_REQUESTS) {
        // Add rate limit headers
        response.setHeader('X-RateLimit-Limit', RATE_LIMIT_REQUESTS.toString());
        response.setHeader('X-RateLimit-Remaining', '0');
        response.setHeader('X-RateLimit-Reset', Date.now() + RATE_LIMIT_WINDOW_MS);
        return false;
      }

      response.setHeader('X-RateLimit-Limit', RATE_LIMIT_REQUESTS.toString());
      response.setHeader('X-RateLimit-Remaining', (RATE_LIMIT_REQUESTS - count).toString());
      response.setHeader('X-RateLimit-Reset', Date.now() + RATE_LIMIT_WINDOW_MS);

      // Increment count
      await this.redis.set(key, (count + 1).toString(), RATE_LIMIT_WINDOW_MS / 1000);
      return true;
    } catch (err) {
      this.logger.error('Rate limit check failed:', err);
      // Redis error - fail open
      return true;
    }
  }

  private getClientIp(request: any): string {
    return request.ip || request.connection?.remoteAddress || request.socket?.remoteAddress || '127.0.0.1';
  }
}
