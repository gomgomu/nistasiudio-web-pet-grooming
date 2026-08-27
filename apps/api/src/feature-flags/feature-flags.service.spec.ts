import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { FeatureFlagsService } from './feature-flags.service';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

describe('FeatureFlagsService (Dynamic Feature Flags & Entitlements)', () => {
  let service: FeatureFlagsService;
  let prisma: PrismaService;
  let subscriptionsService: SubscriptionsService;

  const mockTenantId = 't1111111-1111-4111-a111-111111111111';

  const mockFlags = [
    {
      id: 'f-1',
      key: 'LINE_MESSAGING',
      name: 'LINE Official Account Integration',
      description: 'ส่งแจ้งเตือนผ่าน LINE OA',
      category: 'MARKETING',
      isGlobalEnabled: true,
      minPlanCode: 'PROFESSIONAL',
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { overrides: 1 },
    },
    {
      id: 'f-2',
      key: 'CLINICAL_SOAP',
      name: 'Veterinary SOAP Records',
      description: 'เวชระเบียนสัตวแพทย์',
      category: 'CLINICAL',
      isGlobalEnabled: true,
      minPlanCode: 'STARTER',
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { overrides: 0 },
    },
    {
      id: 'f-3',
      key: 'TELE_MED_BETA',
      name: 'Tele-Med Beta',
      description: 'วิดีโอคอลตรวจรักษา',
      category: 'BETA',
      isGlobalEnabled: false, // Globally disabled
      minPlanCode: 'ENTERPRISE',
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { overrides: 0 },
    },
  ];

  const mockStarterSubDetails = {
    id: 'sub-1',
    tenantId: mockTenantId,
    tenantName: 'คลินิกทองหล่อ',
    planCode: 'STARTER',
    planName: 'Starter Plan',
    status: 'ACTIVE' as const,
    billingCycle: 'MONTHLY' as const,
    priceMinor: 129000,
    currency: 'THB',
    currentPeriodStart: new Date().toISOString(),
    currentPeriodEnd: new Date().toISOString(),
    cancelAtPeriodEnd: false,
    effectiveMaxBranches: 1,
    effectiveMaxStaffUsers: 3,
    effectiveMaxMonthlyAppointments: 300,
    currentBranchCount: 1,
    currentUserCount: 2,
    currentMonthlyAppointmentCount: 20,
    hasLineIntegration: false,
    hasAdvancedInventory: false,
    hasClinicalSoap: true,
    hasVaccinationRegistry: true,
    hasCommissionEngine: false,
    hasMultiBranchCentral: false,
    hasApiAccess: false,
  };

  const mockTenantOverride = {
    id: 'ov-1',
    tenantId: mockTenantId,
    featureFlagId: 'f-1',
    isEnabled: true,
    expiresAt: null,
    reason: 'VIP Promotion trial',
    createdAt: new Date(),
    updatedAt: new Date(),
    featureFlag: mockFlags[0],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureFlagsService,
        {
          provide: PrismaService,
          useValue: {
            featureFlag: {
              count: jest.fn().mockResolvedValue(3),
              findMany: jest.fn().mockResolvedValue(mockFlags),
              findUnique: jest.fn().mockImplementation((args) => {
                if (args.where.key === 'LINE_MESSAGING' || args.where.id === 'f-1') {
                  return Promise.resolve(mockFlags[0]);
                }
                return Promise.resolve(null);
              }),
              create: jest.fn().mockResolvedValue(mockFlags[0]),
              update: jest.fn().mockResolvedValue(mockFlags[0]),
            },
            tenantFeatureOverride: {
              findMany: jest.fn().mockResolvedValue([mockTenantOverride]),
              upsert: jest.fn().mockResolvedValue(mockTenantOverride),
              deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
            },
            tenant: {
              findUnique: jest.fn().mockResolvedValue({ id: mockTenantId }),
            },
          },
        },
        {
          provide: SubscriptionsService,
          useValue: {
            getTenantSubscription: jest.fn().mockResolvedValue(mockStarterSubDetails),
          },
        },
      ],
    }).compile();

    service = module.get<FeatureFlagsService>(FeatureFlagsService);
    prisma = module.get<PrismaService>(PrismaService);
    subscriptionsService = module.get<SubscriptionsService>(SubscriptionsService);
  });

  describe('getTenantFlags & isFeatureEnabled', () => {
    it('should evaluate global kill-switch as disabled (GLOBAL_OFF)', async () => {
      const flags = await service.getTenantFlags(mockTenantId);
      const teleMed = flags.find((f) => f.key === 'TELE_MED_BETA');

      expect(teleMed).toBeDefined();
      expect(teleMed?.isEnabled).toBe(false);
      expect(teleMed?.source).toBe('GLOBAL_OFF');
    });

    it('should evaluate tenant override ahead of plan entitlement', async () => {
      // Starter plan normally has hasLineIntegration = false, but tenant has explicit override
      const isLineEnabled = await service.isFeatureEnabled(mockTenantId, 'LINE_MESSAGING');
      expect(isLineEnabled).toBe(true);

      const flags = await service.getTenantFlags(mockTenantId);
      const lineFlag = flags.find((f) => f.key === 'LINE_MESSAGING');
      expect(lineFlag?.source).toBe('TENANT_OVERRIDE');
    });

    it('should fallback to plan entitlement if no override exists', async () => {
      const isSoapEnabled = await service.isFeatureEnabled(mockTenantId, 'CLINICAL_SOAP');
      expect(isSoapEnabled).toBe(true); // Starter has Clinical Soap

      const flags = await service.getTenantFlags(mockTenantId);
      const soapFlag = flags.find((f) => f.key === 'CLINICAL_SOAP');
      expect(soapFlag?.source).toBe('PLAN_ENTITLEMENT');
    });
  });

  describe('createFlag & updateFlag', () => {
    it('should create new feature flag', async () => {
      jest.spyOn(prisma.featureFlag, 'findUnique').mockResolvedValueOnce(null);

      const flag = await service.createFlag({
        key: 'AI_AGENT',
        name: 'AI Agent Auto Scheduler',
        category: 'BETA',
      });

      expect(flag).toBeDefined();
      expect(prisma.featureFlag.create).toHaveBeenCalled();
    });

    it('should throw ConflictException on duplicate key', async () => {
      await expect(
        service.createFlag({
          key: 'LINE_MESSAGING',
          name: 'Dupe',
        })
      ).rejects.toThrow(ConflictException);
    });

    it('should update feature flag', async () => {
      const updated = await service.updateFlag('f-1', {
        name: 'LINE Messaging Enhanced',
      });

      expect(updated).toBeDefined();
      expect(prisma.featureFlag.update).toHaveBeenCalled();
    });
  });

  describe('setTenantOverride & removeTenantOverride', () => {
    it('should upsert tenant feature override', async () => {
      const override = await service.setTenantOverride({
        tenantId: mockTenantId,
        featureKey: 'LINE_MESSAGING',
        isEnabled: true,
        reason: 'Promo VIP',
      });

      expect(override).toBeDefined();
      expect(override.isEnabled).toBe(true);
      expect(prisma.tenantFeatureOverride.upsert).toHaveBeenCalled();
    });

    it('should remove tenant feature override', async () => {
      const res = await service.removeTenantOverride(mockTenantId, 'LINE_MESSAGING');

      expect(res.success).toBe(true);
      expect(prisma.tenantFeatureOverride.deleteMany).toHaveBeenCalled();
    });
  });
});
