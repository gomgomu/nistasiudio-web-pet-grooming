import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SaaSAdminService } from './saas-admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

describe('SaaSAdminService (SaaS Super Admin Console & Multi-Tenant Management Hub)', () => {
  let service: SaaSAdminService;
  let prisma: PrismaService;
  let subscriptionsService: SubscriptionsService;

  const mockTenantId = 't1111111-1111-4111-a111-111111111111';

  const mockTenant = {
    id: mockTenantId,
    name: 'คลินิกรักษาสัตว์ทองหล่อ',
    slug: 'thonglor-vet',
    businessType: 'HYBRID_CLINIC_GROOMING',
    phone: '02-123-4567',
    email: 'contact@thonglorvet.com',
    isActive: true,
    createdAt: new Date('2026-01-01'),
    subscriptions: [
      {
        id: 'sub-1',
        planCode: 'PROFESSIONAL',
        status: 'ACTIVE',
        billingCycle: 'MONTHLY',
        priceMinor: BigInt(299000),
        plan: { name: 'Professional Plan' },
      },
    ],
    _count: {
      branches: 2,
      users: 5,
      customers: 120,
      pets: 150,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaaSAdminService,
        {
          provide: PrismaService,
          useValue: {
            tenant: {
              count: jest.fn().mockImplementation((args) => {
                if (args?.where?.isActive === false) return Promise.resolve(1);
                if (args?.where?.isActive === true) return Promise.resolve(9);
                return Promise.resolve(10);
              }),
              findMany: jest.fn().mockResolvedValue([mockTenant]),
              findUnique: jest.fn().mockImplementation((args) => {
                if (args.where.id === mockTenantId) return Promise.resolve(mockTenant);
                return Promise.resolve(null);
              }),
              update: jest.fn().mockImplementation((args) => {
                return Promise.resolve({
                  ...mockTenant,
                  isActive: args.data.isActive,
                });
              }),
              groupBy: jest.fn().mockResolvedValue([
                { businessType: 'HYBRID_CLINIC_GROOMING', _count: { _all: 6 } },
                { businessType: 'VETERINARY_CLINIC', _count: { _all: 4 } },
              ]),
            },
            pet: {
              count: jest.fn().mockResolvedValue(1250),
            },
            appointment: {
              count: jest.fn().mockResolvedValue(320),
            },
            invoice: {
              findMany: jest.fn().mockResolvedValue([
                { totalMinor: BigInt(4500000) },
                { totalMinor: BigInt(3500000) },
              ]),
            },
            subscription: {
              findMany: jest.fn().mockResolvedValue([
                {
                  planCode: 'PROFESSIONAL',
                  status: 'ACTIVE',
                  billingCycle: 'MONTHLY',
                  priceMinor: BigInt(299000),
                },
                {
                  planCode: 'STARTER',
                  status: 'ACTIVE',
                  billingCycle: 'YEARLY',
                  priceMinor: BigInt(1290000),
                },
              ]),
            },
            auditLog: {
              create: jest.fn().mockResolvedValue({ id: 'log-1' }),
              findMany: jest.fn().mockResolvedValue([
                {
                  id: 'log-1',
                  tenantId: mockTenantId,
                  userId: 'admin-1',
                  action: 'SUSPEND_TENANT',
                  entity: 'TENANT',
                  entityId: mockTenantId,
                  createdAt: new Date(),
                  tenant: { name: 'คลินิกรักษาสัตว์ทองหล่อ' },
                  user: { firstName: 'Super', lastName: 'Admin' },
                },
              ]),
              count: jest.fn().mockResolvedValue(1),
            },
          },
        },
        {
          provide: SubscriptionsService,
          useValue: {
            getTenantSubscription: jest.fn().mockResolvedValue({
              planCode: 'PROFESSIONAL',
              effectiveMaxBranches: 3,
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SaaSAdminService>(SaaSAdminService);
    prisma = module.get<PrismaService>(PrismaService);
    subscriptionsService = module.get<SubscriptionsService>(SubscriptionsService);
  });

  describe('getMetricsOverview', () => {
    it('should aggregate total tenants, MRR, ARR, and business distribution', async () => {
      const metrics = await service.getMetricsOverview();

      expect(metrics).toBeDefined();
      expect(metrics.totalTenants).toBe(10);
      expect(metrics.activeTenants).toBe(9);
      expect(metrics.suspendedTenants).toBe(1);
      expect(metrics.mrrMinor).toBeGreaterThan(0);
      expect(metrics.totalPetsCount).toBe(1250);
      expect(metrics.planDistribution.length).toBeGreaterThan(0);
    });
  });

  describe('listTenants', () => {
    it('should return paginated list of tenants with live counts', async () => {
      const result = await service.listTenants({ page: 1, limit: 10 });

      expect(result).toBeDefined();
      expect(result.tenants.length).toBe(1);
      expect(result.tenants[0].name).toBe('คลินิกรักษาสัตว์ทองหล่อ');
      expect(result.tenants[0].planCode).toBe('PROFESSIONAL');
      expect(result.tenants[0].branchCount).toBe(2);
    });
  });

  describe('getTenantDetails', () => {
    it('should return complete tenant details with quota breakdown', async () => {
      const details = await service.getTenantDetails(mockTenantId);

      expect(details).toBeDefined();
      expect(details.tenant.id).toBe(mockTenantId);
      expect(details.quotaDetails.planCode).toBe('PROFESSIONAL');
    });

    it('should throw NotFoundException for non-existent tenant', async () => {
      await expect(service.getTenantDetails('invalid-id')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('updateTenantStatus', () => {
    it('should suspend tenant and write audit log', async () => {
      const result = await service.updateTenantStatus(
        mockTenantId,
        { isActive: false, reason: 'Payment overdue' },
        'admin-user-id'
      );

      expect(result.success).toBe(true);
      expect(result.isActive).toBe(false);
      expect(prisma.tenant.update).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });
  });

  describe('getSystemAuditLogs', () => {
    it('should query system audit logs', async () => {
      const result = await service.getSystemAuditLogs({});

      expect(result).toBeDefined();
      expect(result.logs.length).toBe(1);
      expect(result.logs[0].action).toBe('SUSPEND_TENANT');
    });
  });
});
