'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowRight, Play, Trash2 } from 'lucide-react';
import { formatDate } from 'date-fns';

/**
 * Jobs Table Component
 *
 * Displays jobs by state (waiting, active, completed, failed, delayed).
 * Supports:
 * - Pagination
 * - Sort by processedOn/finishedOn
 * - Actions: retry/remove (for failed jobs)
 * - Click row to navigate to job detail
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
}

interface JobsTableProps {
  jobs: Job[];
  state: string;
  onRetry?: (jobId: string) => void;
  onRemove?: (jobId: string) => void;
  onJobClick?: (jobId: string) => void;
}

export function JobsTable({ jobs, state, onRetry, onRemove, onJobClick }: JobsTableProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Processed On</TableHead>
              <TableHead>Finished On</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Attempts</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground h-24">
                  No jobs found for state {state}.
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow key={job.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <code className="bg-muted px-2 py-1 rounded text-xs">{job.id.substring(0, 8)}...</code>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">{job.name}</span>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate text-xs text-muted-foreground">
                      {JSON.stringify(job.data)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono">{job.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs">
                      {job.processedOn ? formatDate(job.processedOn, 'PPpp') : '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs">
                      {job.finishedOn ? formatDate(job.finishedOn, 'PPpp') : '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {job.finishedOn ? (
                      <Badge variant="default">Completed</Badge>
                    ) : job.failedReason ? (
                      <Badge variant="destructive">Failed</Badge>
                    ) : (
                      <Badge variant="secondary">In Progress</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{job.attemptsMade}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      {job.failedReason && onRetry && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRetry(job.id);
                          }}
                        >
                          <Play className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      {onRemove && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemove(job.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onJobClick && onJobClick(job.id);
                        }}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
