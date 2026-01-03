import { Module } from '@nestjs/common';
import { AbuseDetectionService } from './abuse.service';
import { RedisModule } from '../../redis/redis.module';

/**
 * Abuse Module
 *
 * Provides AbuseDetectionService.
 */

@Module({
  imports: [RedisModule],
  providers: [AbuseDetectionService],
  exports: [AbuseDetectionService],
})
export class AbuseModule {}
