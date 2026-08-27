import { TenantContextMiddleware } from './tenant-context.middleware';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException } from '@nestjs/common';
import { TenantContextStorage } from '../context/tenant-context.storage';
import { UserRole } from '@prisma/client';

describe('TenantContextMiddleware', () => {
  let middleware: TenantContextMiddleware;
  let mockJwtService: { verify: jest.Mock };
  let mockConfigService: { get: jest.Mock };

  beforeEach(() => {
    mockJwtService = { verify: jest.fn() };
    mockConfigService = { get: jest.fn().mockReturnValue('test-secret') };
    middleware = new TenantContextMiddleware(
      mockJwtService as unknown as JwtService,
      mockConfigService as unknown as ConfigService
    );
  });

  it('should pass through if no Authorization header is present', () => {
    const req: any = { headers: {} };
    const res: any = {};
    const next = jest.fn();

    middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.tenantContext).toBeUndefined();
  });

  it('should set tenantContext and run in AsyncLocalStorage for valid token', (done) => {
    const payload = {
      sub: 'user-123',
      tenantId: 'tenant-456',
      role: UserRole.STAFF,
      branchIds: ['branch-001', 'branch-002'],
    };
    mockJwtService.verify.mockReturnValue(payload);

    const req: any = {
      headers: {
        authorization: 'Bearer valid.jwt.token',
        'x-branch-id': 'branch-001',
      },
    };
    const res: any = {};
    const next = () => {
      expect(req.tenantContext).toBeDefined();
      expect(req.tenantContext.tenantId).toBe('tenant-456');
      expect(req.tenantContext.activeBranchId).toBe('branch-001');
      expect(TenantContextStorage.getTenantId()).toBe('tenant-456');
      done();
    };

    middleware.use(req, res, next);
  });

  it('should throw ForbiddenException if user requests branch outside allowed list', () => {
    const payload = {
      sub: 'user-123',
      tenantId: 'tenant-456',
      role: UserRole.STAFF,
      branchIds: ['branch-001'],
    };
    mockJwtService.verify.mockReturnValue(payload);

    const req: any = {
      headers: {
        authorization: 'Bearer valid.jwt.token',
        'x-branch-id': 'unauthorized-branch-999',
      },
    };
    const res: any = {};
    const next = jest.fn();

    expect(() => middleware.use(req, res, next)).toThrow(ForbiddenException);
    expect(next).not.toHaveBeenCalled();
  });
});
