'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Trash2, RefreshCw, BarChart3, Activity } from 'lucide-react';
import { QueueListTable } from '@/components/owner/queues/QueueListTable';
import { getQueueList, pauseQueue, resumeQueue, purgeQueue } from '@/lib/api/owner-queues';
import { subscribeToQueueEvents } from '@/lib/realtime/queue-events';

/**
 * Owner Queues Page
 *
 * Dashboard overview of all queues.
 * Displays:
 * - Queue List Table (with stats: waiting, active, completed, failed, delayed, paused, rate)
 * - Actions: pause/resume/purge
 * - Live updates (via SSE/WS)
 */

export default function OwnerQueuesPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [queues, setQueues] = useState<any[]>([]);

  // Load initial data
  useState(() => {
    loadQueues();
  });

  const loadQueues = async () => {
    setLoading(true);
    try {
      const response = await getQueueList();
      setQueues(response.data);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to load queues', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Handle queue action
  const handleQueueAction = async (queueName: string, action: 'pause' | 'resume' | 'purge') => {
    try {
      if (action === 'pause') {
        await pauseQueue(queueName);
        toast({ title: `Queue ${queueName} paused` });
      } else if (action === 'resume') {
        await resumeQueue(queueName);
        toast({ title: `Queue ${queueName} resumed` });
      } else if (action === 'purge') {
        if (!confirm(`Are you sure you want to purge queue ${queueName}? This will delete all jobs.`)) {
          return;
        }
        await purgeQueue(queueName);
        toast({ title: `Queue ${queueName} purged` });
      }

      // Refresh queues
      loadQueues();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to perform action', description: error.message });
    }
  };

  // Live updates (SSE)
  useState(() => {
    const eventSource = subscribeToQueueEvents((event) => {
      // Update queue stats if stats event or queue event
      if (event.type === 'queue.stats' || event.type === 'queue.paused' || event.type === 'queue.resumed') {
        setQueues(prevQueues => prevQueues.map(q => {
          if (q.name === event.queueName) {
            return { name: q.name, stats: event.stats || q.stats };
          }
          return q;
        }));
      }
    });

    return () => {
      eventSource.close();
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Queue Management</h1>
        </div>
        <Badge variant="outline">BullMQ</Badge>
        <Badge variant="outline" className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Live
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={loadQueues}
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Queue Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Manage and monitor all platform queues. View jobs, DLQ, and metrics.
            Actions include pause, resume, and purge.
          </p>
        </CardContent>
      </Card>

      {/* Queue List Table */}
      <QueueListTable
        queues={queues}
        onAction={handleQueueAction}
        onQueueClick={(queueName) => {
          window.location.href = `/dashboard/owner/queues/${queueName}`;
        }}
      />
    </div>
  );
}
