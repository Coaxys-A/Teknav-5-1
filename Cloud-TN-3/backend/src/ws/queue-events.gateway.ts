import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RedisService } from '../redis/redis.service';

/**
 * Queue Events Gateway
 *
 * Handles real-time queue events for Owner UI.
 * Subscribes to Redis pub/sub channel: `teknav:owner:queue:events`.
 * Forwards events to connected clients in `owner:queues` room.
 */

@WebSocketGateway({
  namespace: '/owner/queues',
  cors: { origin: process.env.FRONTEND_ORIGIN || '*' },
})
export class QueueEventsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(QueueEventsGateway.name);
  private readonly CHANNEL = 'teknav:owner:queue:events';

  constructor(
    @WebSocketServer() private readonly server: Server,
    private readonly redis: RedisService,
  ) {
    // Subscribe to Redis pub/sub
    this.subscribeToRedis();
  }

  // ==========================================================================
  // CONNECTION / DISCONNECTION
  // ==========================================================================

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    // Join owner:queues room
    client.join('owner:queues');

    // Send latest stats (optional)
    // We'll just send a welcome message for now
    client.emit('connected', { message: 'Connected to Owner Queues' });
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Leave room
    client.leave('owner:queues');
  }

  // ==========================================================================
  // REDIS PUB/SUB
  // ==========================================================================

  /**
   * Subscribe to Redis channel
   * Forwards messages to clients in owner:queues room
   */
  private async subscribeToRedis() {
    try {
      // Create a subscriber client
      const subscriber = await this.redis.getSubscriber();

      // Subscribe to channel
      await subscriber.subscribe(this.CHANNEL, (message) => {
        try {
          const data = JSON.parse(message);
          this.logger.debug(`Received event from Redis:`, data);

          // Forward to clients in owner:queues room
          this.server.to('owner:queues').emit('queue.event', data);
        } catch (error) {
          this.logger.error('Failed to parse or forward Redis message:', error);
        }
      });

      this.logger.log(`Subscribed to Redis channel: ${this.CHANNEL}`);
    } catch (error) {
      this.logger.error('Failed to subscribe to Redis channel:', error);
    }
  }
}
