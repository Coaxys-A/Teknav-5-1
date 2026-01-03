'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { OwnerPageShell } from '@/components/dashboard/owner/owner-page-shell';
import { OwnerPageHeader } from '@/components/owner/owner-page-header';
import { api } from '@/lib/api-client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, AlertCircle, Play, Search, RotateCcw } from 'lucide-react';
import { EntityDrawer } from '@/components/owner/entity-drawer';
import { ConfirmDialog } from '@/components/owner/confirm-dialog';

export default function OwnerQueueDetailPage({ params }: { params: { name: string } }) {
  const { toast } = useToast();
  const { name } = params;
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('waiting');
  const [search, setSearch] = useState('');
  const [cursor, setCursor] = useState('');
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [viewDrawer, setViewDrawer] = useState(false);
  const [retryDialog, setRetryDialog] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const result = await api.get(`/api/owner/queues/${name}/jobs`, {
        state: activeTab,
        search,
        cursor,
      });
      setJobs(result.data || []);
      setCursor(result.nextCursor || '');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to load jobs', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRetryJob = async (job: any) => {
    try {
      await api.post(`/api/owner/queues/${name}/jobs/${job.id}/retry`);
      toast({ title: 'Job Retried', description: `Job ${job.id} has been retried.` });
      setRetryDialog(false);
      setSelectedJob(null);
      await fetchJobs();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to retry job', description: error.message });
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [name, activeTab, search, cursor]);

  return (
    <OwnerPageShell title={`Queue: ${name}`} subtitle={`${jobs.length} jobs`}>
      <OwnerPageHeader
        title={`Queue: ${name}`}
        subtitle={`${jobs.length} jobs in queue`}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="waiting">Waiting</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
          <TabsTrigger value="delayed">Delayed</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs by ID or payload..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={fetchJobs}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>

          <div className="space-y-2">
            {jobs.map((job: any) => (
              <div
                key={job.id}
                className="flex items-center justify-between border rounded-lg p-4 hover:bg-muted/50 cursor-pointer"
                onClick={() => {
                  setSelectedJob(job);
                  setViewDrawer(true);
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <Badge variant="outline">{job.id}</Badge>
                    {job.failedReason && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Failed
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Name: {job.name}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Attempts: {job.attemptsMade}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Progress: {job.progress}%</span>
                  </div>
                  {activeTab === 'failed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedJob(job);
                        setRetryDialog(true);
                      }}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <EntityDrawer
        isOpen={viewDrawer}
        entity={selectedJob}
        entityType="Job"
        title="Job Details"
        onClose={() => {
          setViewDrawer(false);
          setSelectedJob(null);
        }}
      />

      <ConfirmDialog
        isOpen={retryDialog}
        title="Retry Job"
        message={`Are you sure you want to retry job ${selectedJob?.id}?`}
        confirmLabel="Retry"
        cancelLabel="Cancel"
        onConfirm={handleRetryJob}
        onCancel={() => {
          setRetryDialog(false);
          setSelectedJob(null);
        }}
      />
    </OwnerPageShell>
  );
}
        </TabsContent>

      <EntityDrawer
        isOpen={viewDrawer}
        entity={selectedJob}
        entityType="Job"
        title="Job Details"
        onClose={() => {
          setViewDrawer(false);
          setSelectedJob(null);
        }}
      />

      <ConfirmDialog
        isOpen={retryDialog}
        title="Retry Job"
        message={`Are you sure you want to retry job ${selectedJob?.id}?`}
        confirmLabel="Retry"
        cancelLabel="Cancel"
        onConfirm={handleRetryJob}
        onCancel={() => {
          setRetryDialog(false);
          setSelectedJob(null);
        }}
      />
    </OwnerPageShell>
  );
}
