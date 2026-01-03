import { SetMetadata, UseGuards } from '@nestjs/common';
import { Action, Resource } from './policy.service';
import { PoliciesGuard } from './policies.guard';

/**
 * @Policy(Resource, Action) Decorator
 * 
 * Marks controller/method with required policy check.
 */
export const POLICY_KEY = 'policy';

export const RequirePolicy = (action: Action, resource: Resource) => {
  return SetMetadata(POLICY_KEY, { action, resource });
};
