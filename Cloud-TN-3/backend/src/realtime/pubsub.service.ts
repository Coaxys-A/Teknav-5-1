import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisService } from '../redis/redis.service';
import {
  RealtimeEvent,
  REALTIME_CHANNELS,
  RealtimeChannel,
} from '../queue/contracts';

/**
 * PubSub Service
 *
 * Handles Redis pub/sub for real-time events.
 * Subscribes to channels and broadcasts to WebSocket clients.
 */

export interface EventSubscriber {
  channel: RealtimeChannel;
  callback: (event: RealtimeEvent) => void | Promise<void>;
}

@Injectable()
export class PubSubService implements OnModuleDestroy {
  private readonly logger = new Logger(PubSubService.name);
  private readonly subscriber: Redis;
  private readonly publisher: Redis;
  private readonly subscribers = new Map<string, Set<EventSubscriber>>();

  constructor(private readonly redisService: RedisService) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    this.subscriber = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: 'fast',
      enableReadyCheck: true,
    });

    this.publisher = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: 'fast',
      enableReadyCheck: true,
    });

    this.setupErrorHandlers();
    this.setupChannelSubscriptions();
  }

  async onModuleDestroy() {
    this.logger.log('Closing pub/sub connections...');
    await this.subscriber.quit();
    await this.publisher.quit();
  }

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  private setupErrorHandlers() {
    this.subscriber.on('error', (err) => {
      this.logger.error('Subscriber error:', err);
    });

    this.subscriber.on('connect', () => {
      this.logger.log('Subscriber connected to Redis');
    });

    this.subscriber.on('close', () => {
      this.logger.warn('Subscriber disconnected from Redis');
    });

    this.publisher.on('error', (err) => {
      this.logger.error('Publisher error:', err);
    });
  }

  // ==========================================================================
  // CHANNEL MANAGEMENT
  // ==========================================================================

  /**
   * Setup subscriptions to all channels
   */
  private setupChannelSubscriptions() {
    Object.values(REALTIME_CHANNELS).forEach((channel) => {
      this.subscriber.subscribe(channel, (err) => {
        if (err) {
          this.logger.error(`Failed to subscribe to channel: ${channel}`, err);
        } else {
          this.logger.log(`Subscribed to channel: ${channel}`);
        }
      });
    });

    // Listen for messages
    this.subscriber.on('message', (channel, message) => {
      this.handleMessage(channel as RealtimeChannel, message);
    });
  }

  /**
   * Handle incoming message from Redis
   */
  private async handleMessage(channel: RealtimeChannel, message: string) {
    try {
      const event: RealtimeEvent = JSON.parse(message);

      // Notify all subscribers for this channel
      const channelSubscribers = this.subscribers.get(channel);
      if (channelSubscribers) {
        await Promise.all(
          Array.from(channelSubscribers).map((sub) => sub.callback(event)),
        );
      }

      this.logger.debug(`Event received on channel ${channel}: ${event.type}`);
    } catch (error) {
      this.logger.error(`Failed to handle message on channel ${channel}:`, error);
    }
  }

  /**
   * Subscribe to a channel
   */
  subscribe(subscriber: EventSubscriber) {
    const channelSubscribers = this.subscribers.get(subscriber.channel) || new Set();
    channelSubscribers.add(subscriber);
    this.subscribers.set(subscriber.channel, channelSubscribers);

    this.logger.debug(`New subscriber for channel: ${subscriber.channel}`);
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(subscriber: EventSubscriber) {
    const channelSubscribers = this.subscribers.get(subscriber.channel);
    if (channelSubscribers) {
      channelSubscribers.delete(subscriber);
      if (channelSubscribers.size === 0) {
        this.subscribers.delete(subscriber.channel);
      }
    }

    this.logger.debug(`Subscriber removed from channel: ${subscriber.channel}`);
  }

  /**
   * Publish event to a channel
   */
  async publish(channel: RealtimeChannel, event: RealtimeEvent): Promise<void> {
    try {
      const message = JSON.stringify(event);
      await this.publisher.publish(channel, message);

      // Also store latest event for new subscribers
      await this.redisService.set(
        `pubsub:${channel}:latest`,
        message,
        60, // TTL: 60 seconds
      );

      this.logger.debug(`Event published to channel ${channel}: ${event.type}`);
    } catch (error) {
      this.logger.error(`Failed to publish event to channel ${channel}:`, error);
    }
  }

  /**
   * Get latest event for a channel
   */
  async getLatestEvent(channel: RealtimeChannel): Promise<RealtimeEvent | null> {
    try {
      const message = await this.redisService.get(`pubsub:${channel}:latest`);
      if (message) {
        return JSON.parse(message);
      }
      return null;
    } catch (error) {
      this.logger.error(`Failed to get latest event for channel ${channel}:`, error);
      return null;
    }
  }

  /**
   * Get all subscribers info
   */
  getSubscribersInfo(): Record<string, number> {
    const info: Record<string, number> = {};
    this.subscribers.forEach((subscribers, channel) => {
      info[channel] = subscribers.size;
    });
    return info;
  }
}
