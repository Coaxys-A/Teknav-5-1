'use client';

import { useState } from 'react';
import { EntityDrawer } from '@/components/owner/entity-drawer';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, RotateCcw } from 'lucide-react';

export function QueueDetailDrawer({ job, onRetry, onClose }: any) {
  if (!job) return null;

  return (
    <EntityDrawer
      isOpen={true}
      entity={job}
      entityType="Job"
      title="Job Details"
      onClose={onClose}
    >
      <div className="space-y-4">
        <div>
          <div className="text-sm font-semibold mb-1">Status</div>
          <div className="flex items-center gap-2">
            {job.failedReason ? (
              <span className="text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Failed
              </span>
            ) : job.finishedOn ? (
              <span className="text-green-600 flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Completed
              </span>
            ) : (
              <span className="text-blue-600">
                Active/Waiting
              </span>
            )}
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold mb-1">Attempts</div>
          <div className="text-lg font-bold">{job.attemptsMade || 0}</div>
        </div>

        <div>
          <div className="text-sm font-semibold mb-1">Progress</div>
          <div className="text-lg font-bold">{job.progress || 0}%</div>
        </div>

        <div>
          <div className="text-sm font-semibold mb-1">Timestamps</div>
          <div className="space-y-1 text-sm">
            <div>Created: {new Date(job.timestamp).toLocaleString()}</div>
            {job.processedOn && <div>Processed: {new Date(job.processedOn).toLocaleString()}</div>}
            {job.finishedOn && <div>Finished: {new Date(job.finishedOn).toLocaleString()}</div>}
          </div>
        </div>

        {job.failedReason && (
          <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
            <div className="text-sm font-semibold mb-1 text-destructive">Error</div>
            <div className="text-sm font-mono text-destructive break-words">
              {job.failedReason}
            </div>
            {job.stacktrace && (
              <div className="mt-2 text-xs text-destructive/80 break-words">
                {job.stacktrace.join('\n')}
              </div>
            )}
            {onRetry && (
              <Button
                variant="destructive"
                className="mt-4"
                onClick={onRetry}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Retry Job
              </Button>
            )}
          </div>
        )}

        <div>
          <div className="text-sm font-semibold mb-1">Payload</div>
          <pre className="bg-muted/30 p-3 rounded text-xs overflow-auto max-h-60">
            {JSON.stringify(job.data, null, 2)}
          </pre>
        </div>
      </div>
    </EntityDrawer>
  );
}
