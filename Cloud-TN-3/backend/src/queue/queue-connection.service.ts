import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';

/**
 * Shared BullMQ Connection Service
 * 
 * Single shared ioredis connection for all queues.
 */

@Injectable()
export class QueueConnectionService implements OnModuleInit {
  private readonly logger = new Logger(QueueConnectionService.name);
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    });
  }

  async onModuleInit() {
    this.logger.log('Initializing BullMQ Redis connection');
    // Ping Redis to verify connection
    try {
      const pong = await this.redis.ping();
      this.logger.log('BullMQ Redis connection established:', pong);
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
    }
  }

  /**
   * Get Redis instance
   */
  getRedis(): Redis {
    return this.redis;
  }

  /**
   * Close connection on shutdown
   */
  async onModuleDestroy() {
    this.logger.log('Closing BullMQ Redis connection');
    await this.redis.quit();
  }
}
