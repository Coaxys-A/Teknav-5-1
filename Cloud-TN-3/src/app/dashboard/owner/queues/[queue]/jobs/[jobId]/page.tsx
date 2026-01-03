'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, RotateCcw, Trash2, ChevronDown, Clock, CheckCircle2, XCircle, Activity } from 'lucide-react';
import { JobDetail as JobDetailComponent } from '@/components/owner/queues/JobDetail';
import { getQueueJob, retryQueueJob, removeQueueJob } from '@/lib/api/owner-queues';
import { formatDate, formatDistanceToNow } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

/**
 * Owner Job Detail Page
 *
 * Displays job details:
 * - Payload JSON viewer
 * - Attempts + stack trace
 * - Timeline (created/processed/completed/failed)
 * - Replay/Remove buttons
 */

export default function OwnerJobDetailPage() {
  const params = useParams();
  const queueName = params.queue || '';
  const jobId = params.jobId || '';
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [job, setJob] = useState<any>(null);

  // Load job details
  useState(() => {
    loadJobDetails();
  });

  const loadJobDetails = async () => {
    setLoading(true);
    try {
      const response = await getQueueJob(queueName, jobId);
      setJob(response.data);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to load job details', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Handle retry
  const handleRetry = async () => {
    try {
      await retryQueueJob(queueName, jobId);
      toast({ title: 'Job retried' });
      loadJobDetails();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to retry job', description: error.message });
    }
  };

  // Handle remove
  const handleRemove = async () => {
    if (!confirm('Are you sure you want to delete this job?')) {
      return;
    }

    try {
      await removeQueueJob(queueName, jobId);
      toast({ title: 'Job removed' });
      window.location.href = `/dashboard/owner/queues/${queueName}`;
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to remove job', description: error.message });
    }
  };

  // Handle copy payload
  const handleCopyPayload = () => {
    if (job && job.data) {
      navigator.clipboard.writeText(JSON.stringify(job.data, null, 2));
      toast({ title: 'Payload copied to clipboard' });
    }
  };

  // Timeline formatter
  const renderTimeline = () => {
    if (!job || !job.timeline) {
      return null;
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-8 flex justify-center text-green-600">
            <Clock className="h-4 w-4" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="text-sm font-medium">Created</div>
            <div className="text-xs text-muted-foreground">
              {formatDate(job.timeline.created, 'PPpp')}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDistanceToNow(job.timeline.created, { addSuffix: true })}
            </div>
          </div>
        </div>
        {job.timeline.processed && (
          <div className="flex items-center gap-4">
            <div className="w-8 flex justify-center text-blue-600">
              <Activity className="h-4 w-4" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="text-sm font-medium">Processed</div>
              <div className="text-xs text-muted-foreground">
                {formatDate(job.timeline.processed, 'PPpp')}
              </div>
            </div>
          </div>
        )}
        {job.timeline.completed && (
          <div className="flex items-center gap-4">
            <div className="w-8 flex justify-center text-green-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="text-sm font-medium">Completed</div>
              <div className="text-xs text-muted-foreground">
                {formatDate(job.timeline.completed, 'PPpp')}
              </div>
            </div>
          </div>
        )}
        {job.timeline.failed && (
          <div className="flex items-center gap-4">
            <div className="w-8 flex justify-center text-red-600">
              <XCircle className="h-4 w-4" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="text-sm font-medium">Failed</div>
              <div className="text-xs text-muted-foreground">
                {formatDate(job.timeline.failed, 'PPpp')}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.location.href = `/dashboard/owner/queues/${queueName}`}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Job {jobId.substring(0, 8)}...</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadJobDetails}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {job && job.isFailed && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              disabled={loading}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={handleRemove}
            disabled={loading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Info */}
      {job && (
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">
              Name: <span className="font-medium text-foreground">{job.name}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              State: <span className="font-medium text-foreground">
                {job.isCompleted ? 'Completed' : job.isFailed ? 'Failed' : 'In Progress'}
              </span>
            </div>
            {job.idempotencyKey && (
              <div className="text-sm text-muted-foreground">
                Idempotency Key: <code className="bg-muted px-2 py-1 rounded text-xs">{job.idempotencyKey}</code>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {job.isCompleted ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-medium">Completed</span>
              </div>
            ) : job.isFailed ? (
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Failed</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-blue-600">
                <Activity className="h-5 w-5" />
                <span className="text-sm font-medium">In Progress</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="rounded-md border bg-muted/50">
        <div className="p-4">
          {job ? renderTimeline() : <p className="text-sm text-muted-foreground">Loading timeline...</p>}
        </div>
      </div>

      {/* Payload */}
      {job && job.data && (
        <div className="rounded-md border bg-white">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold">Payload</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyPayload}
            >
              Copy
            </Button>
          </div>
          <Collapsible open>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full flex items-center justify-between"
              >
                <span className="text-sm font-mono">{JSON.stringify(job.data).length} bytes</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <pre className="p-4 overflow-x-auto text-xs">
                {JSON.stringify(job.data, null, 2)}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      {/* Stack Trace */}
      {job && job.stacktrace && job.stacktrace.length > 0 && (
        <div className="rounded-md border bg-red-50">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold text-red-900">Stack Trace</h3>
            <div className="text-sm text-red-900">
              Attempts: <span className="font-medium">{job.attemptsMade}</span>
            </div>
          </div>
          <Collapsible open>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full flex items-center justify-between text-red-900 hover:text-red-950"
              >
                <span className="text-sm font-medium">View Stack Trace</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <pre className="p-4 overflow-x-auto text-xs text-red-900">
                {job.stacktrace.join('\n\n')}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </div>
  );
}
