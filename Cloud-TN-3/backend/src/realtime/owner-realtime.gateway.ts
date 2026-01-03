import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PubSubService, EventSubscriber } from './pubsub.service';
import {
  RealtimeEvent,
  REALTIME_CHANNELS,
  RealtimeChannel,
  EVENT_SEVERITY,
} from '../queue/contracts';
import { PoliciesGuard } from '../auth/policy/policies.guard';
import { RequirePolicy } from '../auth/policy/policy.decorator';
import { Action, Resource } from '../auth/policy/policy.service';
import { AuthService } from '../auth/auth.service';

/**
 * Owner Realtime Gateway
 *
 * Provides WebSocket connection for owner dashboard.
 * Subscribes to Redis pub/sub channels and forwards events to connected clients.
 *
 * Rooms:
 * - room:owner:global (all owner events)
 * - room:owner:queue:<queueName> (queue-specific events)
 * - room:owner:workflows (workflow events)
 * - room:owner:analytics (analytics events)
 * - room:owner:plugins (plugin events)
 */

@WebSocketGateway({
  path: '/owner/realtime',
  cors: {
    origin: process.env.CORS_ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
  },
  namespace: '/owner',
})
@UseGuards(PoliciesGuard)
export class OwnerRealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(OwnerRealtimeGateway.name);
  private readonly clientRooms = new Map<string, Set<string>>();

  constructor(
    private readonly pubSub: PubSubService,
    private readonly authService: AuthService,
  ) {
    // Subscribe to all channels
    this.setupChannelSubscriptions();
  }

  // ==========================================================================
  // CONNECTION MANAGEMENT
  // ==========================================================================

  async handleConnection(@ConnectedSocket() client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);

    try {
      // Authenticate client
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        this.logger.warn(`Client ${client.id} disconnected: No token provided`);
        client.disconnect();
        return;
      }

      const user = await this.authService.validateToken(token);
      if (!user || user.role !== 'OWNER') {
        this.logger.warn(`Client ${client.id} disconnected: Invalid token or not owner`);
        client.disconnect();
        return;
      }

      // Attach user to socket
      client.data.user = user;

      // Join default rooms
      await client.join('room:owner:global');

      // Track client rooms
      this.clientRooms.set(client.id, new Set(['room:owner:global']));

      // Send latest events for all channels
      await this.sendLatestEvents(client);

      // Send welcome message
      client.emit('connected', {
        message: 'Connected to owner realtime',
        timestamp: Date.now(),
        userId: user.id,
      });

      this.logger.log(`Owner connected: ${user.email} (${client.id})`);
    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}:`, error);
      client.disconnect();
    }
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);

    // Clean up client rooms tracking
    const rooms = this.clientRooms.get(client.id);
    if (rooms) {
      rooms.forEach((room) => client.leave(room));
      this.clientRooms.delete(client.id);
    }

    this.logger.log(`Owner disconnected: ${client.id}`);
  }

  // ==========================================================================
  // CHANNEL SUBSCRIPTIONS
  // ==========================================================================

  /**
   * Setup subscriptions to all Redis pub/sub channels
   */
  private setupChannelSubscriptions() {
    const channels: Array<{ channel: RealtimeChannel; roomPrefix: string }> = [
      { channel: REALTIME_CHANNELS.OWNER_EVENTS, roomPrefix: 'room:owner:global' },
      { channel: REALTIME_CHANNELS.QUEUE_EVENTS, roomPrefix: 'room:owner:queue' },
      { channel: REALTIME_CHANNELS.WORKFLOW_EVENTS, roomPrefix: 'room:owner:workflows' },
      { channel: REALTIME_CHANNELS.ANALYTICS_EVENTS, roomPrefix: 'room:owner:analytics' },
      { channel: REALTIME_CHANNELS.PLUGIN_EVENTS, roomPrefix: 'room:owner:plugins' },
    ];

    channels.forEach(({ channel, roomPrefix }) => {
      const subscriber: EventSubscriber = {
        channel,
        callback: (event: RealtimeEvent) => this.handleChannelEvent(channel, roomPrefix, event),
      };

      this.pubSub.subscribe(subscriber);
      this.logger.debug(`Subscribed to channel: ${channel}`);
    });
  }

  /**
   * Handle event from a channel
   */
  private async handleChannelEvent(
    channel: RealtimeChannel,
    roomPrefix: string,
    event: RealtimeEvent,
  ) {
    try {
      // Determine target room
      let targetRoom = roomPrefix;

      // For queue events, also send to specific queue room
      if (channel === REALTIME_CHANNELS.QUEUE_EVENTS && event.queue) {
        targetRoom = `${roomPrefix}:${event.queue}`;
      }

      // Emit to all clients in the target room
      this.server.to(targetRoom).emit('event', event);

      this.logger.debug(`Event forwarded to room ${targetRoom}: ${event.type}`);
    } catch (error) {
      this.logger.error(`Failed to handle channel event:`, error);
    }
  }

  /**
   * Send latest events to new client
   */
  private async sendLatestEvents(client: Socket) {
    const channels = [
      REALTIME_CHANNELS.OWNER_EVENTS,
      REALTIME_CHANNELS.QUEUE_EVENTS,
      REALTIME_CHANNELS.WORKFLOW_EVENTS,
      REALTIME_CHANNELS.ANALYTICS_EVENTS,
      REALTIME_CHANNELS.PLUGIN_EVENTS,
    ];

    for (const channel of channels) {
      const latestEvent = await this.pubSub.getLatestEvent(channel);
      if (latestEvent) {
        client.emit('latest_event', { channel, event: latestEvent });
      }
    }
  }

  // ==========================================================================
  // MESSAGE HANDLERS
  // ==========================================================================

  /**
   * Ping/Pong for connection health check
   */
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    client.emit('pong', {
      timestamp: Date.now(),
      serverTime: new Date().toISOString(),
    });
  }

  /**
   * Subscribe to specific queue events
   */
  @SubscribeMessage('subscribe_queue')
  @RequirePolicy(Action.READ, Resource.QUEUE)
  async handleSubscribeQueue(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { queueName: string },
  ) {
    const { queueName } = payload;
    const roomName = `room:owner:queue:${queueName}`;

    await client.join(roomName);

    // Track room
    const rooms = this.clientRooms.get(client.id) || new Set();
    rooms.add(roomName);
    this.clientRooms.set(client.id, rooms);

    this.logger.debug(`Client ${client.id} joined queue room: ${queueName}`);

    client.emit('subscribed', {
      type: 'queue',
      channel: queueName,
      message: `Subscribed to queue events: ${queueName}`,
    });
  }

  /**
   * Unsubscribe from specific queue events
   */
  @SubscribeMessage('unsubscribe_queue')
  async handleUnsubscribeQueue(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { queueName: string },
  ) {
    const { queueName } = payload;
    const roomName = `room:owner:queue:${queueName}`;

    await client.leave(roomName);

    // Remove from tracking
    const rooms = this.clientRooms.get(client.id);
    if (rooms) {
      rooms.delete(roomName);
    }

    this.logger.debug(`Client ${client.id} left queue room: ${queueName}`);

    client.emit('unsubscribed', {
      type: 'queue',
      channel: queueName,
      message: `Unsubscribed from queue events: ${queueName}`,
    });
  }

  /**
   * Subscribe to workflow events
   */
  @SubscribeMessage('subscribe_workflows')
  @RequirePolicy(Action.READ, Resource.WORKFLOW)
  async handleSubscribeWorkflows(@ConnectedSocket() client: Socket) {
    await client.join('room:owner:workflows');

    // Track room
    const rooms = this.clientRooms.get(client.id) || new Set();
    rooms.add('room:owner:workflows');
    this.clientRooms.set(client.id, rooms);

    this.logger.debug(`Client ${client.id} joined workflows room`);

    client.emit('subscribed', {
      type: 'workflows',
      channel: 'workflows',
      message: 'Subscribed to workflow events',
    });
  }

  /**
   * Unsubscribe from workflow events
   */
  @SubscribeMessage('unsubscribe_workflows')
  async handleUnsubscribeWorkflows(@ConnectedSocket() client: Socket) {
    await client.leave('room:owner:workflows');

    // Remove from tracking
    const rooms = this.clientRooms.get(client.id);
    if (rooms) {
      rooms.delete('room:owner:workflows');
    }

    this.logger.debug(`Client ${client.id} left workflows room`);

    client.emit('unsubscribed', {
      type: 'workflows',
      channel: 'workflows',
      message: 'Unsubscribed from workflow events',
    });
  }

  /**
   * Subscribe to analytics events
   */
  @SubscribeMessage('subscribe_analytics')
  @RequirePolicy(Action.READ, Resource.ANALYTICS)
  async handleSubscribeAnalytics(@ConnectedSocket() client: Socket) {
    await client.join('room:owner:analytics');

    // Track room
    const rooms = this.clientRooms.get(client.id) || new Set();
    rooms.add('room:owner:analytics');
    this.clientRooms.set(client.id, rooms);

    this.logger.debug(`Client ${client.id} joined analytics room`);

    client.emit('subscribed', {
      type: 'analytics',
      channel: 'analytics',
      message: 'Subscribed to analytics events',
    });
  }

  /**
   * Unsubscribe from analytics events
   */
  @SubscribeMessage('unsubscribe_analytics')
  async handleUnsubscribeAnalytics(@ConnectedSocket() client: Socket) {
    await client.leave('room:owner:analytics');

    // Remove from tracking
    const rooms = this.clientRooms.get(client.id);
    if (rooms) {
      rooms.delete('room:owner:analytics');
    }

    this.logger.debug(`Client ${client.id} left analytics room`);

    client.emit('unsubscribed', {
      type: 'analytics',
      channel: 'analytics',
      message: 'Unsubscribed from analytics events',
    });
  }

  /**
   * Subscribe to plugin events
   */
  @SubscribeMessage('subscribe_plugins')
  @RequirePolicy(Action.READ, Resource.PLUGIN)
  async handleSubscribePlugins(@ConnectedSocket() client: Socket) {
    await client.join('room:owner:plugins');

    // Track room
    const rooms = this.clientRooms.get(client.id) || new Set();
    rooms.add('room:owner:plugins');
    this.clientRooms.set(client.id, rooms);

    this.logger.debug(`Client ${client.id} joined plugins room`);

    client.emit('subscribed', {
      type: 'plugins',
      channel: 'plugins',
      message: 'Subscribed to plugin events',
    });
  }

  /**
   * Unsubscribe from plugin events
   */
  @SubscribeMessage('unsubscribe_plugins')
  async handleUnsubscribePlugins(@ConnectedSocket() client: Socket) {
    await client.leave('room:owner:plugins');

    // Remove from tracking
    const rooms = this.clientRooms.get(client.id);
    if (rooms) {
      rooms.delete('room:owner:plugins');
    }

    this.logger.debug(`Client ${client.id} left plugins room`);

    client.emit('unsubscribed', {
      type: 'plugins',
      channel: 'plugins',
      message: 'Unsubscribed from plugin events',
    });
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Broadcast event to all connected clients
   */
  async broadcast(event: RealtimeEvent) {
    this.server.emit('event', event);
  }

  /**
   * Broadcast event to specific room
   */
  async broadcastToRoom(room: string, event: RealtimeEvent) {
    this.server.to(room).emit('event', event);
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.server?.sockets?.size || 0;
  }

  /**
   * Get rooms info
   */
  getRoomsInfo(): Record<string, number> {
    const rooms: Record<string, number> = {};
    this.server?.sockets?.rooms?.forEach((clients: any, room: string) => {
      rooms[room] = clients?.size || 0;
    });
    return rooms;
  }
}
