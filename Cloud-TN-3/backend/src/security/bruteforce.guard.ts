import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class BruteForceGuard implements CanActivate {
  private readonly windowMs = Number(process.env.BRUTEFORCE_WINDOW_MS ?? 300000);
  private readonly maxAttempts = Number(process.env.BRUTEFORCE_MAX_ATTEMPTS ?? 10);
  private readonly blockMs = Number(process.env.BRUTEFORCE_BLOCK_MS ?? 900000);

  constructor(private readonly redis: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: any = context.switchToHttp().getRequest();
    const ip = req?.ip ?? req?.headers?.['x-forwarded-for'] ?? 'unknown';
    const key = `bf:${ip}`;
    const client = this.redis.getClient();
    if (client) {
      const blockedUntil = await client.get(`${key}:block`);
      if (blockedUntil && Number(blockedUntil) > Date.now()) {
        throw new ForbiddenException('BRUTE_FORCE_BLOCKED');
      }
      const attempts = await client.incr(key);
      if (attempts === 1) {
        await client.pexpire(key, this.windowMs);
      }
      if (attempts > this.maxAttempts) {
        await client.set(`${key}:block`, (Date.now() + this.blockMs).toString(), 'PX', this.blockMs);
        throw new ForbiddenException('BRUTE_FORCE_BLOCKED');
      }
      return true;
    }
    return true;
  }
}
