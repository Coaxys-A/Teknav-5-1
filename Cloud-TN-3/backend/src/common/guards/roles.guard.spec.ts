import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

describe('RolesGuard', () => {
  it('allows higher role', () => {
    const reflector = new Reflector();
    const guard = new RolesGuard(reflector as any);
    const ctx: any = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: Role.ADMIN } }),
      }),
    };
    (reflector as any).getAllAndOverride = () => [Role.WRITER];
    expect(guard.canActivate(ctx as any)).toBe(true);
  });

  it('blocks lower role', () => {
    const reflector = new Reflector();
    const guard = new RolesGuard(reflector as any);
    const ctx: any = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: Role.GUEST } }),
      }),
    };
    (reflector as any).getAllAndOverride = () => [Role.ADMIN];
    expect(guard.canActivate(ctx as any)).toBe(false);
  });
});
