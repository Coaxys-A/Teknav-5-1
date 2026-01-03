'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { OwnerPageShell } from '@/components/dashboard/owner/owner-page-shell';
import { OwnerPageHeader } from '@/components/owner/owner-page-header';
import { api } from '@/lib/api-client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Eye, Click, Search, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function OwnerAnalyticsOverviewPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<any>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [realtime, setRealtime] = useState<any>(null);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const result = await api.get('/api/owner/analytics/overview', {
        from: from || undefined,
        to: to || undefined,
      });
      setOverview(result.data || null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to load analytics', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchRealtime = async () => {
    try {
      const result = await api.get('/api/owner/analytics/realtime');
      setRealtime(result.data || null);
    } catch (error) {
      // Ignore realtime errors
    }
  };

  useEffect(() => {
    fetchOverview();
    fetchRealtime();

    // Refresh realtime every 15s
    const interval = setInterval(fetchRealtime, 15000);
    return () => clearInterval(interval);
  }, [from, to]);

  return (
    <OwnerPageShell title="Analytics Overview">
      <OwnerPageHeader
        title="Analytics Overview"
        subtitle={overview ? `${overview.totalViews.toLocaleString()} total views` : 'Loading...'}
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Views
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview?.totalViews?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {overview?.articleViews?.toLocaleString() || 0} article views
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Searches
            </CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview?.totalSearches?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 7 days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Clicks
            </CardTitle>
            <Click className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview?.totalClicks?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              External clicks
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Dashboard Views
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview?.totalDashboardViews?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Admin/Owner visits
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Daily Views</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="views" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground mt-2">
              Data available after aggregation runs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Daily Searches</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={[]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground mt-2">
              Data available after aggregation runs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Realtime Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Realtime Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Views (last 15 min)</span>
              </div>
              <span className="text-2xl font-bold">
                {realtime?.totalViews?.toLocaleString() || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Click className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Clicks (last 15 min)</span>
              </div>
              <span className="text-2xl font-bold">
                {realtime?.totalClicks?.toLocaleString() || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Searches (last 15 min)</span>
              </div>
              <span className="text-2xl font-bold">
                {realtime?.totalSearches?.toLocaleString() || 0}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Last updated: {realtime?.lastUpdated ? new Date(realtime.lastUpdated).toLocaleTimeString() : 'Never'}
            </p>
          </div>
        </CardContent>
      </Card>
    </OwnerPageShell>
  );
}
