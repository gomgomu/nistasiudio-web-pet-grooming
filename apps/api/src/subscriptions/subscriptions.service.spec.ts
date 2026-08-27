import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SubscriptionsService (SaaS Subscription Plan & Billing Schema)', () => {
  let service: SubscriptionsService;
  let prisma: PrismaService;

  const mockTenantId = 't1111111-1111-4111-a111-111111111111';
  const mockPlanId = 'plan1111-1111-4111-a111-111111111111';

  const mockPlanStarter = {
    id: mockPlanId,
    code: 'STARTER',
    name: 'Starter Plan',
    description: '1 สาขา, 3 ผู้ใช้',
    priceMonthlyMinor: BigInt(129000),
    priceYearlyMinor: BigInt(1290000),
    currency: 'THB',
    maxBranches: 1,
    maxStaffUsers: 3,
    maxMonthlyAppointments: 300,
    hasLineIntegration: false,
    hasAdvancedInventory: false,
    hasClinicalSoap: true,
    hasVaccinationRegistry: true,
    hasCommissionEngine: false,
    hasMultiBranchCentral: false,
    hasApiAccess: false,
    isActive: true,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPlanPro = {
    id: 'plan-pro-uuid',
    code: 'PROFESSIONAL',
    name: 'Professional Plan',
    description: '3 สาขา, 10 ผู้ใช้, LINE OA',
    priceMonthlyMinor: BigInt(299000),
    priceYearlyMinor: BigInt(2990000),
    currency: 'THB',
    maxBranches: 3,
    maxStaffUsers: 10,
    maxMonthlyAppointments: 1500,
    hasLineIntegration: true,
    hasAdvancedInventory: true,
    hasClinicalSoap: true,
    hasVaccinationRegistry: true,
    hasCommissionEngine: true,
    hasMultiBranchCentral: false,
    hasApiAccess: false,
    isActive: true,
    sortOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSubscription = {
    id: 'sub-1',
    tenantId: mockTenantId,
    planId: mockPlanId,
    planCode: 'STARTER',
    status: 'ACTIVE',
    billingCycle: 'MONTHLY',
    priceMinor: BigInt(129000),
    currency: 'THB',
    trialEndsAt: null,
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    cancelAtPeriodEnd: false,
    canceledAt: null,
    customMaxBranches: null,
    customMaxStaffUsers: null,
    customFeatures: null,
    paymentMethod: 'PROMPTPAY',
    createdAt: new Date(),
    updatedAt: new Date(),
    plan: mockPlanStarter,
  };

  const mockTenant = {
    id: mockTenantId,
    name: 'คลินิกรักษาสัตว์ทองหล่อ',
    slug: 'thonglor-vet',
    subscriptions: [mockSubscription],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: PrismaService,
          useValue: {
            subscriptionPlan: {
              count: jest.fn().mockResolvedValue(2),
              findMany: jest.fn().mockResolvedValue([mockPlanStarter, mockPlanPro]),
              findUnique: jest.fn().mockImplementation((args) => {
                if (args.where.code === 'STARTER' || args.where.id === mockPlanId) {
                  return Promise.resolve(mockPlanStarter);
                }
                if (args.where.code === 'PROFESSIONAL' || args.where.id === 'plan-pro-uuid') {
                  return Promise.resolve(mockPlanPro);
                }
                return Promise.resolve(null);
              }),
              create: jest.fn().mockResolvedValue(mockPlanStarter),
              update: jest.fn().mockImplementation((args) => {
                return Promise.resolve({
                  ...mockPlanStarter,
                  ...args.data,
                });
              }),
            },
            subscription: {
              findFirst: jest.fn().mockResolvedValue(mockSubscription),
              create: jest.fn().mockResolvedValue(mockSubscription),
              update: jest.fn().mockResolvedValue(mockSubscription),
            },
            tenant: {
              findUnique: jest.fn().mockImplementation((args) => {
                if (args.where.id === mockTenantId) {
                  return Promise.resolve(mockTenant);
                }
                return Promise.resolve(null);
              }),
            },
            branch: {
              count: jest.fn().mockResolvedValue(1),
            },
            user: {
              count: jest.fn().mockResolvedValue(2),
            },
            appointment: {
              count: jest.fn().mockResolvedValue(45),
            },
          },
        },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('getPublicPlans & getAllPlans', () => {
    it('should return available plans ordered by sort order', async () => {
      const plans = await service.getPublicPlans();

      expect(plans).toBeDefined();
      expect(plans.length).toBe(2);
      expect(plans[0].code).toBe('STARTER');
      expect(plans[1].code).toBe('PROFESSIONAL');
      expect(plans[1].hasLineIntegration).toBe(true);
    });
  });

  describe('getTenantSubscription', () => {
    it('should return tenant subscription details with current live resource usage', async () => {
      const details = await service.getTenantSubscription(mockTenantId);

      expect(details).toBeDefined();
      expect(details.planCode).toBe('STARTER');
      expect(details.effectiveMaxBranches).toBe(1);
      expect(details.currentBranchCount).toBe(1);
      expect(details.currentUserCount).toBe(2);
      expect(details.currentMonthlyAppointmentCount).toBe(45);
    });

    it('should throw NotFoundException for non-existent tenant', async () => {
      await expect(
        service.getTenantSubscription('invalid-tenant')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createPlan & updatePlan', () => {
    it('should create a new subscription plan tier', async () => {
      jest.spyOn(prisma.subscriptionPlan, 'findUnique').mockResolvedValueOnce(null);

      const plan = await service.createPlan({
        code: 'CUSTOM_TIER',
        name: 'Custom VIP Plan',
        priceMonthlyMinor: 990000,
        priceYearlyMinor: 9900000,
        maxBranches: 10,
        maxStaffUsers: 50,
      });

      expect(plan).toBeDefined();
      expect(prisma.subscriptionPlan.create).toHaveBeenCalled();
    });

    it('should throw ConflictException when creating plan with existing code', async () => {
      await expect(
        service.createPlan({
          code: 'STARTER',
          name: 'Starter Dupe',
          priceMonthlyMinor: 129000,
          priceYearlyMinor: 1290000,
        })
      ).rejects.toThrow(ConflictException);
    });

    it('should update an existing subscription plan', async () => {
      const updated = await service.updatePlan(mockPlanId, {
        name: 'Starter Plan Plus',
        maxStaffUsers: 5,
      });

      expect(updated).toBeDefined();
      expect(prisma.subscriptionPlan.update).toHaveBeenCalled();
    });
  });

  describe('assignTenantSubscription', () => {
    it('should assign/upgrade tenant plan', async () => {
      const details = await service.assignTenantSubscription({
        tenantId: mockTenantId,
        planCode: 'PROFESSIONAL',
        billingCycle: 'YEARLY',
      });

      expect(details).toBeDefined();
      expect(prisma.subscription.update).toHaveBeenCalled();
    });
  });

  describe('checkQuota', () => {
    it('should check branch quota correctly', async () => {
      // 1 branch used out of 1 allowed on Starter -> allowed = false (cannot create 2nd)
      const res = await service.checkQuota(mockTenantId, 'BRANCH');

      expect(res.resource).toBe('BRANCH');
      expect(res.currentUsage).toBe(1);
      expect(res.maxAllowed).toBe(1);
      expect(res.allowed).toBe(false);
    });

    it('should check user quota correctly', async () => {
      // 2 users used out of 3 allowed on Starter -> allowed = true
      const res = await service.checkQuota(mockTenantId, 'USER');

      expect(res.resource).toBe('USER');
      expect(res.currentUsage).toBe(2);
      expect(res.maxAllowed).toBe(3);
      expect(res.allowed).toBe(true);
    });

    it('should check feature permissions based on plan', async () => {
      const lineCheck = await service.checkQuota(
        mockTenantId,
        'FEATURE',
        'LINE_INTEGRATION'
      );
      expect(lineCheck.allowed).toBe(false); // Starter has no LINE OA

      const soapCheck = await service.checkQuota(
        mockTenantId,
        'FEATURE',
        'CLINICAL_SOAP'
      );
      expect(soapCheck.allowed).toBe(true); // Starter has Clinical SOAP
    });
  });
});
