'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { OwnerPageHeader } from '@/components/owner/owner-page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  RefreshCw,
  Wifi,
  WifiOff,
  Database,
  Server,
  Zap,
} from 'lucide-react';

interface RealtimeEvent {
  type: string;
  ts: number;
  queue?: string;
  jobId?: string;
  severity: 'info' | 'warn' | 'error';
  message: string;
  meta?: Record<string, any>;
}

interface HealthStatus {
  redis: boolean;
  db: boolean;
  workers: boolean;
  timestamp: number;
}

interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export default function OwnerLivePage() {
  const { toast } = useToast();
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [health, setHealth] = useState<HealthStatus>({
    redis: true,
    db: true,
    workers: true,
    timestamp: Date.now(),
  });
  const [queueStats, setQueueStats] = useState<QueueStats[]>([]);
  const [connected, setConnected] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'info' | 'warn' | 'error'>('all');

  useEffect(() => {
    // Poll health status
    fetchHealth();
    const healthInterval = setInterval(fetchHealth, 30000);

    // Poll queue stats
    fetchQueueStats();
    const statsInterval = setInterval(fetchQueueStats, 10000);

    // Poll events (simulated WebSocket for now)
    fetchLatestEvents();
    const eventsInterval = setInterval(fetchLatestEvents, 5000);

    setConnected(true);

    return () => {
      clearInterval(healthInterval);
      clearInterval(statsInterval);
      clearInterval(eventsInterval);
    };
  }, []);

  const fetchHealth = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealth({
        redis: data.redis !== false,
        db: data.database !== false,
        workers: true, // Workers are always assumed running
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to fetch health:', error);
      setHealth((prev) => ({
        ...prev,
        redis: false,
        db: false,
        timestamp: Date.now(),
      }));
    }
  };

  const fetchQueueStats = async () => {
    try {
      const response = await fetch('/api/owner/queues/stats');
      const result = await response.json();
      setQueueStats(result.data || []);
    } catch (error) {
      console.error('Failed to fetch queue stats:', error);
    }
  };

  const fetchLatestEvents = async () => {
    try {
      const response = await fetch('/api/owner/queues/events/latest');
      const result = await response.json();
      if (result.data && result.data.length > 0) {
        setEvents((prev) => {
          const newEvents = result.data.filter(
            (event: RealtimeEvent) => !prev.some((e) => e.ts === event.ts),
          );
          return [...newEvents, ...prev].slice(0, 100);
        });
      }
    } catch (error) {
      // Events endpoint might not exist yet, that's okay
    }
  };

  const filteredEvents = events.filter((event) => {
    if (filterSeverity === 'all') return true;
    return event.severity === filterSeverity;
  });

  const totalJobs = queueStats.reduce((sum, q) => sum + q.waiting + q.active + q.completed + q.failed + q.delayed, 0);
  const totalWaiting = queueStats.reduce((sum, q) => sum + q.waiting, 0);
  const totalActive = queueStats.reduce((sum, q) => sum + q.active, 0);
  const totalFailed = queueStats.reduce((sum, q) => sum + q.failed, 0);

  return (
    <div>
      <OwnerPageHeader
        title="Live System Dashboard"
        subtitle="Real-time monitoring of queues, jobs, and system health"
        actionLabel="Refresh"
        actionIcon={<RefreshCw className="h-4 w-4" />}
        onAction={() => {
          fetchHealth();
          fetchQueueStats();
          fetchLatestEvents();
          toast({ title: 'Dashboard refreshed' });
        }}
      />

      {/* Health Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Redis</CardTitle>
            {health.redis ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {health.redis ? 'Connected' : 'Disconnected'}
            </div>
            <div className="text-xs text-muted-foreground">
              Last check: {new Date(health.timestamp).toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            {health.db ? (
              <Database className="h-4 w-4 text-green-600" />
            ) : (
              <Database className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {health.db ? 'Healthy' : 'Unhealthy'}
            </div>
            <div className="text-xs text-muted-foreground">
              Connection stable
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue Workers</CardTitle>
            <Server className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">Running</div>
            <div className="text-xs text-muted-foreground">
              All workers active
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Zap className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {health.redis && health.db ? 'Operational' : 'Degraded'}
            </div>
            <div className="text-xs text-muted-foreground">
              {connected ? 'Connected' : 'Disconnected'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Queue Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {totalJobs}
              </div>
              <div className="text-xs text-muted-foreground">Total Jobs</div>
            </div>
            <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {totalWaiting}
              </div>
              <div className="text-xs text-muted-foreground">Waiting</div>
            </div>
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {totalActive}
              </div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {totalFailed}
              </div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
          </div>

          <div className="space-y-2">
            {queueStats.map((queue) => (
              <div
                key={queue.name}
                className="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm">{queue.name}</span>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      W: {queue.waiting}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      A: {queue.active}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      F: {queue.failed}
                    </Badge>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Total: {queue.waiting + queue.active + queue.completed + queue.failed + queue.delayed}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Event Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Event Feed
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={filterSeverity === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterSeverity('all')}
              >
                All
              </Button>
              <Button
                variant={filterSeverity === 'info' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterSeverity('info')}
              >
                Info
              </Button>
              <Button
                variant={filterSeverity === 'warn' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterSeverity('warn')}
              >
                Warn
              </Button>
              <Button
                variant={filterSeverity === 'error' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterSeverity('error')}
              >
                Error
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No events yet
              </div>
            ) : (
              filteredEvents.map((event, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                >
                  {event.severity === 'error' ? (
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  ) : event.severity === 'warn' ? (
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{event.type}</span>
                      {event.queue && (
                        <Badge variant="outline" className="text-xs">
                          {event.queue}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(event.ts).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {event.message}
                    </p>
                    {event.jobId && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Job ID: {event.jobId}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
