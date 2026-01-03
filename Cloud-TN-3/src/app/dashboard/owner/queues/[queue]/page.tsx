'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, RefreshCw, Pause, Play, Trash2 } from 'lucide-react';
import { QueueDetailTabs } from '@/components/owner/queues/QueueDetailTabs';
import { getQueueStats, pauseQueue, resumeQueue, purgeQueue } from '@/lib/api/owner-queues';
import { subscribeToQueueEvents } from '@/lib/realtime/queue-events';

/**
 * Owner Queue Detail Page
 *
 * Displays details for a single queue.
 * Tabs: Jobs, Failed, DLQ, Metrics.
 * Supports:
 * - Job filtering by state
 * - DLQ replay/purge
 * - Queue control (pause/resume/purge)
 * - Live updates (via SSE/WS)
 */

export default function OwnerQueueDetailPage() {
  const params = useParams();
  const queueName = params.queue || '';
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [dlqJobs, setDlqJobs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('jobs');
  const [selectedState, setSelectedState] = useState<'waiting' | 'active' | 'completed' | 'failed' | 'delayed'>('waiting');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);

  // Load initial data
  useState(() => {
    loadData();
  });

  const loadData = async () => {
    setLoading(true);
    try {
      // Load stats
      const statsRes = await getQueueStats(queueName);
      setStats(statsRes.data);

      // Load jobs (based on selected state)
      // Note: getQueueStats currently returns stats, we need a separate call for jobs
      // For now, we'll assume jobs are empty or fetch from specific endpoint
      const jobsRes = await fetch(`/api/owner/queues/${queueName}/jobs?state=${selectedState}&page=${page}&pageSize=${pageSize}`, {
        method: 'GET',
      }).then(r => r.json());

      setJobs(jobsRes.data);

      // Load DLQ jobs
      const dlqRes = await fetch(`/api/owner/queues/${queueName}/dlq?page=${page}&pageSize=${pageSize}`, {
        method: 'GET',
      }).then(r => r.json());

      setDlqJobs(dlqRes.data);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to load queue data', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Live updates (SSE)
  useEffect(() => {
    const eventSource = subscribeToQueueEvents((event) => {
      if (event.queueName === queueName) {
        // Update stats
        if (event.type === 'queue.stats') {
          setStats(event.stats);
        } else if (event.type === 'job.completed' || event.type === 'job.failed') {
          // Reload jobs if tab is active
          if (activeTab === 'jobs' || activeTab === 'failed') {
            loadData();
          }
        } else if (event.type === 'dlq.added') {
          // Reload DLQ if tab is active
          if (activeTab === 'dlq') {
            loadData();
          }
        }
      }
    });

    return () => {
      eventSource.close();
    };
  }, [queueName, activeTab, selectedState, page]);

  // Handle queue control
  const handlePause = async () => {
    try {
      await pauseQueue(queueName);
      toast({ title: `Queue ${queueName} paused` });
      loadData();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to pause queue', description: error.message });
    }
  };

  const handleResume = async () => {
    try {
      await resumeQueue(queueName);
      toast({ title: `Queue ${queueName} resumed` });
      loadData();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to resume queue', description: error.message });
    }
  };

  const handlePurge = async () => {
    if (!confirm(`Are you sure you want to purge queue ${queueName}? This will delete all jobs.`)) {
      return;
    }

    try {
      await purgeQueue(queueName);
      toast({ title: `Queue ${queueName} purged` });
      loadData();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to purge queue', description: error.message });
    }
  };

  // Handle job action
  const handleJobAction = async (jobId: string, action: 'retry' | 'remove') => {
    try {
      if (action === 'retry') {
        await fetch(`/api/owner/queues/${queueName}/jobs/${jobId}/retry`, {
          method: 'POST',
        });
        toast({ title: 'Job retried' });
      } else if (action === 'remove') {
        await fetch(`/api/owner/queues/${queueName}/jobs/${jobId}/remove`, {
          method: 'POST',
        });
        toast({ title: 'Job removed' });
      }
      loadData();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to perform job action', description: error.message });
    }
  };

  // Handle DLQ action
  const handleDlqAction = async (dlqJobId: string, action: 'replay' | 'delete') => {
    try {
      if (action === 'replay') {
        await fetch(`/api/owner/queues/${queueName}/dlq/replay`, {
          method: 'POST',
          body: JSON.stringify({ dlqJobId }),
        });
        toast({ title: 'DLQ job replayed' });
      } else if (action === 'delete') {
        await fetch(`/api/owner/queues/${queueName}/dlq/delete`, {
          method: 'POST',
          body: JSON.stringify({ dlqJobId }),
        });
        toast({ title: 'DLQ job deleted' });
      }
      loadData();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to perform DLQ action', description: error.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.location.href = '/dashboard/owner/queues'}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Queue: {queueName}</h1>
          <Badge variant="outline" className="ml-2">BullMQ</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {stats && !stats.paused && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePause}
              disabled={loading}
            >
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          )}
          {stats && stats.paused && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResume}
              disabled={loading}
            >
              <Play className="h-4 w-4 mr-2" />
              Resume
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={handlePurge}
            disabled={loading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Purge
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Queue Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
                <div className="text-sm text-muted-foreground">Waiting</div>
                <div className="text-2xl font-bold">{stats?.waiting || 0}</div>
              </div>
            <div>
                <div className="text-sm text-muted-foreground">Active</div>
                <div className="text-2xl font-bold">{stats?.active || 0}</div>
              </div>
            <div>
                <div className="text-sm text-muted-foreground">Completed</div>
                <div className="text-2xl font-bold">{stats?.completed || 0}</div>
              </div>
            <div>
                <div className="text-sm text-muted-foreground">Failed</div>
                <div className="text-2xl font-bold">{stats?.failed || 0}</div>
              </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <QueueDetailTabs
        queueName={queueName}
        jobs={jobs}
        dlqJobs={dlqJobs}
        stats={stats || {}}
        onJobAction={handleJobAction}
        onDlqAction={handleDlqAction}
        onTabChange={setActiveTab}
        onStateChange={setSelectedState}
      />
    </div>
  );
}
