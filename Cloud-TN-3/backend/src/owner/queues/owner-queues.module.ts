import { Module } from '@nestjs/common';
import { OwnerQueuesService } from './owner-queues.service';
import { OwnerQueuesController } from './owner-queues.controller';
import { QueueModule } from '../../queue/queue.module';

/**
 * Owner Queues Module
 *
 * Provides:
 * - Owner Queues Service
 * - Owner Queues Controller
 */

@Module({
  imports: [
    QueueModule,
  ],
  providers: [
    OwnerQueuesService,
    OwnerQueuesController,
  ],
  exports: [
    OwnerQueuesService,
    OwnerQueuesController,
  ],
})
export class OwnerQueuesModule {}
