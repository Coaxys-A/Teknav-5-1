'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Power, Trash2, Laptop, AlertTriangle } from 'lucide-react';
import { getSessions, revokeSession, revokeAllUserSessions } from '@/lib/api/owner-security';
import { formatDate, formatDistanceToNow } from 'date-fns';

/**
 * Owner Security Sessions Page
 *
 * Displays active sessions.
 * Supports:
 * - List sessions (User ID filter)
 * - Revoke session
 * - Revoke all sessions for user
 * - Live updates (manual refresh)
 */

export default function SessionsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [filterUserId, setFilterUserId] = useState<string>('');

  // Load sessions
  useEffect(() => {
    loadSessions();
  }, [page, filterUserId]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const response = await getSessions({ page, pageSize, userId: filterUserId ? parseInt(filterUserId) : undefined });
      setSessions(response.data);
      setTotal(response.total);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to load sessions', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Handle Revoke Session
  const handleRevoke = async (sessionId: string) => {
    try {
      await revokeSession(sessionId);
      toast({ title: 'Session revoked' });
      loadSessions();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to revoke session', description: error.message });
    }
  };

  // Handle Revoke All User Sessions
  const handleRevokeAll = async (userId: number) => {
    if (!confirm(`Are you sure you want to revoke all sessions for user ${userId}?`)) {
      return;
    }

    try {
      const response = await revokeAllUserSessions(userId);
      toast({ title: `${response.count} sessions revoked` });
      loadSessions();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to revoke sessions', description: error.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Sessions</h1>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Filter by User ID..."
            className="border rounded-md px-3 py-1.5 text-sm w-64"
            value={filterUserId}
            onChange={e => setFilterUserId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && setPage(1)}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={loadSessions}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">No sessions found.</div>
          ) : (
            <div className="space-y-4">
              {sessions.map(session => (
                <div key={session.id} className="flex items-center justify-between border rounded-md p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">User ID: {session.userId}</span>
                      <Badge variant="outline">{session.deviceId}</Badge>
                      {session.revokedAt ? (
                        <Badge variant="destructive">Revoked</Badge>
                      ) : new Date(session.expiresAt) < new Date() ? (
                        <Badge variant="destructive">Expired</Badge>
                      ) : (
                        <Badge variant="default">Active</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Expires: {formatDate(session.expiresAt, 'PPpp')} ({formatDistanceToNow(session.expiresAt, { addSuffix: true })})
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Created: {formatDate(session.createdAt, 'PPpp')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {session.revokedAt || new Date(session.expiresAt) < new Date() ? (
                      <Badge variant="outline" className="text-muted-foreground flex items-center gap-2">
                        <Power className="h-3 w-3" />
                        Inactive
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground flex items-center gap-2">
                        <Laptop className="h-3 w-3" />
                        Active
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeAll(session.userId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
