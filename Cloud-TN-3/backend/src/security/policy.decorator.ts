import { SetMetadata } from '@nestjs/common';
import { PolicyService } from './policy.service';

/**
 * RBAC Policy Decorator
 * 
 * Usage:
 * @RequirePolicy('create', 'Article')
 * @RequirePolicy('update', 'User', 'self') // Self-scope: user can only edit own profile
 */

export const POLICY_KEY = 'policy';

export function RequirePolicy(action: string, resource: string, scope?: string) {
  return SetMetadata(POLICY_KEY, { action, resource, scope });
}
