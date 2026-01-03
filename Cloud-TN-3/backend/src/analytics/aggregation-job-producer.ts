import { Injectable, Logger } from '@nestjs/common';
import { QueueProducerService } from '../queues/queue.producer.service';

/**
 * Analytics Aggregation Job Producer
 * 
 * Triggers aggregation jobs (runs every 5 min)
 */

@Injectable()
export class AnalyticsAggregationJobProducer {
  private readonly logger = new Logger(AnalyticsAggregationJobProducer.name);

  constructor(
    private readonly queueProducer: QueueProducerService,
  ) {}

  /**
   * Trigger aggregation job
   */
  async triggerAggregation() {
    this.logger.debug('Triggering analytics aggregation job');

    // Add job to 'analytics' queue
    await this.queueProducer.addAnalyticsJob('aggregate_daily_stats', {
      type: 'aggregation',
      scheduledAt: new Date(),
    });
  }
}
