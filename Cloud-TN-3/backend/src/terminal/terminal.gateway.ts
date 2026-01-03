import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import type Redis from 'ioredis';
import { RedisService } from '../redis/redis.service';
import { TerminalSessionManager } from './terminal-session.manager';
import { BullQueueService } from '../queue/bullmq.service';

@Injectable()
@WebSocketGateway({
  cors: true,
  namespace: '/admin/live',
})
export class TerminalGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit, OnModuleDestroy {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TerminalGateway.name);
  private subscriber: Redis | null = null;
  private metricsTimer: NodeJS.Timeout | null = null;
  private readonly channel = 'teknav:terminal:events';
  private readonly queues = ['ai-content', 'ai-seo', 'workflow', 'plugin-webhook', 'analytics', 'email', 'otp'];

  constructor(
    private readonly redis: RedisService,
    private readonly sessions: TerminalSessionManager,
    private readonly bull: BullQueueService,
  ) {}

  async onModuleInit() {
    const client = this.redis.getClient();
    if (client) {
      this.subscriber = client.duplicate();
      await this.subscriber.connect();
      await this.subscriber.subscribe(this.channel);
      this.subscriber.on('message', (_channel, message) => {
        try {
          const payload = JSON.parse(message);
          this.server?.emit('terminal_event', payload);
        } catch {
          this.server?.emit('terminal_event', { level: 'info', message });
        }
      });
      this.logger.log(`Subscribed to ${this.channel}`);
    }
    this.metricsTimer = setInterval(() => this.pushMetrics(), 5000);
  }

  async onModuleDestroy() {
    if (this.subscriber) {
      await this.subscriber.unsubscribe(this.channel);
      await this.subscriber.quit();
    }
    if (this.metricsTimer) clearInterval(this.metricsTimer);
  }

  handleConnection(client: Socket) {
    const role = (client.handshake.auth?.role as string) || (client.handshake.headers['x-role'] as string) || '';
    const ip = client.handshake.address;
    if (!this.sessions.allowConnection(ip, role)) {
      client.emit('error', { message: 'unauthorized' });
      client.disconnect(true);
      return;
    }
    client.emit('terminal_event', { level: 'info', message: 'connected', ts: Date.now() });
    this.pushMetrics();
  }

  handleDisconnect(client: Socket) {
    this.sessions.release(client.handshake.address);
  }

  private async pushMetrics() {
    try {
      const queueStats = await Promise.all(this.queues.map(async (name) => ({ name, ...(await this.bull.metrics(name)) })));
      const redisClient = this.redis.getClient();
      const redisStatus = redisClient
        ? { status: redisClient.status, lastPing: await redisClient.ping() }
        : { status: 'rest-only', lastPing: 'ok' };
      const aiTasks = await this.redis.get('cache:ai:tasks:running');
      const workflows = await this.redis.get('cache:workflow:running');
      this.server?.emit('live_metrics', { queues: queueStats, redis: redisStatus, ai: aiTasks ?? [], workflows: workflows ?? [], ts: Date.now() });
    } catch (error) {
      this.logger.error('Failed to push metrics', (error as Error).stack);
    }
  }
}
