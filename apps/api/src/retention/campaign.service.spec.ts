import { Test, TestingModule } from '@nestjs/testing';
import { CampaignService } from './campaign.service';
import { PrismaService } from '../prisma/prisma.service';
import { RetentionService } from './retention.service';
import { LineService } from '../line/line.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('CampaignService (Win-Back Campaigns & Marketing)', () => {
  let service: CampaignService;
  let prisma: PrismaService;
  let lineService: LineService;
  let retentionService: RetentionService;

  const mockTenantId = 't1111111-1111-4111-a111-111111111111';
  const otherTenantId = 't2222222-2222-4222-a222-222222222222';

  const now = new Date();

  const mockCustomers = [
    {
      id: 'cust-lost-1',
      tenantId: mockTenantId,
      firstName: 'สมศรี',
      lastName: 'ใจดี',
      phone: '0811112222',
      lineUserId: 'U_line_somsri',
      marketingStatus: 'OPTED_IN',
      segment: 'LOST',
      totalSpentMinor: 120000,
      averageTicketMinor: 60000,
      daysSinceLastVisit: 130,
      lastVisitAt: new Date(now.getTime() - 130 * 24 * 60 * 60 * 1000).toISOString(),
      pets: [{ id: 'p1', name: 'ชิโร่', species: 'DOG' }],
    },
    {
      id: 'cust-atrisk-2',
      tenantId: mockTenantId,
      firstName: 'วิชัย',
      lastName: 'เมธากุล',
      phone: '0822223333',
      lineUserId: 'U_line_wichai',
      marketingStatus: 'OPTED_IN',
      segment: 'AT_RISK',
      totalSpentMinor: 250000,
      averageTicketMinor: 80000,
      daysSinceLastVisit: 75,
      lastVisitAt: new Date(now.getTime() - 75 * 24 * 60 * 60 * 1000).toISOString(),
      pets: [{ id: 'p2', name: 'บัดดี้', species: 'DOG' }],
    },
    {
      id: 'cust-optout-3',
      tenantId: mockTenantId,
      firstName: 'ประเสริฐ',
      lastName: 'บุญมี',
      phone: '0833334444',
      lineUserId: null,
      marketingStatus: 'OPTED_OUT', // Should be excluded from marketing
      segment: 'LOST',
      totalSpentMinor: 80000,
      averageTicketMinor: 40000,
      daysSinceLastVisit: 150,
      lastVisitAt: new Date(now.getTime() - 150 * 24 * 60 * 60 * 1000).toISOString(),
      pets: [{ id: 'p3', name: 'เหมียว', species: 'CAT' }],
    },
  ];

  const mockCampaign = {
    id: 'camp-winback-1',
    tenantId: mockTenantId,
    name: 'แคมเปญ Win-Back ลูกค้าหาย 90 วัน',
    channel: 'LINE',
    status: 'DRAFT',
    scheduledAt: now,
    createdAt: now,
    recipients: [
      {
        id: 'recip-1',
        campaignId: 'camp-winback-1',
        customerId: 'cust-lost-1',
        status: 'PENDING',
        sentAt: null,
        customer: mockCustomers[0],
      },
      {
        id: 'recip-2',
        campaignId: 'camp-winback-1',
        customerId: 'cust-atrisk-2',
        status: 'PENDING',
        sentAt: null,
        customer: mockCustomers[1],
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignService,
        {
          provide: PrismaService,
          useValue: {
            campaign: {
              findMany: jest.fn().mockImplementation((args) => {
                if (args?.where?.tenantId === mockTenantId) {
                  return Promise.resolve([mockCampaign]);
                }
                return Promise.resolve([]);
              }),
              findFirst: jest.fn().mockImplementation((args) => {
                if (args?.where?.tenantId === mockTenantId) {
                  return Promise.resolve({
                    ...mockCampaign,
                    id: args?.where?.id || mockCampaign.id,
                  });
                }
                return Promise.resolve(null);
              }),
              create: jest.fn().mockImplementation((args) => {
                return Promise.resolve({
                  id: 'new-camp-id',
                  ...args.data,
                  createdAt: new Date(),
                  recipients: [],
                });
              }),
              update: jest.fn().mockImplementation((args) => {
                return Promise.resolve({
                  ...mockCampaign,
                  ...args.data,
                });
              }),
            },
            campaignRecipient: {
              createMany: jest.fn().mockResolvedValue({ count: 2 }),
              findMany: jest.fn().mockResolvedValue(mockCampaign.recipients),
              findFirst: jest.fn().mockImplementation((args) => {
                const r = mockCampaign.recipients.find(
                  (rec) => rec.customerId === args?.where?.customerId
                );
                return Promise.resolve(r || null);
              }),
              update: jest.fn().mockImplementation((args) => {
                return Promise.resolve({
                  id: args.where.id,
                  status: args.data.status,
                  sentAt: args.data.sentAt,
                });
              }),
            },
          },
        },
        {
          provide: RetentionService,
          useValue: {
            getSegmentedCustomers: jest.fn().mockResolvedValue({
              success: true,
              data: mockCustomers,
              meta: { page: 1, limit: 100, total: 3, totalPages: 1 },
            }),
          },
        },
        {
          provide: LineService,
          useValue: {
            pushTextMessage: jest.fn().mockResolvedValue({
              success: true,
              messageId: 'msg-line-123',
            }),
          },
        },
      ],
    }).compile();

    service = module.get<CampaignService>(CampaignService);
    prisma = module.get<PrismaService>(PrismaService);
    retentionService = module.get<RetentionService>(RetentionService);
    lineService = module.get<LineService>(LineService);
  });

  describe('getCampaignPerformanceSummary', () => {
    it('should calculate overall performance summary properly', async () => {
      const summary = await service.getCampaignPerformanceSummary(mockTenantId);

      expect(summary).toBeDefined();
      expect(summary.totalCampaigns).toBe(1);
      expect(summary.totalMessagesSent).toBe(0);
    });
  });

  describe('getWinBackAudiencePreview', () => {
    it('should preview audience size and exclude opted out customers', async () => {
      const preview = await service.getWinBackAudiencePreview(mockTenantId, 'LOST');

      expect(preview).toBeDefined();
      expect(preview.totalEligibleCustomers).toBe(3);
      expect(preview.optedInCount).toBe(2);
      expect(preview.withLineCount).toBe(2);
      expect(preview.estimatedRecoverableRevenueMinor).toBeGreaterThan(0);
    });
  });

  describe('createCampaign', () => {
    it('should create campaign and filter out PDPA OPTED_OUT recipients', async () => {
      const result = await service.createCampaign(mockTenantId, {
        name: 'แคมเปญ Win-Back ลูกค้ากลุ่มเสี่ยง',
        audienceSegment: 'AT_RISK',
        messageTemplate: 'สวัสดีครับคุณ {customerName} คิดถึงน้อง {petName} รับส่วนลด 15% รหัส {promoCode}',
        promoCode: 'WINBACK15',
        discountType: 'PERCENTAGE',
        discountValue: 15,
      });

      expect(result).toBeDefined();
      expect(prisma.campaign.create).toHaveBeenCalled();
      expect(prisma.campaignRecipient.createMany).toHaveBeenCalled();
    });
  });

  describe('launchCampaign', () => {
    it('should dispatch personalized messages via LineService and complete campaign', async () => {
      const result = await service.launchCampaign(mockTenantId, mockCampaign.id);

      expect(result).toBeDefined();
      expect(lineService.pushTextMessage).toHaveBeenCalledWith(
        mockTenantId,
        'U_line_somsri',
        expect.stringContaining('สมศรี')
      );
      expect(prisma.campaign.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockCampaign.id },
          data: { status: 'COMPLETED' },
        })
      );
    });

    it('should throw NotFoundException if campaign does not belong to tenant', async () => {
      await expect(
        service.launchCampaign(otherTenantId, mockCampaign.id)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('recordCampaignConversion', () => {
    it('should record conversion for valid recipient', async () => {
      const result = await service.recordCampaignConversion(mockTenantId, mockCampaign.id, {
        customerId: 'cust-lost-1',
        amountMinor: 75000,
        notes: 'Used WINBACK15 at reception',
      });

      expect(result).toBeDefined();
      expect(prisma.campaignRecipient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'CONVERTED' }),
        })
      );
    });
  });

  describe('Tenant Isolation', () => {
    it('should return 0 campaigns for other tenant', async () => {
      const result = await service.getCampaigns(otherTenantId, {});

      expect(result.data.length).toBe(0);
      expect(result.meta.total).toBe(0);
    });
  });
});
