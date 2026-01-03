'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { OwnerPageShell } from '@/components/dashboard/owner/owner-page-shell';
import { OwnerPageHeader } from '@/components/owner/owner-page-header';
import { OwnerTableShell } from '@/components/owner/owner-table-shell';
import { ConfirmDialog } from '@/components/owner/confirm-dialog';
import { EntityDrawer } from '@/components/owner/entity-drawer';
import { TenantStatusBadge } from '@/components/owner/tenant-status-badge';
import { api } from '@/lib/api-client';
import { Eye, Pencil, Trash, Plus, Filter } from 'lucide-react';

export default function TenantsPage() {
  const { toast } = useToast();
  const [tenants, setTenants] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewDrawer, setViewDrawer] = useState(false);
  const [viewEntity, setViewEntity] = useState<any>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [restoreDialog, setRestoreDialog] = useState(false);
  const [selectedForAction, setSelectedForAction] = useState<any>(null);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const result = await api.get('/api/owner/tenants', {
        search,
        page,
        pageSize,
      });
      setTenants(result.data || []);
      setTotal(result.count || 0);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to load tenants', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, [search, page, pageSize]);

  const columns = [
    { key: 'id', header: 'ID', cell: (item) => item.id },
    { key: 'name', header: 'Name', cell: (item) => item.name },
    { key: 'status', header: 'Status', cell: (item) => <TenantStatusBadge status={item.status} /> },
    { key: 'primaryDomain', header: 'Primary Domain', cell: (item) => item.primaryDomain },
    { key: 'extraDomains', header: 'Extra Domains', cell: (item) => item.extraDomains?.join(', ') || '-' },
    { key: 'createdAt', header: 'Created At', cell: (item) => new Date(item.createdAt).toLocaleDateString() },
  ];

  const actions = (item: any) => [
    { label: 'View', icon: <Eye className="h-4 w-4" />, onClick: () => { setViewEntity(item); setViewDrawer(true); } },
    { label: 'Edit', icon: <Pencil className="h-4 w-4" />, onClick: () => { setViewEntity(item); setViewDrawer(true); } },
    { label: 'Delete', icon: <Trash className="h-4 w-4" />, variant: 'destructive', onClick: () => { setSelectedForAction(item); setDeleteDialog(true); } },
    ...(item.status === 'DISABLED' && [{ label: 'Restore', icon: <Trash className="h-4 w-4" />, onClick: () => { setSelectedForAction(item); setRestoreDialog(true); } }]),
  ];

  const handleCreate = () => {
    toast({ title: 'Create Tenant', description: 'Navigate to create page' });
  };

  const handleDelete = async () => {
    if (!selectedForAction) return;
    try {
      await api.del(`/api/owner/tenants/${selectedForAction.id}`);
      toast({ title: 'Tenant deleted', description: 'Tenant has been deleted successfully.' });
      setDeleteDialog(false);
      setSelectedForAction(null);
      await fetchTenants();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to delete tenant', description: error.message });
    }
  };

  const handleRestore = async () => {
    if (!selectedForAction) return;
    try {
      await api.post(`/api/owner/tenants/${selectedForAction.id}/restore`);
      toast({ title: 'Tenant restored', description: 'Tenant has been restored successfully.' });
      setRestoreDialog(false);
      setSelectedForAction(null);
      await fetchTenants();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to restore tenant', description: error.message });
    }
  };

  return (
    <OwnerPageShell title="Tenants" subtitle="Manage all tenants">
      <OwnerPageHeader
        title="Tenants"
        subtitle={`${total} total tenants`}
        actionLabel="Create Tenant"
        actionIcon={<Plus className="h-4 w-4" />}
        onAction={handleCreate}
      />
      
      <OwnerTableShell
        columns={columns}
        data={tenants}
        selected={selectedIds}
        actions={actions}
        onSelectAll={(checked) => setSelectedIds(checked ? new Set(tenants.map((t) => t.id.toString())) : new Set())}
        pageSize={pageSize}
        page={page}
        total={total}
      />
      
      <ConfirmDialog
        isOpen={deleteDialog}
        title="Delete Tenant"
        message="Are you sure you want to delete this tenant? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => { setDeleteDialog(false); setSelectedForAction(null); }}
      />
      
      <ConfirmDialog
        isOpen={restoreDialog}
        title="Restore Tenant"
        message="Are you sure you want to restore this tenant?"
        confirmLabel="Restore"
        cancelLabel="Cancel"
        onConfirm={handleRestore}
        onCancel={() => { setRestoreDialog(false); setSelectedForAction(null); }}
      />

      <EntityDrawer
        isOpen={viewDrawer}
        entity={viewEntity}
        title="Tenant Details"
        onClose={() => { setViewDrawer(false); setViewEntity(null); }}
      />
    </OwnerPageShell>
  );
}
