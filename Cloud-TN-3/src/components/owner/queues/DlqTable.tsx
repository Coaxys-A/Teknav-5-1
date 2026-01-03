'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Trash2, ArrowRight, RotateCcw, AlertTriangle } from 'lucide-react';
import { formatDate } from 'date-fns';

/**
 * DLQ Table Component
 *
 * Displays DLQ jobs for a queue.
 * Supports:
 * - Pagination
 * - Sort by failedAt
 * - Filters (time range, error type, job ID)
 * - Actions: replay single/batch, delete
 * - Click row to navigate to DLQ job detail
 */

interface DlqJob {
  id: string;
  originalQueue: string;
  originalJobId: string;
  attemptsMade: number;
  error: string;
  stack?: string;
  failedAt: Date;
  payload: any;
}

interface DlqTableProps {
  dlqJobs: DlqJob[];
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onReplay?: (dlqJobId: string) => void;
  onReplayBatch?: (dlqJobIds: string[]) => void;
  onDelete?: (dlqJobId: string) => void;
  onJobClick?: (dlqJobId: string) => void;
}

export function DlqTable({
  dlqJobs,
  page,
  pageSize,
  total,
  onPageChange,
  onReplay,
  onReplayBatch,
  onDelete,
  onJobClick,
}: DlqTableProps) {
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);

  const handleSelectAll = () => {
    if (selectedJobIds.length === dlqJobs.length) {
      setSelectedJobIds([]);
    } else {
      setSelectedJobIds(dlqJobs.map(job => job.id));
    }
  };

  const handleSelectJob = (jobId: string) => {
    if (selectedJobIds.includes(jobId)) {
      setSelectedJobIds(selectedJobIds.filter(id => id !== jobId));
    } else {
      setSelectedJobIds([...selectedJobIds, jobId]);
    }
  };

  const handleReplayBatch = () => {
    if (onReplayBatch && selectedJobIds.length > 0) {
      onReplayBatch(selectedJobIds);
      setSelectedJobIds([]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}
          </div>
          {selectedJobIds.length > 0 && onReplayBatch && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{selectedJobIds.length} selected</Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReplayBatch}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Replay Batch
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page * pageSize >= total}
          >
            Next
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px] text-center">
                <input
                  type="checkbox"
                  checked={selectedJobIds.length === dlqJobs.length && dlqJobs.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4"
                />
              </TableHead>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead className="w-[200px]">Original Queue</TableHead>
              <TableHead className="w-[200px]">Original Job ID</TableHead>
              <TableHead>Error</TableHead>
              <TableHead className="w-[100px] text-center">Attempts</TableHead>
              <TableHead className="w-[150px]">Failed At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dlqJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground h-24">
                  No DLQ jobs found for this queue.
                </TableCell>
              </TableRow>
            ) : (
              dlqJobs.map((job) => (
                <TableRow key={job.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="text-center">
                    <input
                      type="checkbox"
                      checked={selectedJobIds.includes(job.id)}
                      onChange={() => handleSelectJob(job.id)}
                      className="w-4 h-4"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <code className="bg-muted px-2 py-1 rounded text-xs">{job.id.substring(0, 8)}...</code>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{job.originalQueue}</Badge>
                  </TableCell>
                  <TableCell>
                    <code className="bg-muted px-2 py-1 rounded text-xs">{job.originalJobId.substring(0, 8)}...</code>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <div className="max-w-[300px] truncate text-xs text-muted-foreground">
                        {job.error}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{job.attemptsMade}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs">{formatDate(job.failedAt, 'PPpp')}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      {onReplay && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            onReplay(job.id);
                          }}
                        >
                          <Play className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(job.id);
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
