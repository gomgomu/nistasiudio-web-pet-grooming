import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockContext(user?: any): ExecutionContext {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow access if no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext({ role: UserRole.STAFF });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow SUPER_ADMIN access to any role endpoint', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.TENANT_OWNER]);
    const context = createMockContext({ role: UserRole.SUPER_ADMIN });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow TENANT_OWNER access to tenant admin endpoints', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.TENANT_ADMIN]);
    const context = createMockContext({ role: UserRole.TENANT_OWNER });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow matching user role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.VETERINARIAN, UserRole.GROOMER]);
    const context = createMockContext({ role: UserRole.GROOMER });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny RECEPTIONIST access to owner-only settings endpoint', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.TENANT_OWNER]);
    const context = createMockContext({ role: UserRole.RECEPTIONIST });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should deny unauthenticated request when roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.STAFF]);
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
