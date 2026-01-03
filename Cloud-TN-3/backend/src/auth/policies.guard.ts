import { Injectable } from '@nestjs/common';
import { PolicyGuard } from '../../security/policy/policy.guard';

/**
 * Policies Guard
 *
 * Alias for PolicyGuard.
 * Used to enforce RBAC + ABAC policies.
 */

@Injectable()
export class PoliciesGuard extends PolicyGuard {
  constructor() {
    super();
  }
}
