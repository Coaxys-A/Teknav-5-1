'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, RefreshCw, RotateCcw, Trash2 } from 'lucide-react';
import { DlqTable } from '@/components/owner/queues/DlqTable';
import { getDLQJobs, searchDLQJobs, replayDLQJob, replayDLQBatch, purgeDLQ, deleteDLQJob } from '@/lib/api/owner-queues';

/**
 * Owner Queue DLQ Page
 *
 * Displays DLQ jobs for a queue.
 * Supports:
 * - List jobs (with filters: time range, error type, job ID)
 * - Search jobs
 * - Replay single/batch
 * - Purge
 * - Live updates (via SSE/WS)
 */

export default function OwnerQueueDLQPage() {
  const params = useParams();
  const queueName = params.queue || '';
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [dlqJobs, setDlqJobs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Load initial data
  useState(() => {
    loadDLQJobs();
  });

  const loadDLQJobs = async () => {
    setLoading(true);
    try {
      if (selectedState) {
        const response = await getDLQJobs(queueName, { state: selectedState, page, pageSize });
        setDlqJobs(response.data);
        setTotal(response.total);
      } else {
        const response = await getDLQJobs(queueName, { page, pageSize });
        setDlqJobs(response.data);
        setTotal(response.total);
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to load DLQ jobs', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearch(query);
      loadDLQJobs();
      return;
    }

    setSearch(query);
    setLoading(true);
    try {
      const response = await searchDLQJobs(queueName, query, page, pageSize);
      setDlqJobs(response.data);
      setTotal(response.total);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to search DLQ jobs', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Handle replay single
  const handleReplay = async (dlqJobId: string) => {
    try {
      await replayDLQJob(queueName, dlqJobId);
      toast({ title: 'DLQ job replayed' });
      loadDLQJobs();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to replay DLQ job', description: error.message });
    }
  };

  // Handle replay batch
  const handleReplayBatch = async () => {
    if (selectedJobIds.length === 0) {
      toast({ title: 'Select at least one job to replay' });
      return;
    }

    try {
      const result = await replayDLQBatch(queueName, selectedJobIds);
      toast({ title: `${result.success} DLQ jobs replayed, ${result.failed} failed` });
      setSelectedJobIds([]);
      loadDLQJobs();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to replay DLQ batch', description: error.message });
    }
  };

  // Handle purge
  const handlePurge = async () => {
    if (!confirm(`Are you sure you want to purge DLQ for queue ${queueName}? This will delete all DLQ jobs.`)) {
      return;
    }

    try {
      const count = await purgeDLQ(queueName);
      toast({ title: `DLQ purged (${count} jobs)` });
      loadDLQJobs();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to purge DLQ', description: error.message });
    }
  };

  // Handle delete
  const handleDelete = async (dlqJobId: string) => {
    if (!confirm(`Are you sure you want to delete this DLQ job?`)) {
      return;
    }

    try {
      await deleteDLQJob(queueName, dlqJobId);
      toast({ title: 'DLQ job deleted' });
      loadDLQJobs();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to delete DLQ job', description: error.message });
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
            onClick={() => window.location.href = `/dashboard/owner/queues/${queueName}`}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">DLQ: {queueName}</h1>
          <Badge variant="destructive">Dead-Letter Queue</Badge>
        </div>
        <div className="flex items-center gap-2">
          {selectedJobIds.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReplayBatch}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Replay Batch ({selectedJobIds.length})
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={handlePurge}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Purge
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDLQJobs}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* DLQ Table */}
      <DlqTable
        dlqJobs={dlqJobs}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onReplay={handleReplay}
        onReplayBatch={handleReplayBatch}
        onDelete={handleDelete}
        onJobClick={(dlqJobId) => {
          // TODO: Navigate to DLQ job detail page (optional)
        }}
      />
    </div>
  );
}
