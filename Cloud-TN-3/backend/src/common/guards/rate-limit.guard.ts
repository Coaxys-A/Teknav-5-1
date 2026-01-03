import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisService } from '../../redis/redis.service';
import { RATE_LIMIT_KEY } from '../decorators/rate-limit.decorator';

interface RateEntry {
  count: number;
  expiresAt: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, RateEntry>();
  private readonly windowMs: number;
  private readonly limit: number;

  constructor(private readonly redis: RedisService, private readonly reflector: Reflector) {
    this.windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000);
    this.limit = Number(process.env.RATE_LIMIT_MAX ?? 10);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request?.user?.id;
    const ip = request?.ip ?? request?.headers['x-forwarded-for'] ?? 'anonymous';
    const key = userId ? `user:${userId}` : `ip:${ip}`;
    const metadata = this.reflector.get<{ limit?: number; windowMs?: number }>(RATE_LIMIT_KEY, context.getHandler());
    const limit = metadata?.limit ?? this.limit;
    const windowMs = metadata?.windowMs ?? this.windowMs;
    const redisClient = this.redis.getClient();

    if (redisClient) {
      const ttlSeconds = Math.ceil(windowMs / 1000);
      const current = await redisClient.incr(key);
      if (current === 1) {
        await redisClient.expire(key, ttlSeconds);
      }
      if (current > limit) {
        throw new HttpException('RATE_LIMITED', HttpStatus.TOO_MANY_REQUESTS);
      }
      return true;
    }

    const now = Date.now();
    const existing = this.buckets.get(key);
    if (existing && existing.expiresAt > now) {
      if (existing.count >= limit) {
        throw new HttpException('RATE_LIMITED', HttpStatus.TOO_MANY_REQUESTS);
      }
      existing.count += 1;
      return true;
    }

    this.buckets.set(key, { count: 1, expiresAt: now + windowMs });
    return true;
  }
}
