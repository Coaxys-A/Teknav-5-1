import { api } from '../api-client';

/**
 * Owner Security API Client
 *
 * Functions to interact with Owner Security endpoints.
 */

/**
 * Get Audit Logs
 */
export async function getAuditLogs(filters?: any): Promise<{ data: any[]; page: number; pageSize: number; total: number }> {
  const params = new URLSearchParams();
  if (filters?.page) params.set('page', filters.page.toString());
  if (filters?.pageSize) params.set('pageSize', filters.pageSize.toString());
  if (filters?.startDate) params.set('startDate', filters.startDate);
  if (filters?.endDate) params.set('endDate', filters.endDate);
  if (filters?.action) params.set('action', filters.action);
  if (filters?.resource) params.set('resource', filters.resource);
  if (filters?.actorId) params.set('actorId', filters.actorId.toString());

  return await api.get(`/owner/security/audit-logs?${params.toString()}`);
}

/**
 * Get Access Logs
 */
export async function getAccessLogs(filters?: any): Promise<{ data: any[]; page: number; pageSize: number; total: number }> {
  const params = new URLSearchParams();
  if (filters?.page) params.set('page', filters.page.toString());
  if (filters?.pageSize) params.set('pageSize', filters.pageSize.toString());
  if (filters?.startDate) params.set('startDate', filters.startDate);
  if (filters?.endDate) params.set('endDate', filters.endDate);
  if (filters?.targetType) params.set('targetType', filters.targetType);
  if (filters?.targetId) params.set('targetId', filters.targetId.toString());
  if (filters?.actorId) params.set('actorId', filters.actorId.toString());

  return await api.get(`/owner/security/access-logs?${params.toString()}`);
}

/**
 * Export Logs
 */
export async function exportLogs(body: { type: 'audit' | 'access'; filters: any }): Promise<{ message: string }> {
  return await api.post('/owner/security/logs/export', body);
}

/**
 * Get Sessions
 */
export async function getSessions(filters?: any): Promise<{ data: any[]; page: number; pageSize: number; total: number }> {
  const params = new URLSearchParams();
  if (filters?.page) params.set('page', filters.page.toString());
  if (filters?.pageSize) params.set('pageSize', filters.pageSize.toString());
  if (filters?.userId) params.set('userId', filters.userId.toString());

  return await api.get(`/owner/security/sessions?${params.toString()}`);
}

/**
 * Revoke Session
 */
export async function revokeSession(sessionId: string): Promise<{ message: string }> {
  return await api.post(`/owner/security/sessions/${sessionId}/revoke`, {});
}

/**
 * Revoke All User Sessions
 */
export async function revokeAllUserSessions(userId: number): Promise<{ message: string; count: number }> {
  return await api.post(`/owner/security/users/${userId}/revoke-all-sessions`, {});
}

/**
 * Get Devices
 */
export async function getDevices(filters?: any): Promise<{ data: any[]; page: number; pageSize: number; total: number }> {
  const params = new URLSearchParams();
  if (filters?.page) params.set('page', filters.page.toString());
  if (filters?.pageSize) params.set('pageSize', filters.pageSize.toString());
  if (filters?.userId) params.set('userId', filters.userId.toString());

  return await api.get(`/owner/security/devices?${params.toString()}`);
}

/**
 * Trust Device
 */
export async function trustDevice(userId: number, deviceId: string): Promise<{ message: string }> {
  return await api.post(`/owner/security/devices/${deviceId}/trust`, { userId });
}

/**
 * Untrust Device
 */
export async function untrustDevice(userId: number, deviceId: string): Promise<{ message: string }> {
  return await api.post(`/owner/security/devices/${deviceId}/untrust`, { userId });
}

/**
 * Get RBAC Rules
 */
export async function getRbacRules(): Promise<{ data: any }> {
  return await api.get('/owner/security/rbac');
}

/**
 * Save RBAC Rule
 */
export async function saveRbacRule(body: { tenantId: number; rule: any }): Promise<{ message: string }> {
  return await api.post('/owner/security/rbac', body);
}

/**
 * Get Bans
 */
export async function getBans(filters?: any): Promise<{ data: any[]; page: number; pageSize: number; total: number }> {
  const params = new URLSearchParams();
  if (filters?.page) params.set('page', filters.page.toString());
  if (filters?.pageSize) params.set('pageSize', filters.pageSize.toString());
  if (filters?.type) params.set('type', filters.type);

  return await api.get(`/owner/security/bans?${params.toString()}`);
}

/**
 * Unban
 */
export async function unban(body: { identifier: string; type: 'user' | 'ip' }): Promise<{ message: string }> {
  return await api.post('/owner/security/bans/unban', body);
}

/**
 * Get Rate Limit Counters
 */
export async function getRateLimitCounters(filters?: any): Promise<{ data: any[]; page: number; pageSize: number; total: number }> {
  const params = new URLSearchParams();
  if (filters?.page) params.set('page', filters.page.toString());
  if (filters?.pageSize) params.set('pageSize', filters.pageSize.toString());
  if (filters?.type) params.set('type', filters.type);

  return await api.get(`/owner/security/rate-limits?${params.toString()}`);
}

/**
 * Clear Rate Limit Counter
 */
export async function clearRateLimit(body: { identifier: string; type: 'user' | 'ip' | 'token' }): Promise<{ message: string }> {
  return await api.post('/owner/security/rate-limits/clear', body);
}
