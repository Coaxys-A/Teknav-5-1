export type PolicyRule = {
  method: string;
  path: RegExp;
  resource: string;
  action: string;
  scope: 'global' | 'tenant' | 'workspace';
};

export const POLICY_RULES: PolicyRule[] = [
  { method: 'GET', path: /^\/owner\/analytics/, resource: 'analytics', action: 'read', scope: 'tenant' },
  { method: 'GET', path: /^\/owner\/logs/, resource: 'logs', action: 'read', scope: 'tenant' },
  { method: 'POST', path: /^\/owner\/publish/, resource: 'articles', action: 'publish', scope: 'workspace' },
  { method: 'POST', path: /^\/owner\/plugins/, resource: 'plugins', action: 'manage', scope: 'tenant' },
  { method: 'POST', path: /^\/owner\/workflows/, resource: 'workflows', action: 'manage', scope: 'workspace' },
  { method: 'POST', path: /^\/owner\/feature-flags/, resource: 'feature-flags', action: 'manage', scope: 'workspace' },
  { method: 'POST', path: /^\/owner\/experiments/, resource: 'experiments', action: 'manage', scope: 'workspace' },
  { method: 'POST', path: /^\/owner\/ai/, resource: 'ai', action: 'manage', scope: 'workspace' },
  { method: 'POST', path: /^\/owner\/store/, resource: 'store', action: 'manage', scope: 'tenant' },
  { method: 'POST', path: /^\/owner\/webhooks/, resource: 'webhooks', action: 'manage', scope: 'workspace' },
  { method: 'GET', path: /^\/api\/analytics/, resource: 'analytics', action: 'read', scope: 'workspace' },
  { method: 'POST', path: /^\/api\/analytics/, resource: 'analytics', action: 'write', scope: 'workspace' },
  { method: 'POST', path: /^\/api\/articles\/(add|approve|reject|publish)/, resource: 'articles', action: 'write', scope: 'workspace' },
];
