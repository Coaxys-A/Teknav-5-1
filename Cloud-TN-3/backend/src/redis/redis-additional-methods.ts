// Add these methods to RedisService class

  /**
   * Scan keys by pattern
   */
  async scanKeys(pattern: string): Promise<string[]> {
    try {
      let cursor = '0';
      const keys: string[] = [];
      const limit = 100;

      do {
        const result = await this.client.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          limit.toString(),
        );
        cursor = result[0];
        const scannedKeys = result[1];
        keys.push(...scannedKeys);
      } while (cursor !== '0');

      return keys;
    } catch (err) {
      this.logger.error(`Redis SCAN failed for pattern ${pattern}:`, err);
      return [];
    }
  }

  /**
   * Get all keys matching pattern
   */
  async getKeysByPattern(pattern: string): Promise<string[]> {
    return await this.scanKeys(pattern);
  }

  /**
   * Increment with TTL
   */
  async incrWithExpire(key: string, ttlSeconds: number): Promise<number> {
    try {
      const multi = this.client.multi();
      multi.incr(key);
      multi.expire(key, ttlSeconds);
      const results = await multi.exec();
      return results[0][1] as number;
    } catch (err) {
      this.logger.error(`Redis INCR + EXPIRE failed for key ${key}:`, err);
      return 0;
    }
  }

  /**
   * Get and set (atomic)
   */
  async getAndSet(key: string, value: string): Promise<string | null> {
    try {
      return await this.client.getset(key, value);
    } catch (err) {
      this.logger.error(`Redis GETSET failed for key ${key}:`, err);
      return null;
    }
  }

  /**
   * Set if not exists
   */
  async setIfNotExists(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    try {
      let result;
      if (ttlSeconds) {
        result = await this.client.set(key, value, 'NX', 'EX', ttlSeconds);
      } else {
        result = await this.client.set(key, value, 'NX');
      }
      return result === 'OK';
    } catch (err) {
      this.logger.error(`Redis SET NX failed for key ${key}:`, err);
      return false;
    }
  }

  /**
   * Delete multiple keys
   */
  async delMultiple(keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;

    try {
      return await this.client.del(...keys);
    } catch (err) {
      this.logger.error(`Redis DEL multiple failed:`, err);
      return 0;
    }
  }

  /**
   * Get multiple keys
   */
  async getMultiple(keys: string[]): Promise<Array<string | null>> {
    if (keys.length === 0) return [];

    try {
      return await this.client.mget(...keys);
    } catch (err) {
      this.logger.error(`Redis MGET failed:`, err);
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple values
   */
  async setMultiple(items: Array<{ key: string; value: string }>): Promise<'OK'> {
    if (items.length === 0) return 'OK';

    try {
      const multi = this.client.multi();
      items.forEach(item => {
        multi.set(item.key, item.value);
      });
      await multi.exec();
      return 'OK';
    } catch (err) {
      this.logger.error(`Redis MSET failed:`, err);
      return 'OK';
    }
  }

  /**
   * Check and set lock
   */
  async acquireLock(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      const result = await this.client.set(key, '1', 'NX', 'PX', ttlSeconds * 1000);
      return result === 'OK';
    } catch (err) {
      this.logger.error(`Redis ACQUIRE LOCK failed for key ${key}:`, err);
      return false;
    }
  }

  /**
   * Release lock
   */
  async releaseLock(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (err) {
      this.logger.error(`Redis RELEASE LOCK failed for key ${key}:`, err);
    }
  }

  /**
   * Add to sorted set
   */
  async zAdd(key: string, score: number, value: string): Promise<number> {
    try {
      return await this.client.zadd(key, score, value);
    } catch (err) {
      this.logger.error(`Redis ZADD failed for key ${key}:`, err);
      return 0;
    }
  }

  /**
   * Get range from sorted set
   */
  async zRange(key: string, start: number, end: number): Promise<string[]> {
    try {
      return await this.client.zrange(key, start, end);
    } catch (err) {
      this.logger.error(`Redis ZRANGE failed for key ${key}:`, err);
      return [];
    }
  }

  /**
   * Remove from sorted set
   */
  async zRem(key: string, value: string): Promise<number> {
    try {
      return await this.client.zrem(key, value);
    } catch (err) {
      this.logger.error(`Redis ZREM failed for key ${key}:`, err);
      return 0;
    }
  }

  /**
   * Get sorted set size
   */
  async zCard(key: string): Promise<number> {
    try {
      return await this.client.zcard(key);
    } catch (err) {
      this.logger.error(`Redis ZCARD failed for key ${key}:`, err);
      return 0;
    }
  }

  /**
   * Add to list
   */
  async lPush(key: string, value: string): Promise<number> {
    try {
      return await this.client.lpush(key, value);
    } catch (err) {
      this.logger.error(`Redis LPUSH failed for key ${key}:`, err);
      return 0;
    }
  }

  /**
   * Remove from list
   */
  async lPop(key: string): Promise<string | null> {
    try {
      return await this.client.lpop(key);
    } catch (err) {
      this.logger.error(`Redis LPOP failed for key ${key}:`, err);
      return null;
    }
  }

  /**
   * Get list length
   */
  async lLen(key: string): Promise<number> {
    try {
      return await this.client.llen(key);
    } catch (err) {
      this.logger.error(`Redis LLEN failed for key ${key}:`, err);
      return 0;
    }
  }

  /**
   * Get list range
   */
  async lRange(key: string, start: number, end: number): Promise<string[]> {
    try {
      return await this.client.lrange(key, start, end);
    } catch (err) {
      this.logger.error(`Redis LRANGE failed for key ${key}:`, err);
      return [];
    }
  }

  /**
   * Publish to channel
   */
  async publish(channel: string, message: string): Promise<number> {
    try {
      return await this.publisher.publish(channel, message);
    } catch (err) {
      this.logger.error(`Redis PUBLISH failed for channel ${channel}:`, err);
      return 0;
    }
  }

  /**
   * Subscribe to channel
   */
  async subscribe(channel: string): Promise<void> {
    try {
      await this.subscriber.subscribe(channel);
    } catch (err) {
      this.logger.error(`Redis SUBSCRIBE failed for channel ${channel}:`, err);
    }
  }

  /**
   * Unsubscribe from channel
   */
  async unsubscribe(channel: string): Promise<void> {
    try {
      await this.subscriber.unsubscribe(channel);
    } catch (err) {
      this.logger.error(`Redis UNSUBSCRIBE failed for channel ${channel}:`, err);
    }
  }
