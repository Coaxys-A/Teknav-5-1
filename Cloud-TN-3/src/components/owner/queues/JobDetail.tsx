'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Play, RotateCcw, Trash2, ChevronDown, Clock, CheckCircle2, XCircle, Activity } from 'lucide-react';
import { formatDate, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

/**
 * Job Detail Component
 *
 * Displays job details:
 * - Payload JSON viewer
 * - Attempts + stack trace
 * - Timeline (created/processed/completed/failed)
 * - Replay/Remove buttons
 */

interface Job {
  id: string;
  name: string;
  data: any;
  progress: number;
  returnvalue: any;
  stacktrace: string[];
  failedReason: any;
  attemptsMade: number;
  processedOn: Date;
  finishedOn: Date;
  isFailed: boolean;
  isCompleted: boolean;
  idempotencyKey?: string;
  timeline: {
    created: Date;
    processed?: Date;
    completed?: Date;
    failed?: Date;
  };
}

interface JobDetailProps {
  job: Job | null;
  onRetry?: () => void;
  onRemove?: () => void;
  onReplay?: () => void;
  onMoveToDLQ?: () => void;
}

export function JobDetail({ job, onRetry, onRemove, onReplay, onMoveToDLQ }: JobDetailProps) {
  const [isPayloadExpanded, setIsPayloadExpanded] = useState(false);
  const [isStackExpanded, setIsStackExpanded] = useState(false);

  if (!job) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Select a job to view details.</p>
      </div>
    );
  }

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(job.data, null, 2));
    toast({ title: 'Payload copied to clipboard' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Job {job.id.substring(0, 8)}...</h2>
          <p className="text-sm text-muted-foreground">
            {job.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {job.isFailed ? (
            <Badge variant="destructive" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Failed
            </Badge>
          ) : job.isCompleted ? (
            <Badge variant="default" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Completed
            </Badge>
          ) : (
            <Badge variant="secondary" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              In Progress
            </Badge>
          )}
        </div>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Timeline</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Payload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payload</CardTitle>
        </CardHeader>
        <CardContent>
          <Collapsible open={isPayloadExpanded} onOpenChange={setIsPayloadExpanded}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">
                {JSON.stringify(job.data).length} bytes
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyPayload}
              >
                Copy
              </Button>
            </div>
            <CollapsibleContent>
              <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
                {JSON.stringify(job.data, null, 2)}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Attempts + Stack Trace */}
      {job.stacktrace && job.stacktrace.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Attempts & Stack Trace</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  Attempts Made
                </div>
                <Badge variant="outline">{job.attemptsMade}</Badge>
              </div>
              <Collapsible open={isStackExpanded} onOpenChange={setIsStackExpanded}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full">
                    View Stack Trace
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <pre className="bg-red-50 text-red-900 p-4 rounded-md overflow-x-auto text-xs mt-2">
                    {job.stacktrace.join('\n\n')}
                  </pre>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        {job.isFailed && onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        )}
        {job.isFailed && onReplay && (
          <Button variant="outline" size="sm" onClick={onReplay}>
            <Play className="h-4 w-4 mr-2" />
            Replay
          </Button>
        )}
        {job.isFailed && onMoveToDLQ && (
          <Button variant="outline" size="sm" onClick={onMoveToDLQ}>
            <Trash2 className="h-4 w-4 mr-2" />
            Move to DLQ
          </Button>
        )}
        {onRemove && (
          <Button variant="destructive" size="sm" onClick={onRemove}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}
