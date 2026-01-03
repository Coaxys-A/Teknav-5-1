import { fetchWithCsrf, postWithCsrf, putWithCsrf, deleteWithCsrf } from './csrf';
import { api } from '../api-client';
import { PolicyRole, PolicyAction, PolicyResource, PolicyRule, PolicyDocument } from './policy-types';

/**
 * Policy Client
 *
 * Client-side functions to interact with owner policy endpoints.
 * Wraps API calls with CSRF protection.
 */

/**
 * Get policy document
 */
export async function getPolicyDocument(): Promise<{ data: PolicyDocument }> {
  return await api.get('/owner/security/policy');
}

/**
 * Update role permissions
 */
export async function updateRolePermissions(
  role: PolicyRole,
  permissions: any,
  diff?: any,
): Promise<{ data: PolicyDocument }> {
  return await putWithCsrf('/owner/security/policy', {
    role,
    permissions,
    diff,
  });
}

/**
 * Restore default policy (or specific role)
 */
export async function restoreDefaultPolicy(options: { role?: string; restoreAll?: boolean }): Promise<{ data: PolicyDocument }> {
  return await postWithCsrf('/owner/security/policy/restore', options);
}

/**
 * List rules
 */
export async function listRules(filters?: {
  subjectType?: string;
  subjectId?: string;
  action?: string;
  resource?: string;
}): Promise<{ data: PolicyRule[] }> {
  const params = new URLSearchParams();
  if (filters?.subjectType) params.set('subjectType', filters.subjectType);
  if (filters?.subjectId) params.set('subjectId', filters.subjectId);
  if (filters?.action) params.set('action', filters.action);
  if (filters?.resource) params.set('resource', filters.resource);

  return await api.get(`/owner/security/rules?${params.toString()}`);
}

/**
 * Create rule
 */
export async function createRule(rule: Omit<PolicyRule, 'id'>): Promise<{ data: PolicyRule }> {
  return await postWithCsrf('/owner/security/rules', rule);
}

/**
 * Get rule by ID
 */
export async function getRule(ruleId: string): Promise<{ data: PolicyRule | { error: string } }> {
  return await api.get(`/owner/security/rules/${ruleId}`);
}

/**
 * Update rule
 */
export async function updateRule(ruleId: string, updates: Partial<PolicyRule>): Promise<{ data: PolicyRule }> {
  return await putWithCsrf(`/owner/security/rules/${ruleId}`, updates);
}

/**
 * Delete rule
 */
export async function deleteRule(ruleId: string): Promise<{ data: { message: string; ruleId: string } }> {
  return await deleteWithCsrf(`/owner/security/rules/${ruleId}`);
}

/**
 * Enable rule
 */
export async function enableRule(ruleId: string): Promise<{ data: { message: string; ruleId: string } }> {
  return await postWithCsrf(`/owner/security/rules/${ruleId}/enable`);
}

/**
 * Disable rule
 */
export async function disableRule(ruleId: string): Promise<{ data: { message: string; ruleId: string } }> {
  return await postWithCsrf(`/owner/security/rules/${ruleId}/disable`);
}

/**
 * Test policy
 */
export async function testPolicy(
  subject: { type: 'role' | 'user'; id: string },
  action: PolicyAction,
  resource: PolicyResource,
  context: any,
): Promise<{ data: { allowed: boolean; denied: boolean; reason?: string; matchedRuleId?: string } }> {
  return await postWithCsrf('/owner/security/policy/test', {
    subject,
    action,
    resource,
    context,
  });
}
