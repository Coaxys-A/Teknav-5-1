import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RedisService } from '../../redis/redis.service';

const memoryStore = new Map<string, { expires: number; value: any }>();

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private ttl: number;
  constructor(private readonly redisService: RedisService) {
    this.ttl = Number(process.env.CACHE_TTL_SECONDS ?? 60);
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const key = `${request.method}:${request.originalUrl}`;
    const now = Date.now();

    const redis = this.redisService.getClient();
    if (redis) {
      const cached = await redis.get(key);
      if (cached) {
        return of(JSON.parse(cached));
      }
    } else {
      const entry = memoryStore.get(key);
      if (entry && entry.expires > now) {
        return of(entry.value);
      }
    }

    return next.handle().pipe(
      tap(async (data) => {
        if (redis) {
          await redis.set(key, JSON.stringify(data), 'EX', this.ttl);
        } else {
          memoryStore.set(key, { expires: now + this.ttl * 1000, value: data });
        }
      }),
    );
  }
}
