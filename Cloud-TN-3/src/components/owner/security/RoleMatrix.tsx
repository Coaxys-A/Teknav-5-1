'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RefreshCw, Undo, Save, Eye } from 'lucide-react';
import {
  getPolicyDocument,
  updateRolePermissions,
  restoreDefaultRolePermissions,
} from '@/lib/security/policy-client';
import { PolicyRole, PolicyAction, PolicyResource, PolicyDocument } from '@/lib/security/policy-types';

/**
 * Role Matrix Component
 *
 * Displays a grid of roles x resources/actions.
 * Allows toggling allow/deny per cell.
 * Supports:
 * - Filter by role or resource
 * - Restore defaults button
 * - Diff preview modal (shows changes before saving)
 */

interface RolePermissions {
  actions: PolicyAction[];
  resource: PolicyResource;
  effect: 'allow' | 'deny';
  scope?: 'all' | 'own' | 'workspace';
}

interface RoleMatrixProps {
  policy: PolicyDocument;
  onRefresh: () => void;
}

export function RoleMatrix({ policy, onRefresh }: RoleMatrixProps) {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<PolicyRole | null>(null);
  const [editing, setEditing] = useState(false);
  const [localPermissions, setLocalPermissions] = useState<Map<string, RolePermissions>>(new Map());
  const [diffDialog, setDiffDialog] = useState(false);
  const [diffPreview, setDiffPreview] = useState<any>(null);

  const roles = Object.values(PolicyRole);
  const resources = Object.values(PolicyResource);
  const actions = Object.values(PolicyAction);

  // Load permissions for selected role
  useEffect(() => {
    if (selectedRole && policy.roles[selectedRole]) {
      const rolePermissions = policy.roles[selectedRole].permissions;
      const map = new Map<string, RolePermissions>();

      rolePermissions.forEach(p => {
        const key = `${p.resource}:${p.action}`;
        map.set(key, p);
      });

      setLocalPermissions(map);
    }
  }, [selectedRole, policy]);

  // Handle cell toggle
  const handleToggle = (resource: PolicyResource, action: PolicyAction) => {
    if (!selectedRole) return;

    const key = `${resource}:${action}`;
    const current = localPermissions.get(key);
    const newEffect = current?.effect === 'allow' ? 'deny' : 'allow';

    const updated: RolePermissions = {
      actions: current?.actions || [],
      resource,
      effect: newEffect,
      scope: current?.scope || 'all',
    };

    const newMap = new Map(localPermissions);
    newMap.set(key, updated);

    setLocalPermissions(newMap);
    setEditing(true);
  };

  // Handle save
  const handleSave = async () => {
    if (!selectedRole) return;

    try {
      const permissions = Array.from(localPermissions.values());
      await updateRolePermissions(selectedRole, permissions);
      toast({ title: 'Role permissions updated' });
      setEditing(false);
      onRefresh();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to update permissions', description: error.message });
    }
  };

  // Handle restore defaults
  const handleRestoreDefaults = async () => {
    if (!selectedRole) return;

    try {
      await restoreDefaultRolePermissions(selectedRole);
      toast({ title: 'Default permissions restored' });
      setEditing(false);
      onRefresh();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to restore defaults', description: error.message });
    }
  };

  // Handle diff preview
  const handleDiffPreview = () => {
    if (!selectedRole) return;

    const originalPermissions = policy.roles[selectedRole].permissions;
    const updatedPermissions = Array.from(localPermissions.values());

    const diff = {
      added: [],
      removed: [],
      modified: [],
    };

    originalPermissions.forEach(orig => {
      const updated = updatedPermissions.find(u => u.resource === orig.resource && u.actions[0] === orig.actions[0]);
      if (!updated) {
        diff.removed.push(orig);
      } else if (orig.effect !== updated.effect) {
        diff.modified.push({ original: orig, updated });
      }
    });

    updatedPermissions.forEach(updated => {
      const original = originalPermissions.find(o => o.resource === updated.resource && o.actions[0] === updated.actions[0]);
      if (!original) {
        diff.added.push(updated);
      }
    });

    setDiffPreview(diff);
    setDiffDialog(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">Role Permissions Matrix</h2>
          <Select value={selectedRole || ''} onValueChange={(v) => setSelectedRole(v as PolicyRole || null)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map(role => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {selectedRole && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDiffPreview}
                disabled={!editing}
              >
                <Eye className="h-4 w-4 mr-2" />
                Diff
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRestoreDefaults}
                disabled={!editing}
              >
                <Undo className="h-4 w-4 mr-2" />
                Restore Defaults
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!editing}
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </>
          )}
        </div>
      </div>

      {selectedRole && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Resource</TableHead>
              <TableHead className="w-[150px]">Actions</TableHead>
              {resources.map(resource => (
                <TableHead key={resource} className="text-center">
                  <Badge variant="outline">{resource}</Badge>
                </TableHead>
              ))}
              <TableHead>Effect</TableHead>
              <TableHead>Scope</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.map(resource => (
              <TableRow key={resource}>
                <TableCell>{resource}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-2">
                    {actions.slice(0, 5).map(action => {
                      const key = `${resource}:${action}`;
                      const perm = localPermissions.get(key);
                      const isAllowed = perm?.effect === 'allow';

                      return (
                        <div key={action} className="flex items-center gap-2 text-sm">
                          <span className="w-[100px]">{action}</span>
                          <Switch
                            checked={isAllowed}
                            onCheckedChange={() => handleToggle(resource as PolicyResource, action as PolicyAction)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </TableCell>
                {resources.map(r => (
                  <TableCell key={`${resource}-${r}`} className="text-center">
                    {actions.slice(0, 5).map(action => {
                      const key = `${r}:${action}`;
                      const perm = localPermissions.get(key);
                      const isAllowed = perm?.effect === 'allow';

                      return (
                        <div key={action} className="flex items-center justify-center h-8">
                          <Switch
                            checked={isAllowed}
                            onCheckedChange={() => handleToggle(r as PolicyResource, action as PolicyAction)}
                          />
                        </div>
                      );
                    })}
                  </TableCell>
                ))}
                <TableCell>
                  <Select
                    value={localPermissions.get(`${resource}:${actions[0]}`)?.scope || 'all'}
                    onValueChange={(v) => {
                      const key = `${resource}:${actions[0]}`;
                      const newMap = new Map(localPermissions);
                      const current = newMap.get(key);
                      newMap.set(key, { ...current!, scope: v as any });
                      setLocalPermissions(newMap);
                      setEditing(true);
                    }}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="own">Own</SelectItem>
                      <SelectItem value="workspace">Workspace</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Badge variant={localPermissions.get(`${resource}:${actions[0]}`)?.effect === 'allow' ? 'default' : 'destructive'}>
                    {localPermissions.get(`${resource}:${actions[0]}`)?.effect}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Diff Preview Modal */}
      <Dialog open={diffDialog} onOpenChange={setDiffDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Permission Changes Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {diffPreview && (
              <>
                {diffPreview.added.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2 text-green-600">Added Permissions</h3>
                    <div className="space-y-1">
                      {diffPreview.added.map((p, i) => (
                        <div key={i} className="bg-green-50 p-2 rounded text-xs">
                          <span className="font-medium">{p.resource}:</span> {p.actions.join(', ')} ({p.effect})
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {diffPreview.removed.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2 text-red-600">Removed Permissions</h3>
                    <div className="space-y-1">
                      {diffPreview.removed.map((p, i) => (
                        <div key={i} className="bg-red-50 p-2 rounded text-xs">
                          <span className="font-medium">{p.resource}:</span> {p.actions.join(', ')} ({p.effect})
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {diffPreview.modified.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2 text-yellow-600">Modified Permissions</h3>
                    <div className="space-y-1">
                      {diffPreview.modified.map((m, i) => (
                        <div key={i} className="bg-yellow-50 p-2 rounded text-xs">
                          <span className="font-medium">{m.original.resource}:</span> {m.original.actions.join(', ')} ({m.original.effect}) → {m.updated.effect}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiffDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setDiffDialog(false);
              handleSave();
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
