import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsageMeteringService } from './usage-metering.service';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { UsageMetricType } from '@prisma/client';

describe('UsageMeteringService (Resource Usage Metering & Quota Tracking)', () => {
  let service: UsageMeteringService;
  let prisma: PrismaService;
  let subscriptionsService: SubscriptionsService;

  const mockTenantId = 't1111111-1111-4111-a111-111111111111';

  const mockSummary = {
    id: 'sum-1',
    tenantId: mockTenantId,
    metricType: UsageMetricType.LINE_MESSAGES,
    billingPeriod: '2026-08',
    usedQuantity: 400,
    quotaLimit: 500,
    extraCredits: 0,
    lastWarningThreshold: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsageMeteringService,
        {
          provide: PrismaService,
          useValue: {
            tenant: {
              findUnique: jest.fn().mockImplementation((args) => {
                if (args.where.id === mockTenantId) {
                  return Promise.resolve({ id: mockTenantId, name: 'ทองหล่อคลินิก' });
                }
                return Promise.resolve(null);
              }),
            },
            tenantUsageSummary: {
              findUnique: jest.fn().mockResolvedValue(mockSummary),
              create: jest.fn().mockResolvedValue(mockSummary),
              update: jest.fn().mockImplementation((args) => {
                return Promise.resolve({
                  ...mockSummary,
                  ...args.data,
                });
              }),
              groupBy: jest.fn().mockResolvedValue([
                {
                  metricType: UsageMetricType.LINE_MESSAGES,
                  _sum: { usedQuantity: 1200, quotaLimit: 5000, extraCredits: 1000 },
                  _count: { tenantId: 4 },
                },
              ]),
            },
            tenantUsageRecord: {
              create: jest.fn().mockResolvedValue({ id: 'rec-1' }),
            },
            subscription: {
              findFirst: jest.fn().mockResolvedValue({ id: 'sub-1', tenantId: mockTenantId }),
            },
            subscriptionInvoice: {
              create: jest.fn().mockResolvedValue({ id: 'inv-topup-1' }),
            },
          },
        },
        {
          provide: SubscriptionsService,
          useValue: {
            getTenantSubscription: jest.fn().mockResolvedValue({
              planCode: 'STARTER',
            }),
          },
        },
      ],
    }).compile();

    service = module.get<UsageMeteringService>(UsageMeteringService);
    prisma = module.get<PrismaService>(PrismaService);
    subscriptionsService = module.get<SubscriptionsService>(SubscriptionsService);
  });

  describe('recordUsage', () => {
    it('should record consumption event and trigger warning threshold 80%', async () => {
      // 400 + 10 = 410 / 500 = 82% -> WARNING_80
      const res = await service.recordUsage({
        tenantId: mockTenantId,
        metricType: UsageMetricType.LINE_MESSAGES,
        quantity: 10,
        referenceId: 'notif-1',
      });

      expect(res.success).toBe(true);
      expect(res.used).toBe(410);
      expect(res.remaining).toBe(90);
      expect(res.warningLevel).toBe('WARNING_80');
      expect(prisma.tenantUsageRecord.create).toHaveBeenCalled();
    });

    it('should trigger EXCEEDED_100 when quota limit is reached', async () => {
      const res = await service.recordUsage({
        tenantId: mockTenantId,
        metricType: UsageMetricType.LINE_MESSAGES,
        quantity: 150, // 400 + 150 = 550 / 500 = 110%
      });

      expect(res.success).toBe(true);
      expect(res.used).toBe(550);
      expect(res.remaining).toBe(0);
      expect(res.warningLevel).toBe('EXCEEDED_100');
    });
  });

  describe('checkQuota', () => {
    it('should return allowed: true when within quota', async () => {
      // Used: 400, Limit: 500, Needed: 50 -> 450 <= 500 -> true
      const check = await service.checkQuota(mockTenantId, UsageMetricType.LINE_MESSAGES, 50);

      expect(check.allowed).toBe(true);
      expect(check.remaining).toBe(100);
    });

    it('should return allowed: false when quota exceeded', async () => {
      // Used: 400, Limit: 500, Needed: 150 -> 550 > 500 -> false
      const check = await service.checkQuota(mockTenantId, UsageMetricType.LINE_MESSAGES, 150);

      expect(check.allowed).toBe(false);
    });
  });

  describe('getTenantUsageDashboard', () => {
    it('should return full meter items for all 5 metrics', async () => {
      const dashboard = await service.getTenantUsageDashboard(mockTenantId);

      expect(dashboard).toBeDefined();
      expect(dashboard.tenantId).toBe(mockTenantId);
      expect(dashboard.meters.length).toBe(5);
      expect(dashboard.meters.find((m) => m.metricType === 'LINE_MESSAGES')).toBeDefined();
    });

    it('should throw NotFoundException for invalid tenant', async () => {
      await expect(service.getTenantUsageDashboard('invalid-id')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('topUpCredits', () => {
    it('should increase extraCredits and record invoice', async () => {
      const res = await service.topUpCredits(mockTenantId, {
        metricType: UsageMetricType.LINE_MESSAGES,
        credits: 1000,
        amountMinor: 35000,
        paymentMethod: 'PROMPTPAY',
      });

      expect(res.success).toBe(true);
      expect(prisma.tenantUsageSummary.update).toHaveBeenCalled();
      expect(prisma.subscriptionInvoice.create).toHaveBeenCalled();
    });
  });

  describe('getAdminUsageOverview', () => {
    it('should return grouped usage metrics for SaaS Admin', async () => {
      const overview = await service.getAdminUsageOverview();

      expect(overview).toBeDefined();
      expect(overview.length).toBe(1);
      expect(overview[0].metricType).toBe(UsageMetricType.LINE_MESSAGES);
      expect(overview[0].totalUsedQuantity).toBe(1200);
    });
  });
});
