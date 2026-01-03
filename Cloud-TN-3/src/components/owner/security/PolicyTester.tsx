'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Play, CheckCircle2, XCircle, Loader } from 'lucide-react';
import { testPolicy } from '@/lib/security/policy-client';
import {
  PolicyTestSubjectSchema,
  PolicyTestSchema,
  PolicyAction,
  PolicyResource,
} from '@/lib/validators/security';

/**
 * Policy Tester Component
 *
 * Tests policy for specific user/action/resource/context.
 * Calls backend endpoint to evaluate real policy.
 * Displays result (allow/deny) + reason + matched rule id.
 */

export function PolicyTester() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Form state
  const [subjectType, setSubjectType] = useState<'role' | 'user'>('role');
  const [subjectId, setSubjectId] = useState('');
  const [action, setAction] = useState('');
  const [resource, setResource] = useState('');
  const [context, setContext] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [userId, setUserId] = useState('');

  const actions = Object.values(PolicyAction);
  const resources = Object.values(PolicyResource);

  // Handle test
  const handleTest = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Build context object
      const contextObj: any = {
        tenantId: tenantId || process.env.NEXT_PUBLIC_TENANT_ID, // Fallback to env
      };

      if (workspaceId) contextObj.workspaceId = workspaceId;
      if (userId) contextObj.userId = userId;
      if (context) {
        try {
          const parsedContext = JSON.parse(context);
          Object.assign(contextObj, parsedContext);
        } catch {
          // Invalid JSON, ignore
        }
      }

      // Call test policy API
      const response = await testPolicy({
        subjectType,
        subjectId,
        action,
        resource,
        context: contextObj,
      });

      setResult(response.data);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Policy test failed', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Play className="h-5 w-5" />
          Policy Tester
        </h2>
        <Badge variant="outline">Live</Badge>
      </div>

      <div className="space-y-4">
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
              placeholder={subjectType === 'role' ? 'OWNER, ADMIN...' : '123'}
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

        {/* Context */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold mb-2">Context (Optional)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tenant ID</Label>
              <Input
                placeholder={process.env.NEXT_PUBLIC_TENANT_ID || 'default'}
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Workspace ID</Label>
              <Input
                placeholder="Optional"
                value={workspaceId}
                onChange={(e) => setWorkspaceId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>User ID</Label>
              <Input
                placeholder="Optional"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Additional Context (JSON)</Label>
              <Textarea
                placeholder='{"key": "value"}'
                rows={3}
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Test Button */}
        <div>
          <Button
            onClick={handleTest}
            disabled={loading || !subjectId || !action || !resource}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader className="animate-spin mr-2 h-4 w-4" />
                Testing Policy...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Test Policy
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="mt-6 pt-6 border-t space-y-4">
          <h3 className="text-lg font-semibold">Test Result</h3>
          <div className={`p-4 rounded-md border ${
            result.allowed
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {result.allowed ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
                <span className={`text-xl font-bold ${
                  result.allowed ? 'text-green-900' : 'text-red-900'
                }`}>
                  {result.allowed ? 'ALLOWED' : 'DENIED'}
                </span>
              </div>
              <Badge variant={result.allowed ? 'default' : 'destructive'}>
                {result.denied ? 'Denied' : 'Allowed'}
              </Badge>
            </div>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Reason:</span> {result.reason}
              </div>
              {result.matchedRuleId && (
                <div>
                  <span className="font-medium">Matched Rule ID:</span>{' '}
                  <code className="bg-muted px-2 py-1 rounded text-xs">{result.matchedRuleId}</code>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
