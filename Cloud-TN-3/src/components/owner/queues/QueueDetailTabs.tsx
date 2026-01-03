'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JobsTable } from './JobsTable';
import { DlqTable } from './DlqTable';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Queue Detail Tabs Component
 *
 * Displays queue details in tabs:
 * - Jobs (waiting, active, delayed, completed)
 * - Failed (same as DLQ but view-only)
 * - DLQ (dead-letter queue)
 * - Metrics (live stats)
 */

interface QueueDetailTabsProps {
  queueName: string;
  jobs: any[];
  dlqJobs: any[];
  stats: any;
  onJobAction: (jobId: string, action: 'retry' | 'remove') => void;
  onDlqAction: (dlqJobId: string, action: 'replay' | 'delete') => void;
  onTabChange: (tab: string) => void;
  onStateChange: (state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed') => void;
}

export function QueueDetailTabs({
  queueName,
  jobs,
  dlqJobs,
  stats,
  onJobAction,
  onDlqAction,
  onTabChange,
  onStateChange,
}: QueueDetailTabsProps) {
  const [selectedState, setSelectedState] = useState<'waiting' | 'active' | 'completed' | 'failed' | 'delayed'>('waiting');

  // Handle state selection
  const handleStateSelect = (state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed') => {
    setSelectedState(state);
    if (onStateChange) {
      onStateChange(state);
    }
  };

  return (
    <Tabs defaultValue="jobs" className="space-y-6" onValueChange={onTabChange}>
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="jobs">Jobs</TabsTrigger>
        <TabsTrigger value="failed">Failed</TabsTrigger>
        <TabsTrigger value="dlq">DLQ</TabsTrigger>
        <TabsTrigger value="metrics">Metrics</TabsTrigger>
      </TabsList>

      <TabsContent value="jobs">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Filter by state:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleStateSelect('waiting')}
                className={`px-3 py-1 rounded-md text-sm ${selectedState === 'waiting' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
              >
                Waiting
              </button>
              <button
                onClick={() => handleStateSelect('active')}
                className={`px-3 py-1 rounded-md text-sm ${selectedState === 'active' ? 'bg-blue-600 text-white' : 'bg-muted hover:bg-muted/80'}`}
              >
                Active
              </button>
              <button
                onClick={() => handleStateSelect('completed')}
                className={`px-3 py-1 rounded-md text-sm ${selectedState === 'completed' ? 'bg-green-600 text-white' : 'bg-muted hover:bg-muted/80'}`}
              >
                Completed
              </button>
              <button
                onClick={() => handleStateSelect('delayed')}
                className={`px-3 py-1 rounded-md text-sm ${selectedState === 'delayed' ? 'bg-yellow-600 text-white' : 'bg-muted hover:bg-muted/80'}`}
              >
                Delayed
              </button>
            </div>
          </div>
          <JobsTable
            jobs={jobs.filter(j => {
              if (selectedState === 'waiting') return true; // Waiting jobs don't have processedOn
              if (selectedState === 'active') return j.processedOn && !j.finishedOn;
              if (selectedState === 'completed') return j.finishedOn && !j.failedReason;
              if (selectedState === 'failed') return j.failedReason;
              if (selectedState === 'delayed') return j.opts.delay && j.opts.delay > 0;
              return false;
            })}
            state={selectedState}
            onRetry={onJobAction}
            onRemove={onJobAction}
            onJobClick={(jobId) => {
              window.location.href = `/dashboard/owner/queues/${queueName}/jobs/${jobId}`;
            }}
          />
        </div>
      </TabsContent>

      <TabsContent value="failed">
        <JobsTable
          jobs={jobs.filter(j => j.failedReason)}
          state="failed"
          onRetry={onJobAction}
          onRemove={onJobAction}
          onJobClick={(jobId) => {
            window.location.href = `/dashboard/owner/queues/${queueName}/jobs/${jobId}`;
          }}
        />
      </TabsContent>

      <TabsContent value="dlq">
        <DlqTable
          dlqJobs={dlqJobs}
          onReplay={onDlqAction}
          onDelete={onDlqAction}
          onJobClick={(dlqJobId) => {
            // TODO: Navigate to DLQ job detail page (optional)
          }}
        />
      </TabsContent>

      <TabsContent value="metrics">
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Waiting</div>
                <div className="text-2xl font-bold">{stats.waiting || 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Active</div>
                <div className="text-2xl font-bold">{stats.active || 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Completed</div>
                <div className="text-2xl font-bold">{stats.completed || 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Failed</div>
                <div className="text-2xl font-bold">{stats.failed || 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Delayed</div>
                <div className="text-2xl font-bold">{stats.delayed || 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Workers</div>
                <div className="text-2xl font-bold">{stats.workers || 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Rate</div>
                <div className="text-2xl font-bold">{stats.rate ? stats.rate.toFixed(2) : 0} job/s</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Avg Duration</div>
                <div className="text-2xl font-bold">{stats.avgDurationMs ? stats.avgDurationMs.toFixed(2) : 0}ms</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">P95 Duration</div>
                <div className="text-2xl font-bold">{stats.p95DurationMs ? stats.p95DurationMs.toFixed(2) : 0}ms</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Last Updated</div>
                <div className="text-xl font-bold">
                  {stats.lastUpdatedAt ? new Date(stats.lastUpdatedAt).toLocaleTimeString() : '-'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
