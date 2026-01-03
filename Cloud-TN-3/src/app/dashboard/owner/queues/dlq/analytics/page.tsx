'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { OwnerPageHeader } from '@/components/owner/owner-page-header';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Trash2, RefreshCw, AlertCircle, TrendingUp, BarChart3, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function OwnerDLQAnalyticsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [timeRange, setTimeRange] = useState(24);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [replayDialog, setReplayDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [analyticsResult, trendsResult] = await Promise.all([
        api.get('/owner/queues/dlq/analytics'),
        api.get(`/owner/queues/dlq/trends?hours=${timeRange}`),
      ]);
      setAnalytics(analyticsResult.data);
      setTrends(trendsResult.data);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to load DLQ analytics', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchAnalytics();
      toast({ title: 'DLQ Analytics refreshed' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to refresh analytics', description: error.message });
    } finally {
      setRefreshing(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/owner/queues/dlq/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dlq_export_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: 'DLQ exported successfully' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to export DLQ', description: error.message });
    }
  };

  const handleReplayJob = async (job: any) => {
    try {
      await api.post(`/owner/queues/dlq/${job.id}/replay`);
      toast({ title: 'DLQ Job Replayed', description: 'Job has been replayed to its original queue.' });
      await fetchAnalytics();
      setReplayDialog(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to replay DLQ job', description: error.message });
    }
  };

  const handleDeleteJob = async (job: any) => {
    try {
      await api.post(`/owner/queues/dlq/${job.id}/delete`);
      toast({ title: 'DLQ Job Deleted', description: 'DLQ job has been removed.' });
      await fetchAnalytics();
      setDeleteDialog(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to delete DLQ job', description: error.message });
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  return (
    <div>
      <OwnerPageHeader
        title="DLQ Analytics Dashboard"
        subtitle="Analyze failure patterns and trends"
        actionLabel="Refresh"
        actionIcon={<RefreshCw className="h-4 w-4" />}
        onAction={handleRefresh}
        disabled={refreshing}
      />

      <div className="flex justify-end mb-6">
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={loading || !analytics}
        >
          <Download className="h-4 w-4 mr-2" />
          Export DLQ
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-t-blue-600"></div>
          <p className="mt-4 text-muted-foreground ml-4">Loading analytics...</p>
        </div>
      ) : (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="failures">Failures</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="replays">Replays</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total DLQ Jobs</CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.total || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Never Replayed</CardTitle>
                  <Play className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.neverReplayed || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Replayed</CardTitle>
                  <Play className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.replayed || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">High Replay Count</CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.highReplayCount || 0}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Failures by Queue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics?.byQueue || {}).slice(0, 10).map(([queue, count]) => (
                    <div key={queue} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{queue}</span>
                      <Badge variant="destructive">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Failures Tab */}
          <TabsContent value="failures" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Failing Job Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics?.byJobName || {}).slice(0, 10).map(([jobName, count]) => (
                    <div key={jobName} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{jobName}</span>
                      <Badge variant="destructive">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Common Error Reasons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics?.byReason || {}).slice(0, 10).map(([reason, count]) => (
                    <div key={reason} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground truncate flex-1">{reason}</span>
                        <Badge variant="destructive">{count}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Failure Trends</h3>
              <Select value={timeRange.toString()} onValueChange={(v) => setTimeRange(parseInt(v))}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last 1 hour</SelectItem>
                  <SelectItem value="6">Last 6 hours</SelectItem>
                  <SelectItem value="12">Last 12 hours</SelectItem>
                  <SelectItem value="24">Last 24 hours</SelectItem>
                  <SelectItem value="48">Last 48 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Total in Period</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{trends?.totalInPeriod || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average per Hour</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{trends?.avgPerHour?.toFixed(1) || 0}</div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Replays Tab */}
          <TabsContent value="replays" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Top Replayed Jobs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics?.topReplayedJobs || {}).slice(0, 10).map(([jobId, count]) => (
                    <div key={jobId} className="flex items-center justify-between">
                      <span className="text-sm font-mono truncate flex-1">{jobId}</span>
                      <Badge variant="outline" className="text-xs">Replayed {count}x</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Job Detail Dialog */}
      <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>DLQ Job Details</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4">
              <div>
                <div className="text-sm font-semibold mb-1">Job ID</div>
                <code className="bg-muted px-2 py-1 rounded text-sm">{selectedJob.id}</code>
              </div>
              <div>
                <div className="text-sm font-semibold mb-1">Original Queue</div>
                <Badge variant="outline">{selectedJob.data?.originalQueue}</Badge>
              </div>
              <div>
                <div className="text-sm font-semibold mb-1">Error</div>
                <div className="bg-destructive/10 p-3 rounded text-sm font-mono text-destructive break-words border border-destructive/20">
                  {selectedJob.data?.error?.message || 'Unknown error'}
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold mb-1">Payload</div>
                <div className="bg-muted/30 p-3 rounded text-xs overflow-auto max-h-60 border">
                  <pre>{JSON.stringify(selectedJob.data?.payload, null, 2)}</pre>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
