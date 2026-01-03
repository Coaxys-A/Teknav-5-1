import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RedisModule } from '../redis/redis.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditLogModule } from '../logging/audit-log.module';
import { QueueConfigService } from './queue.config';
import { QueueRegistryService } from './queue.registry';
import { QueueService } from './queue.service';
import { QueueMetricsService } from './metrics/queue-metrics.service';
import { DlqService } from './dlq/dlq.service';
import { ProcessorModule } from './processors/processor.module';
import { QueueEventsGateway } from './queue-events.gateway';
import { OwnerQueuesModule } from '../owner/queues/owner-queues.module';

/**
 * Queue Module
 *
 * Configures BullMQ, queues, processors, DLQ, metrics, and events.
 * Imports Redis, Prisma, and AuditLog modules.
 */

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [RedisModule],
      useFactory: (redis: RedisModule) => ({
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          db: parseInt(process.env.REDIS_DB || '0'),
          username: process.env.REDIS_USER,
          password: process.env.REDIS_PASSWORD,
          keyPrefix: process.env.REDIS_KEY_PREFIX || 'q',
        },
      }),
      inject: [RedisModule],
    }),
    BullModule.registerQueue(
      {
        name: 'ai:content',
        defaultJobOptions: {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 1000,
          removeOnFail: 5000,
        },
      },
    ),
    BullModule.registerQueue(
      {
        name: 'ai:seo',
        defaultJobOptions: {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 1000,
          removeOnFail: 5000,
        },
      },
    ),
    BullModule.registerQueue(
      {
        name: 'ai:review',
        defaultJobOptions: {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 1000,
          removeOnFail: 5000,
        },
      },
    ),
    BullModule.registerQueue(
      {
        name: 'workflows:run',
        defaultJobOptions: {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 1000,
          removeOnFail: 5000,
        },
      },
    ),
    BullModule.registerQueue(
      {
        name: 'plugins:execute',
        defaultJobOptions: {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 1000,
          removeOnFail: 5000,
        },
      },
    ),
    BullModule.registerQueue(
      {
        name: 'analytics:process',
        defaultJobOptions: {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 1000,
          removeOnFail: 5000,
        },
      },
    ),
    BullModule.registerQueue(
      {
        name: 'analytics:snapshot',
        defaultJobOptions: {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 1000,
          removeOnFail: 5000,
        },
      },
    ),
    BullModule.registerQueue(
      {
        name: 'email:send',
        defaultJobOptions: {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 1000,
          removeOnFail: 5000,
        },
      },
    ),
    BullModule.registerQueue(
      {
        name: 'otp:send',
        defaultJobOptions: {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 1000,
          removeOnFail: 5000,
        },
      },
    ),
    BullModule.registerQueue(
      {
        name: 'webhooks:deliver',
        defaultJobOptions: {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 1000,
          removeOnFail: 5000,
        },
      },
    ),
    BullModule.registerQueue(
      {
        name: 'media:optimize',
        defaultJobOptions: {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 1000,
          removeOnFail: 5000,
        },
      },
    ),
    BullModule.registerQueue(
      {
        name: 'search:index',
        defaultJobOptions: {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 1000,
          removeOnFail: 5000,
        },
      },
    ),
    // DLQs
    BullModule.registerQueue({ name: 'ai:content:dlq' }),
    BullModule.registerQueue({ name: 'ai:seo:dlq' }),
    BullModule.registerQueue({ name: 'ai:review:dlq' }),
    BullModule.registerQueue({ name: 'workflows:run:dlq' }),
    BullModule.registerQueue({ name: 'plugins:execute:dlq' }),
    BullModule.registerQueue({ name: 'analytics:process:dlq' }),
    BullModule.registerQueue({ name: 'analytics:snapshot:dlq' }),
    BullModule.registerQueue({ name: 'email:send:dlq' }),
    BullModule.registerQueue({ name: 'otp:send:dlq' }),
    BullModule.registerQueue({ name: 'webhooks:deliver:dlq' }),
    BullModule.registerQueue({ name: 'media:optimize:dlq' }),
    BullModule.registerQueue({ name: 'search:index:dlq' }),
    RedisModule,
    PrismaModule,
    AuditLogModule,
    ProcessorModule,
    OwnerQueuesModule,
  ],
  providers: [
    QueueConfigService,
    QueueRegistryService,
    QueueService,
    QueueMetricsService,
    DlqService,
    QueueEventsGateway,
  ],
  exports: [
    BullModule,
    QueueConfigService,
    QueueRegistryService,
    QueueService,
    QueueMetricsService,
    DlqService,
    QueueEventsGateway,
  ],
})
export class QueueModule {}
