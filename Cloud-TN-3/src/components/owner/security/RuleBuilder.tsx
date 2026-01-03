'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Save, X, Clock, User, Shield } from 'lucide-react';
import {
  createRule,
  updateRule,
  listRules,
} from '@/lib/security/policy-client';
import {
  CreateRuleSchema,
  UpdateRuleSchema,
  RuleSubjectSchema,
  RuleConditionsSchema,
} from '@/lib/validators/security';
import {
  PolicyAction,
  PolicyResource,
  PolicyRule,
} from '@/lib/security/policy-types';

/**
 * Rule Builder Component
 *
 * Form to create/update ABAC rules.
 * Subject (role/user), action, resource, conditions (tenantId, workspaceId, userIds, fields, time).
 */

interface RuleBuilderProps {
  onRefresh: () => void;
  editRule?: PolicyRule | null;
}

export function RuleBuilder({ onRefresh, editRule }: RuleBuilderProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConditions, setShowConditions] = useState(false);

  // Form state
  const [effect, setEffect] = useState<'allow' | 'deny'>('allow');
  const [subjectType, setSubjectType] = useState<'role' | 'user'>('role');
  const [subjectId, setSubjectId] = useState('');
  const [action, setAction] = useState('');
  const [resource, setResource] = useState('');
  const [description, setDescription] = useState('');

  // Conditions
  const [conditionTenantId, setConditionTenantId] = useState('');
  const [conditionWorkspaceId, setConditionWorkspaceId] = useState('');
  const [conditionUserIds, setConditionUserIds] = useState('');
  const [conditionFields, setConditionFields] = useState('');
  const [conditionTimeStart, setConditionTimeStart] = useState('');
  const [conditionTimeEnd, setConditionTimeEnd] = useState('');

  // Load rule for editing
  useState(() => {
    if (editRule) {
      setEffect(editRule.effect);
      setSubjectType(editRule.subject.type);
      setSubjectId(editRule.subject.id);
      setAction(editRule.action);
      setResource(editRule.resource);
      setDescription(editRule.description || '');

      if (editRule.conditions) {
        setConditionTenantId(editRule.conditions.tenantId || '');
        setConditionWorkspaceId(editRule.conditions.workspaceId || '');
        setConditionUserIds(editRule.conditions.userIds?.join(', ') || '');
        setConditionFields(editRule.conditions.fields?.join(', ') || '');
        if (editRule.conditions.time) {
          setConditionTimeStart(editRule.conditions.time.start || '');
          setConditionTimeEnd(editRule.conditions.time.end || '');
        }
      }
    }
  });

  const actions = Object.values(PolicyAction);
  const resources = Object.values(PolicyResource);

  // Handle save
  const handleSave = async () => {
    setLoading(true);
    try {
      const ruleData: Omit<PolicyRule, 'id'> = {
        effect,
        subject: {
          type: subjectType,
          id: subjectId,
        },
        action: action as PolicyAction,
        resource: resource as PolicyResource,
        conditions: {
          tenantId: conditionTenantId || undefined,
          workspaceId: conditionWorkspaceId || undefined,
          userIds: conditionUserIds ? conditionUserIds.split(',').map(s => s.trim()).filter(s => s) : undefined,
          fields: conditionFields ? conditionFields.split(',').map(s => s.trim()).filter(s => s) : undefined,
          time: {
            start: conditionTimeStart || undefined,
            end: conditionTimeEnd || undefined,
          },
        },
        description,
      };

      // Validate schema
      CreateRuleSchema.parse(ruleData);

      if (editRule) {
        await updateRule(editRule.id, ruleData);
        toast({ title: 'Rule updated successfully' });
      } else {
        await createRule(ruleData);
        toast({ title: 'Rule created successfully' });
      }

      setOpen(false);
      handleReset();
      onRefresh();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to save rule', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Handle reset
  const handleReset = () => {
    setEffect('allow');
    setSubjectType('role');
    setSubjectId('');
    setAction('');
    setResource('');
    setDescription('');
    setConditionTenantId('');
    setConditionWorkspaceId('');
    setConditionUserIds('');
    setConditionFields('');
    setConditionTimeStart('');
    setConditionTimeEnd('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editRule ? 'Edit Rule' : 'Create New Rule'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Effect */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Effect</Label>
              <Select value={effect} onValueChange={(v) => setEffect(v as 'allow' | 'deny')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="allow">Allow</SelectItem>
                  <SelectItem value="deny">Deny</SelectItem>
                </SelectContent>
              </Select>
              {effect === 'deny' && (
                <p className="text-xs text-red-600 mt-1">
                  Deny rules override allow rules.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Rule description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Subject */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Subject Type</Label>
              <Select value={subjectType} onValueChange={(v) => setSubjectType(v as 'role' | 'user')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="role">Role</SelectItem>
                  <SelectItem value="user">User ID</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject ID</Label>
              <Input
                placeholder={subjectType === 'role' ? 'OWNER, ADMIN, MANAGER...' : '123'}
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
              />
            </div>
          </div>

          {/* Action */}
          <div className="space-y-2">
            <Label>Action</Label>
            <Select value={action} onValueChange={(v) => setAction(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent>
                {actions.map(a => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Resource */}
          <div className="space-y-2">
            <Label>Resource</Label>
            <Select value={resource} onValueChange={(v) => setResource(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select resource" />
              </SelectTrigger>
              <SelectContent>
                {resources.map(r => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Conditions Toggle */}
          <div className="flex items-center justify-between border-t pt-4 mt-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="font-semibold">Conditions (Optional)</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConditions(!showConditions)}
            >
              {showConditions ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Hide Conditions
                </>
              ) : (
                <>
                  <Badge variant="outline" className="mr-2">Advanced</Badge>
                  Show Conditions
                </>
              )}
            </Button>
          </div>

          {/* Conditions */}
          {showConditions && (
            <div className="space-y-4 mt-4 border-t pt-4">
              <div className="space-y-2">
                <Label>Tenant ID</Label>
                <Input
                  placeholder="Tenant ID (optional)"
                  value={conditionTenantId}
                  onChange={(e) => setConditionTenantId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Workspace ID</Label>
                <Input
                  placeholder="Workspace ID (optional)"
                  value={conditionWorkspaceId}
                  onChange={(e) => setConditionWorkspaceId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>User IDs (comma-separated)</Label>
                <Input
                  placeholder="user1, user2, user3..."
                  value={conditionUserIds}
                  onChange={(e) => setConditionUserIds(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Fields (comma-separated)</Label>
                <Input
                  placeholder="field1, field2, field3..."
                  value={conditionFields}
                  onChange={(e) => setConditionFields(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Time Start</Label>
                  <Input
                    type="datetime-local"
                    value={conditionTimeStart}
                    onChange={(e) => setConditionTimeStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time End</Label>
                  <Input
                    type="datetime-local"
                    value={conditionTimeEnd}
                    onChange={(e) => setConditionTimeEnd(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Time constraints use UTC timezone</span>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !effect || !subjectId || !action || !resource}
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
