import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RedisService } from '../redis';

interface AttemptKey {
  ip?: string;
  email?: string;
}

@Injectable()
export class BruteForceService {
  private readonly windowSec: number;
  private readonly maxAttempts: number;
  private readonly memory = new Map<string, { count: number; expiresAt: number }>();

  constructor(private readonly redis: RedisService) {
    this.windowSec = Number(process.env.BRUTE_FORCE_WINDOW_SEC ?? 300);
    this.maxAttempts = Number(process.env.BRUTE_FORCE_MAX_ATTEMPTS ?? 5);
  }

  async checkOrThrow(key: AttemptKey) {
    const lookupKey = this.buildKey(key);
    const attempts = await this.increment(lookupKey);
    if (attempts > this.maxAttempts) {
      throw new HttpException('TOO_MANY_ATTEMPTS', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  async reset(key: AttemptKey) {
    const lookupKey = this.buildKey(key);
    if (this.redis.isEnabled) {
      await this.redis.del(lookupKey);
    } else {
      this.memory.delete(lookupKey);
    }
  }

  private async increment(lookupKey: string) {
    if (this.redis.isEnabled) {
      const next = await this.redis.get<number>(lookupKey);
      const count = (next ?? 0) + 1;
      await this.redis.set(lookupKey, count, this.windowSec);
      return count;
    }

    const now = Date.now();
    const existing = this.memory.get(lookupKey);
    if (existing && existing.expiresAt > now) {
      existing.count += 1;
      return existing.count;
    }
    this.memory.set(lookupKey, { count: 1, expiresAt: now + this.windowSec * 1000 });
    return 1;
  }

  private buildKey(key: AttemptKey) {
    return `bf:${key.email ?? 'unknown'}:${key.ip ?? 'ip'}`;
  }
}
