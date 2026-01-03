'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { OwnerPageShell } from '@/components/dashboard/owner/owner-page-shell';
import { OwnerPageHeader } from '@/components/owner/owner-page-header';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Trash2, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';

export default function OwnerDLQPage() {
  const { toast } = useToast();
  const [dlqJobs, setDlqJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedForReplay, setSelectedForReplay] = useState<any>(null);
  const [selectedForDelete, setSelectedForDelete] = useState<any>(null);
  const [replayDialog, setReplayDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);

  const fetchDlqJobs = async () => {
    setLoading(true);
    try {
      const result = await api.get('/owner/queues/dlq');
      setDlqJobs(result.data || []);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to load DLQ jobs', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchDlqJobs();
      toast({ title: 'DLQ refreshed' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to refresh DLQ', description: error.message });
    } finally {
      setRefreshing(false);
    }
  };

  const handleReplayJob = async (job: any) => {
    try {
      await api.post(`/owner/queues/dlq/${job.id}/replay`);
      toast({ title: 'DLQ Job Replayed', description: 'Job has been replayed to its original queue.' });
      setDlqJobs(dlqJobs.filter(j => j.id !== job.id));
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to replay DLQ job', description: error.message });
    }
  };

  const handleDeleteJob = async (job: any) => {
    try {
      await api.post(`/owner/queues/dlq/${job.id}/delete`);
      toast({ title: 'DLQ Job Deleted', description: 'DLQ job has been removed.' });
      setDlqJobs(dlqJobs.filter(j => j.id !== job.id));
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to delete DLQ job', description: error.message });
    }
  };

  const handleClearDlq = async () => {
    try {
      await api.post('/owner/queues/dlq/clear', { confirmToken: 'CONFIRM_CLEAR_DLQ' });
      toast({ title: 'DLQ Cleared', description: 'All DLQ jobs have been removed.' });
      await fetchDlqJobs();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to clear DLQ', description: error.message });
    }
  };

  const openReplayDialog = (job: any) => {
    setSelectedForReplay(job);
    setReplayDialog(true);
  };

  const openDeleteDialog = (job: any) => {
    setSelectedForDelete(job);
    setDeleteDialog(true);
  };

  useEffect(() => {
    fetchDlqJobs();
  }, []);

  return (
    <OwnerPageShell title="Dead Letter Queue" subtitle={`${dlqJobs.length} failed jobs`}>
      <OwnerPageHeader
        title="Dead Letter Queue (DLQ)"
        subtitle={`${dlqJobs.length} jobs permanently failed`}
        actionLabel="Refresh"
        actionIcon={<RefreshCw className="h-4 w-4" />}
        onAction={handleRefresh}
        disabled={refreshing}
      />

      <div className="space-y-4">
        {dlqJobs.map((job: any) => (
          <Card key={job.id}>
            <CardHeader className="flex items-start justify-between pb-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Failed
                  </Badge>
                  <span className="text-sm font-semibold">Job ID: {job.id}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Original Queue: <code className="bg-muted px-1 py-0.5 rounded">{job.data.originalQueue}</code>
                </div>
                <div className="text-xs text-muted-foreground">
                  Original Job ID: <code className="bg-muted px-1 py-0.5 rounded">{job.data.originalJobId}</code>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openReplayDialog(job)}>
                  <Play className="h-4 w-4 mr-2" />
                  Replay
                </Button>
                <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(job)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-semibold mb-1 text-destructive">Error</div>
                <div className="bg-destructive/10 p-3 rounded text-sm font-mono text-destructive break-words border border-destructive/20">
                  {job.data.error?.message || 'Unknown error'}
                </div>
              </div>

              {job.data.error?.stack && (
                <div>
                  <div className="text-sm font-semibold mb-1 text-muted-foreground">Stack Trace</div>
                  <div className="bg-muted/30 p-3 rounded text-xs font-mono overflow-auto max-h-40 border">
                    {job.data.error.stack}
                  </div>
                </div>
              )}

              <div>
                <div className="text-sm font-semibold mb-1 text-muted-foreground">Payload</div>
                <div className="bg-muted/30 p-3 rounded text-xs overflow-auto max-h-60 border">
                  <pre>{JSON.stringify(job.data.payload, null, 2)}</pre>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>First Failed:</span>
                  </div>
                  <span>{new Date(job.data.firstFailedAt).toLocaleString()}</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Last Failed:</span>
                  </div>
                  <span>{new Date(job.data.lastFailedAt).toLocaleString()}</span>
                </div>
                <div className="text-xs font-semibold text-blue-600">
                  {job.data.replayCount > 0 ? `Replayed ${job.data.replayCount} times` : 'Never replayed'}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {dlqJobs.length === 0 && !loading && (
          <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/20">
            <AlertCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No jobs in DLQ</h3>
            <p className="text-muted-foreground">Great job! All jobs are processing successfully.</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-t-blue-600"></div>
            <p className="mt-4 text-muted-foreground">Loading DLQ...</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-4 left-4 right-4 flex justify-end">
        <Button
          variant="destructive"
          size="lg"
          onClick={handleClearDlq}
          disabled={dlqJobs.length === 0 || loading}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All DLQ
        </Button>
      </div>

      <Dialog open={replayDialog} onOpenChange={setReplayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replay Job?</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Are you sure you want to replay job <code className="bg-muted px-1 py-0.5 rounded">{selectedForReplay?.id}</code> to its original queue <code className="bg-muted px-1 py-0.5 rounded">{selectedForReplay?.data?.originalQueue}</code>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setReplayDialog(false); setSelectedForReplay(null); }}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (selectedForReplay) {
                handleReplayJob(selectedForReplay);
                setReplayDialog(false);
              }
            }}>
              Replay Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Job?</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Are you sure you want to delete DLQ job <code className="bg-muted px-1 py-0.5 rounded">{selectedForDelete?.id}</code>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialog(false); setSelectedForDelete(null); }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => {
              if (selectedForDelete) {
                handleDeleteJob(selectedForDelete);
                setDeleteDialog(false);
              }
            }}>
              Delete Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OwnerPageShell>
  );
}
