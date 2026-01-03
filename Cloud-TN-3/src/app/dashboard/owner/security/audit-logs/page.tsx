'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw } from 'lucide-react';
import { getAuditLogs } from '@/lib/api/owner-security';
import { formatDate, formatDistanceToNow } from 'date-fns';

/**
 * Owner Security Audit Logs Page
 *
 * Displays AuditLog records.
 * Supports:
 * - Pagination
 * - Filtering (action, resource, actorId, date range)
 * - Live updates (manual refresh)
 */

export default function AuditLogsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [filterAction, setFilterAction] = useState('');
  const [filterResource, setFilterResource] = useState('');
  const [filterActorId, setFilterActorId] = useState('');

  // Load logs
  useEffect(() => {
    loadLogs();
  }, [page, filterAction, filterResource, filterActorId]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const response = await getAuditLogs({
        page,
        pageSize,
        action: filterAction || undefined,
        resource: filterResource || undefined,
        actorId: filterActorId ? parseInt(filterActorId) : undefined,
      });
      setLogs(response.data);
      setTotal(response.total);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to load audit logs', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={loadLogs}
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Filter by Action (e.g., user.ban)"
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
            />
            <Input
              placeholder="Filter by Resource (e.g., User, Article)"
              value={filterResource}
              onChange={(e) => setFilterResource(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
            />
            <Input
              type="number"
              placeholder="Filter by Actor ID"
              value={filterActorId}
              onChange={(e) => setFilterActorId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
            />
            <div className="flex items-end">
              <Button
                variant="default"
                size="sm"
                onClick={() => setPage(1)}
              >
                Apply
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Audit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">No audit logs found matching filters.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">ID</TableHead>
                  <TableHead>Actor ID</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Payload</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <span className="text-xs font-mono">{log.id}</span>
                    </TableCell>
                    <TableCell>
                      {log.actorUserId}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.action}</Badge>
                    </TableCell>
                    <TableCell>
                      {log.resource}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate text-xs text-muted-foreground">
                        {JSON.stringify(log.payload)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.payload?.ip || '-'}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs">
                        {formatDate(log.createdAt, 'PPpp')}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
