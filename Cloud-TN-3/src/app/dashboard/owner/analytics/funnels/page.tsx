'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { OwnerPageShell } from '@/components/dashboard/owner/owner-page-shell';
import { OwnerPageHeader } from '@/components/owner/owner-page-header';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash, FunnelIcon, BarChart } from 'lucide-react';

export default function OwnerAnalyticsFunnelsPage() {
  const { toast } = useToast();
  const [funnels, setFunnels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [newFunnel, setNewFunnel] = useState<any>({});

  const fetchFunnels = async () => {
    setLoading(true);
    try {
      const result = await api.get('/api/owner/analytics/funnels');
      setFunnels(result.data || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to load funnels', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFunnels();
  }, []);

  const handleCreate = async () => {
    try {
      await api.post('/api/owner/analytics/funnels', newFunnel);
      toast({ title: 'Funnel created', description: 'Funnel created successfully.' });
      setCreateDialog(false);
      setNewFunnel({});
      await fetchFunnels();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to create funnel', description: error.message });
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm('Are you sure you want to delete this funnel?')) return;

    try {
      await api.del(`/api/owner/analytics/funnels/${key}`);
      toast({ title: 'Funnel deleted', description: 'Funnel deleted successfully.' });
      await fetchFunnels();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to delete funnel', description: error.message });
    }
  };

  return (
    <OwnerPageShell title="Analytics - Funnels" subtitle={`${funnels.length} funnels`}>
      <OwnerPageHeader
        title="Analytics Funnels"
        subtitle={`${funnels.length} funnels configured`}
        actionLabel="Create Funnel"
        actionIcon={<Plus className="h-4 w-4" />}
        onAction={() => setCreateDialog(true)}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {funnels.map((funnel) => (
          <div key={funnel.key} className="border rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FunnelIcon className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">{funnel.name}</h3>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => window.location.href = `/dashboard/owner/analytics/funnels/${funnel.key}`}>
                  <BarChart className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(funnel.key)}>
                  <Trash className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Key: <code className="bg-muted px-1 py-0.5 rounded">{funnel.key}</code>
            </div>
            <div className="text-sm">
              Steps: <span className="font-semibold">{funnel.steps?.length || 0}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Dialog */}
      {createDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-background rounded-lg p-6 w-full max-w-md space-y-4">
            <h2 className="text-xl font-bold">Create Funnel</h2>
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium">Key</label>
                <Input
                  placeholder="unique-funnel-key"
                  value={newFunnel.key || ''}
                  onChange={(e) => setNewFunnel({ ...newFunnel, key: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  placeholder="My Funnel"
                  value={newFunnel.name || ''}
                  onChange={(e) => setNewFunnel({ ...newFunnel, name: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setCreateDialog(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create</Button>
            </div>
          </div>
        </div>
      )}
    </OwnerPageShell>
  );
}
