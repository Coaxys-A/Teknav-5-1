import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class PluginRateLimitService {
  private readonly windowSeconds = 60;
  private readonly maxCalls = 60;

  constructor(private readonly redis: RedisService) {}

  private key(pluginKey: string, tenantId?: number | null) {
    return `plugin:rl:${tenantId ?? 'global'}:${pluginKey}`;
  }

  async assertWithinLimit(pluginKey: string, tenantId?: number | null) {
    const key = this.key(pluginKey, tenantId);
    const client = this.redis.getClient();
    if (client) {
      const multi = client.multi();
      multi.incr(key);
      multi.expire(key, this.windowSeconds);
      const res = await multi.exec();
      const current = Number(res?.[0]?.[1] ?? 0);
      if (current > this.maxCalls) {
        throw new HttpException('PLUGIN_RATE_LIMIT', HttpStatus.TOO_MANY_REQUESTS);
      }
      return;
    }
    const count = (await this.redis.get<number>(key)) ?? 0;
    const next = count + 1;
    await this.redis.set(key, next, this.windowSeconds);
    if (next > this.maxCalls) {
      throw new HttpException('PLUGIN_RATE_LIMIT', HttpStatus.TOO_MANY_REQUESTS);
    }
  }
}
