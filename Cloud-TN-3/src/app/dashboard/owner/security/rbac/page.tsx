'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getRbacRules, saveRbacRule } from '@/lib/api/owner-security';

/**
 * Owner Security RBAC Page
 *
 * Displays:
 * - Current Policy Rules (list)
 * - Form to add/edit rule
 * - Save to Redis/Tenant.config
 */

export default function RbacPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState<any[]>([]);
  const [editingRule, setEditingRule] = useState<any | null>(null);
  const [formData, setFormData] = useState<any>({});

  // Load rules
  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    try {
      const response = await getRbacRules();
      setRules(response.data.rules || []);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to load RBAC rules', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Handle Save
  const handleSave = async () => {
    try {
      // Basic validation (Zod skipped for brevity, implement in real impl)
      if (!formData.id || !formData.effect || !formData.priority) {
        throw new Error('ID, Effect, and Priority are required');
      }

      await saveRbacRule(formData);
      toast({ title: 'Rule saved successfully' });
      setEditingRule(null);
      setFormData({});
      loadRules();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to save rule', description: error.message });
    }
  };

  // Handle Edit
  const handleEdit = (rule: any) => {
    setEditingRule(rule);
    setFormData(rule);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">RBAC</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={loadRules}
          disabled={loading}
        >
          Refresh
        </Button>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Policy Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Manage Role-Based Access Control (RBAC) rules. Rules are evaluated in priority order.
          </p>
        </CardContent>
      </Card>

      {/* Rules Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Current Rules</CardTitle>
            <Button
              variant="default"
              size="sm"
              onClick={() => setEditingRule({})} // Clear form for new rule
            >
              Add Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">No rules found.</div>
          ) : (
            <div className="space-y-4">
              {rules.map(rule => (
                <div key={rule.id} className="border rounded-md p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{rule.id}</span>
                      <Badge variant={rule.effect === 'allow' ? 'default' : 'destructive'}>
                        {rule.effect.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-xs">Priority: {rule.priority}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Roles: {rule.actor?.roles?.join(', ') || 'Any'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Action: {Array.isArray(rule.action) ? rule.action.join(', ') : rule.action}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Subject: {Array.isArray(rule.subject) ? rule.subject.join(', ') : rule.subject}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(rule)}
                  >
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit/Add Form */}
      {editingRule && (
        <Card>
          <CardHeader>
            <CardTitle>{editingRule.id ? 'Edit Rule' : 'Add Rule'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="id">Rule ID</Label>
              <Input
                id="id"
                value={formData.id || ''}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                placeholder="rule:name"
                disabled={!!editingRule.id} // Can't change ID of existing rule easily
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="effect">Effect</Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={formData.effect === 'allow' ? 'default' : 'outline'}
                  onClick={() => setFormData({ ...formData, effect: 'allow' })}
                >
                  Allow
                </Button>
                <Button
                  type="button"
                  variant={formData.effect === 'deny' ? 'destructive' : 'outline'}
                  onClick={() => setFormData({ ...formData, effect: 'deny' })}
                >
                  Deny
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                type="number"
                value={formData.priority || ''}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                placeholder="10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="roles">Actor Roles (comma-separated)</Label>
              <Input
                id="roles"
                value={formData.actor?.roles?.join(', ') || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  actor: { ...formData.actor, roles: e.target.value.split(',').map(s => s.trim()) }
                })}
                placeholder="OWNER, ADMIN"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <Input
                id="action"
                value={Array.isArray(formData.action) ? formData.action.join(', ') : formData.action || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  action: e.target.value.split(',').map(s => s.trim())
                })}
                placeholder="create, read, update"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={Array.isArray(formData.subject) ? formData.subject.join(', ') : formData.subject || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  subject: e.target.value.split(',').map(s => s.trim())
                })}
                placeholder="User, Article"
              />
            </div>

            <div className="flex justify-end">
              <Button type="button" variant="ghost" onClick={() => setEditingRule(null)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                Save
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
