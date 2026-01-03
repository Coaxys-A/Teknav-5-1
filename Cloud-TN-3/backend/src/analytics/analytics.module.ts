import { Module } from '@nestjs/common';
import { AnalyticsIngestController } from './analytics-ingest.controller';
import { AnalyticsIngestService } from './analytics-ingest.service';
import { AnalyticsAggregationJobProducer } from './aggregation-job-producer';
import { AnalyticsAggregationConsumer } from './aggregation-job-consumer';
import { RedisSnapshotCacheService } from './redis-snapshot-cache.service';
import { FunnelsService } from './funnels.service';
import { FunnelsController } from './funnels.controller';
import { RetentionService } from './retention.service';
import { RetentionController } from './retention.controller';
import { TrafficService } from './traffic.service';
import { RealtimeAnalyticsService } from './realtime-analytics.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { QueuesModule } from '../queues/queues.module';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    QueuesModule,
    SecurityModule,
  ],
  controllers: [
    AnalyticsIngestController,
    FunnelsController,
    RetentionController,
  ],
  providers: [
    AnalyticsIngestService,
    AnalyticsAggregationJobProducer,
    AnalyticsAggregationConsumer,
    RedisSnapshotCacheService,
    FunnelsService,
    RetentionService,
    TrafficService,
    RealtimeAnalyticsService,
  ],
  exports: [
    AnalyticsIngestService,
    AnalyticsAggregationJobProducer,
    RedisSnapshotCacheService,
    FunnelsService,
    RetentionService,
    TrafficService,
    RealtimeAnalyticsService,
  ],
})
export class AnalyticsModule {}
