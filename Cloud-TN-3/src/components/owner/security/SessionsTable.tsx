'use client';

import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Monitor, Trash2, LogOut, Shield, Smartphone, Globe } from 'lucide-react';
import { api } from '@/lib/api-client';
import { formatDistanceToNow } from 'date-fns';

/**
 * Sessions Table Component
 *
 * Lists active sessions for user.
 * Supports:
 * - Revoking single session
 * - Revoke all sessions (force logout)
 * - Display IP, User-Agent, Device ID, Last Used At
 * - Mask session token (show only first 8 chars)
 */

interface Session {
  id: string;
  sessionToken: string;
  ip: string;
  userAgent: string;
  deviceId: string;
  lastUsedAt: Date;
  createdAt: Date;
}

interface SessionsTableProps {
  userId: number;
  onRefresh: () => void;
}

export function SessionsTable({ userId, onRefresh }: SessionsTableProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [revokingAll, setRevokingAll] = useState(false);

  // Load sessions
  useEffect(() => {
    loadSessions();
  }, [userId]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/owner/security/sessions/${userId}`);
      setSessions(response.data);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to load sessions', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Handle revoke session
  const handleRevokeSession = async (sessionId: string) => {
    try {
      await api.post(`/owner/security/sessions/${sessionId}/revoke`);
      toast({ title: 'Session revoked successfully' });
      onRefresh();
      loadSessions();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to revoke session', description: error.message });
    }
  };

  // Handle revoke all sessions (force logout)
  const handleRevokeAllSessions = async () => {
    if (!confirm('Are you sure you want to revoke all sessions for this user? This will force them to logout.')) {
      return;
    }

    setRevokingAll(true);
    try {
      const response = await api.post(`/owner/security/users/${userId}/revoke-sessions`);
      toast({ title: `${response.data.count} sessions revoked` });
      onRefresh();
      loadSessions();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to revoke sessions', description: error.message });
    } finally {
      setRevokingAll(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Active Sessions ({sessions.length})</h3>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleRevokeAllSessions}
          disabled={revokingAll || loading || sessions.length === 0}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {revokingAll ? 'Revoking All...' : 'Revoke All Sessions'}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Device ID</TableHead>
            <TableHead>IP Address</TableHead>
            <TableHead>User Agent</TableHead>
            <TableHead>Last Used</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && sessions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                Loading sessions...
              </TableCell>
            </TableRow>
          ) : sessions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                No active sessions found for this user.
              </TableCell>
            </TableRow>
          ) : (
            sessions.map((session) => (
              <TableRow key={session.id}>
                <TableCell>
                  <code className="bg-muted px-2 py-1 rounded text-xs">
                    {session.sessionToken.substring(0, 8)}...
                  </code>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    <span className="font-mono text-xs">{session.deviceId}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span className="font-mono text-xs">{session.ip}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-[200px] truncate text-xs">
                    {session.userAgent}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs">
                      {session.lastUsedAt
                        ? formatDistanceToNow(new Date(session.lastUsedAt), { addSuffix: true })
                        : 'Never'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs">
                    {new Date(session.createdAt).toLocaleString()}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRevokeSession(session.id)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
