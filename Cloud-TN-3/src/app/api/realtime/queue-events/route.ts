import { NextRequest } from 'next/server';

/**
 * Queue Events SSE Route
 *
 * Provides Server-Sent Events (SSE) for Queue Events.
 * Clients connect to this endpoint and receive real-time updates.
 * Channel: `teknav:owner:queue:events`
 */

export const runtime = 'nodejs'; // Force Node.js runtime for Redis connections

export async function GET(req: NextRequest) {
  // 1. Initialize Redis client
  // Note: We're using a singleton RedisService for this
  // For now, we'll create a new client per request (for SSE)
  // In production, use a shared connection pool
  const { RedisService } = await import('@/lib/redis/client');
  const redis = new RedisService();

  // 2. Prepare SSE headers
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable buffering in Nginx
  });

  // 3. Create a ReadableStream
  const { ReadableStream } = await import('stream/web');

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let subscriber: any = null;

      try {
        // 4. Subscribe to Redis channel
        subscriber = await redis.subscribe('teknav:owner:queue:events', (message) => {
          // Send event to client
          const data = `data: ${message}\n\n`;
          controller.enqueue(encoder.encode(data));
        });

        // 5. Send initial connection message
        const connected = `event: connected\ndata: ${JSON.stringify({ message: 'Connected to Queue Events' })}\n\n`;
        controller.enqueue(encoder.encode(connected));

        // 6. Keep connection alive (heartbeat every 30s)
        const heartbeatInterval = setInterval(() => {
          const ping = `: ping\n\n`;
          controller.enqueue(encoder.encode(ping));
        }, 30000);

        // 7. Handle request abort
        req.signal.addEventListener('abort', () => {
          clearInterval(heartbeatInterval);
          if (subscriber) {
            subscriber.unsubscribe();
          }
          controller.close();
        });
      } catch (error) {
        console.error('Failed to start SSE stream:', error);
        controller.close();
      }
    },
  });

  // 8. Return Response
  return new Response(stream, {
    headers,
  });
}
