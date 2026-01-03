import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { AdminRealtimeService } from './admin-realtime.service';
import { OwnerRealtimeGateway } from './owner-realtime.gateway';
import { PubSubService } from './pubsub.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [RedisModule, AuthModule],
  providers: [
    AdminRealtimeService,
    OwnerRealtimeGateway,
    PubSubService,
  ],
  exports: [
    AdminRealtimeService,
    OwnerRealtimeGateway,
    PubSubService,
  ],
})
export class RealtimeModule {}
