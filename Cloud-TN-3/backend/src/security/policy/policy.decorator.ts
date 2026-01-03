import { SetMetadata } from '@nestjs/common';
import { PolicyAction, PolicySubject } from './policy.types';

/**
 * Policy Decorator
 *
 * Used to mark routes with required policy enforcement.
 * Stores required action, subject, and options.
 *
 * Usage:
 * @RequirePermission(PolicyAction.UPDATE, PolicySubject.USER, { workspace: true })
 * async updateUser(@Req() req: Request) { ... }
 */

export const REQUIRED_ACTION = 'action';
export const REQUIRED_SUBJECT = 'subject';
export const REQUIRE_WORKSPACE = 'require_workspace';

export const RequirePermission = (
  action: PolicyAction,
  subject: PolicySubject,
  options?: { workspace?: boolean; sensitivity?: string[]; tenantId?: number; workspaceId?: number; },
) =>
  SetMetadata(REQUIRED_ACTION, action),
  SetMetadata(REQUIRED_SUBJECT, subject),
  SetMetadata(REQUIRE_WORKSPACE, options?.workspace || false),
  SetMetadata('policy', { // Global marker
    action,
    subject,
    ...options,
  }),
);
