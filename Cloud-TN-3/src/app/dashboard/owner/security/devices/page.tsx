'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, RefreshCw, Check, X, Fingerprint } from 'lucide-react';
import { getDevices, trustDevice, untrustDevice } from '@/lib/api/owner-security';
import { formatDate, formatDistanceToNow } from 'date-fns';

/**
 * Owner Security Devices Page
 *
 * Displays:
 * - List of UserDevice records
 * - Trust/Untrust Device
 * - Show Risk Signals (New IP, New UA)
 * - Live updates (manual refresh)
 */

export default function DevicesPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [filterUserId, setFilterUserId] = useState<string>('');

  // Load devices
  useEffect(() => {
    loadDevices();
  }, [page, filterUserId]);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const response = await getDevices({ page, pageSize, userId: filterUserId ? parseInt(filterUserId) : undefined });
      setDevices(response.data);
      setTotal(response.total);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to load devices', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Handle Trust
  const handleTrust = async (userId: number, deviceId: string) => {
    try {
      await trustDevice(userId, deviceId);
      toast({ title: 'Device trusted' });
      loadDevices();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to trust device', description: error.message });
    }
  };

  // Handle Untrust
  const handleUntrust = async (userId: number, deviceId: string) => {
    try {
      await untrustDevice(userId, deviceId);
      toast({ title: 'Device untrusted' });
      loadDevices();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to untrust device', description: error.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Devices</h1>
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
            onClick={loadDevices}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Devices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Devices</CardTitle>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">No devices found.</div>
          ) : (
            <div className="space-y-4">
              {devices.map(device => (
                <div key={`${device.userId}-${device.deviceId}`} className="border rounded-md p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">User ID: {device.userId}</span>
                      <Badge variant="outline" className="text-xs">{device.deviceId}</Badge>
                      {device.trusted ? (
                        <Badge variant="default" className="flex items-center gap-2">
                          <Shield className="h-3 w-3" />
                          Trusted
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex items-center gap-2">
                          <AlertTriangle className="h-3 w-3" />
                          Untrusted
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      IP: {device.ip}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      User Agent: {device.userAgent?.substring(0, 50)}...
                    </div>
                    <div className="text-xs text-muted-foreground">
                      First Seen: {formatDate(device.firstSeen, 'PPpp')} ({formatDistanceToNow(device.firstSeen, { addSuffix: true })})
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Last Used: {formatDate(device.lastUsed, 'PPpp')} ({formatDistanceToNow(device.lastUsed, { addSuffix: true })})
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {device.trusted ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUntrust(device.userId, device.deviceId)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Untrust
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleTrust(device.userId, device.deviceId)}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Trust
                      </Button>
                    )}
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
