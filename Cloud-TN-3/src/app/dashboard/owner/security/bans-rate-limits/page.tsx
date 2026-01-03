'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, RefreshCw, Ban, Zap } from 'lucide-react';
import { getBans, unban, getRateLimitCounters, clearRateLimit } from '@/lib/api/owner-security';

/**
 * Owner Security Bans & Rate Limits Page
 *
 * Displays:
 * - Active Bans (from Redis)
 * - Rate Limit Counters (from Redis)
 * - Actions: Unban, Clear Counters
 * - Live updates (manual refresh)
 */

export default function BansRateLimitsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [bans, setBans] = useState<any[]>([]);
  const [counters, setCounters] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [filterType, setFilterType] = useState<string>('');

  // Load data
  useEffect(() => {
    loadData();
  }, [page, filterType]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bansRes, countersRes] = await Promise.all([
        getBans({ page, pageSize, type: filterType || undefined }),
        getRateLimitCounters({ page, pageSize, type: filterType || undefined }),
      ]);

      setBans(bansRes.data || []);
      setCounters(countersRes.data || []);
      setTotal(bansRes.total + countersRes.total);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to load security data', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Handle Unban
  const handleUnban = async (identifier: string, type: 'user' | 'ip') => {
    try {
      await unban({ identifier, type });
      toast({ title: `${type} ${identifier} unbanned` });
      loadData();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to unban', description: error.message });
    }
  };

  // Handle Clear Rate Limit
  const handleClearRateLimit = async (identifier: string, type: 'user' | 'ip' | 'token') => {
    if (!confirm(`Are you sure you want to clear rate limit counters for ${identifier}?`)) {
      return;
    }

    try {
      await clearRateLimit({ identifier, type });
      toast({ title: `Rate limit counters cleared for ${identifier}` });
      loadData();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to clear counters', description: error.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Bans & Rate Limits</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Bans Card */}
      <Card>
        <CardHeader>
          <CardTitle>Active Bans</CardTitle>
        </CardHeader>
        <CardContent>
          {bans.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">No active bans found.</div>
          ) : (
            <div className="space-y-4">
              {bans.map((ban, index) => (
                <div key={`${ban.type}-${ban.identifier}`} className="border rounded-md p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{ban.identifier}</span>
                      <Badge variant="destructive">BANNED</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Reason: {ban.reason}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Until: {ban.until ? new Date(ban.until).toLocaleString() : 'Unknown'}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnban(ban.identifier, ban.type)}
                  >
                    <Shield className="h-4 w-4" />
                    Unban
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rate Limits Card */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Limit Counters</CardTitle>
        </CardHeader>
        <CardContent>
          {counters.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">No rate limit counters found.</div>
          ) : (
            <div className="space-y-4">
              {counters.map((counter, index) => (
                <div key={`${counter.type}-${counter.identifier}`} className="border rounded-md p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{counter.identifier}</span>
                      <Badge variant="outline">{counter.type}</Badge>
                      <Badge variant="secondary">Count: {counter.count}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Type: {counter.type}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleClearRateLimit(counter.identifier, counter.type)}
                  >
                    <Zap className="h-4 w-4" />
                    Clear
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={page * pageSize >= total}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
