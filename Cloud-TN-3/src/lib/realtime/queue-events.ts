import { useEffect, useRef } from 'react';

/**
 * Queue Events Realtime Lib
 *
 * Subscribes to Redis pub/sub channel via SSE/WS.
 * Forwards events to callback.
 */

export interface QueueEvent {
  type: 'queue.stats' | 'job.completed' | 'job.failed' | 'job.stalled' | 'dlq.added' | 'queue.paused' | 'queue.resumed';
  queueName: string;
  jobId?: string;
  stats?: any;
  data?: any;
  timestamp: Date;
}

/**
 * Subscribe to Queue Events
 *
 * Uses SSE for server-sent events.
 * Returns a cleanup function to close connection.
 */
export function subscribeToQueueEvents(
  callback: (event: QueueEvent) => void,
): () => void {
  const EVENT_STREAM_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/realtime/queue-events`;

  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const eventSource = new EventSource(EVENT_STREAM_URL);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('message', (e) => {
      try {
        const event: QueueEvent = JSON.parse(e.data);
        callback(event);
      } catch (error) {
        console.error('Failed to parse or forward Redis message:', error);
      }
    });

    eventSource.addEventListener('error', (e) => {
      console.error('Queue event stream error:', e);
    });

    // Cleanup on unmount
    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [callback]);

  // Return cleanup function
  return () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
  };
}
