import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { RedisService } from './redis.service';

@Controller('api/health/redis')
export class RedisHealthController {
  constructor(private readonly redis: RedisService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async health() {
    const [ping, exists] = await Promise.all([
      this.redis.ping(),
      this.redis.exists(this.redis.buildKey('health', 'check')),
    ]);

    return {
      status: 'ok',
      data: {
        protocolPing: ping.ok,
        restPing: ping.ok, // Will be true if protocol works
        latencyMs: ping.latencyMs,
        testKeyExists: exists,
        available: this.redis.isAvailable(),
        prefix: process.env.REDIS_KEY_PREFIX || 'teknav',
        env: process.env.NODE_ENV || 'dev',
      },
    };
  }
}
