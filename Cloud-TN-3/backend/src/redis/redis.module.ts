import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';
import { CacheService } from './cache.service';
import { RedisHealthController } from './redis.controller';
import { RateLimitInterceptor } from './rate-limit.interceptor';

@Global()
@Module({
  imports: [],
  controllers: [RedisHealthController],
  providers: [
    RedisService,
    CacheService,
    RedisHealthController,
    {
      provide: 'APP_INTERCEPTOR',
      useClass: RateLimitInterceptor,
    },
  ],
  exports: [RedisService, CacheService],
})
export class RedisModule {}
