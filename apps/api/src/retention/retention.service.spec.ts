import { Test, TestingModule } from '@nestjs/testing';
import { RetentionService } from './retention.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { SegmentSortField, SortOrder } from './dto/query-segments.dto';

describe('RetentionService (Customer Segmentation)', () => {
  let service: RetentionService;
  let prisma: PrismaService;

  const mockTenantId = 't1111111-1111-4111-a111-111111111111';
  const otherTenantId = 't2222222-2222-4222-a222-222222222222';

  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const mockCustomers = [
    // 1. VIP Customer: High spend (15,000 THB = 1,500,000 satang), 6 visits, last visit 10 days ago
    {
      id: 'cust-vip-1',
      tenantId: mockTenantId,
      firstName: 'สมชาย',
      lastName: 'ใจดี',
      phone: '0811111111',
      email: 'somchai@vip.com',
      lineUserId: 'U_vip_1',
      marketingStatus: 'OPTED_IN',
      createdAt: daysAgo(200),
      pets: [{ id: 'p1', name: 'ชิโร่', species: 'DOG', breed: 'Shiba Inu' }],
      appointments: [
        { id: 'a1', startAt: daysAgo(10), status: 'COMPLETED' },
        { id: 'a2', startAt: daysAgo(40), status: 'COMPLETED' },
        { id: 'a3', startAt: daysAgo(70), status: 'COMPLETED' },
        { id: 'a4', startAt: daysAgo(100), status: 'COMPLETED' },
        { id: 'a5', startAt: daysAgo(130), status: 'COMPLETED' },
        { id: 'a6', startAt: daysAgo(160), status: 'COMPLETED' },
      ],
      invoices: [
        { id: 'inv1', totalMinor: BigInt(1500000), paidAmountMinor: BigInt(1500000), paidAt: daysAgo(10), issuedAt: daysAgo(10) },
      ],
      groomingQueueItems: [],
    },
    // 2. NEW Customer: Registered 10 days ago, 1 appointment
    {
      id: 'cust-new-1',
      tenantId: mockTenantId,
      firstName: 'วิภา',
      lastName: 'เจริญผล',
      phone: '0822222222',
      email: 'wipa@new.com',
      lineUserId: null,
      marketingStatus: 'OPTED_IN',
      createdAt: daysAgo(10),
      pets: [{ id: 'p2', name: 'ส้มส้ม', species: 'CAT', breed: 'Persian' }],
      appointments: [{ id: 'a7', startAt: daysAgo(5), status: 'COMPLETED' }],
      invoices: [
        { id: 'inv2', totalMinor: BigInt(50000), paidAmountMinor: BigInt(50000), paidAt: daysAgo(5), issuedAt: daysAgo(5) },
      ],
      groomingQueueItems: [],
    },
    // 3. ACTIVE Customer: Registered 150 days ago, last visit 25 days ago, 3 visits, spend 2,000 THB
    {
      id: 'cust-active-1',
      tenantId: mockTenantId,
      firstName: 'อนุชา',
      lastName: 'มีสุข',
      phone: '0833333333',
      email: 'anucha@active.com',
      lineUserId: 'U_active_1',
      marketingStatus: 'OPTED_IN',
      createdAt: daysAgo(150),
      pets: [{ id: 'p3', name: 'บัดดี้', species: 'DOG', breed: 'Poodle' }],
      appointments: [
        { id: 'a8', startAt: daysAgo(25), status: 'COMPLETED' },
        { id: 'a9', startAt: daysAgo(80), status: 'COMPLETED' },
        { id: 'a10', startAt: daysAgo(120), status: 'COMPLETED' },
      ],
      invoices: [
        { id: 'inv3', totalMinor: BigInt(200000), paidAmountMinor: BigInt(200000), paidAt: daysAgo(25), issuedAt: daysAgo(25) },
      ],
      groomingQueueItems: [],
    },
    // 4. AT_RISK Customer: Registered 180 days ago, last visit 85 days ago (between 61 and 120 days)
    {
      id: 'cust-risk-1',
      tenantId: mockTenantId,
      firstName: 'กานต์',
      lastName: 'สุวรรณ',
      phone: '0844444444',
      email: 'karn@risk.com',
      lineUserId: null,
      marketingStatus: 'OPTED_IN',
      createdAt: daysAgo(180),
      pets: [{ id: 'p4', name: 'มีมี่', species: 'CAT', breed: 'British Shorthair' }],
      appointments: [{ id: 'a11', startAt: daysAgo(85), status: 'COMPLETED' }],
      invoices: [
        { id: 'inv4', totalMinor: BigInt(80000), paidAmountMinor: BigInt(80000), paidAt: daysAgo(85), issuedAt: daysAgo(85) },
      ],
      groomingQueueItems: [],
    },
    // 5. LOST Customer: Registered 250 days ago, last visit 180 days ago (> 120 days)
    {
      id: 'cust-lost-1',
      tenantId: mockTenantId,
      firstName: 'ประเสริฐ',
      lastName: 'คงมั่น',
      phone: '0855555555',
      email: null,
      lineUserId: null,
      marketingStatus: 'OPTED_OUT',
      createdAt: daysAgo(250),
      pets: [{ id: 'p5', name: 'ด่าง', species: 'DOG', breed: 'Thai Ridgeback' }],
      appointments: [{ id: 'a12', startAt: daysAgo(180), status: 'COMPLETED' }],
      invoices: [
        { id: 'inv5', totalMinor: BigInt(60000), paidAmountMinor: BigInt(60000), paidAt: daysAgo(180), issuedAt: daysAgo(180) },
      ],
      groomingQueueItems: [],
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetentionService,
        {
          provide: PrismaService,
          useValue: {
            customer: {
              findMany: jest.fn().mockImplementation((args) => {
                if (args?.where?.tenantId === mockTenantId) {
                  return Promise.resolve(mockCustomers);
                }
                return Promise.resolve([]);
              }),
              findFirst: jest.fn().mockImplementation((args) => {
                if (args?.where?.tenantId === mockTenantId) {
                  const found = mockCustomers.find((c) => c.id === args?.where?.id);
                  if (found) {
                    return Promise.resolve({
                      ...found,
                      appointments: found.appointments.map((a) => ({ ...a, service: { name: 'อาบน้ำตัดขน' } })),
                      invoices: found.invoices.map((inv) => ({ ...inv, invoiceNo: `INV-${inv.id}`, status: 'PAID' })),
                    });
                  }
                }
                return Promise.resolve(null);
              }),
            },
          },
        },
      ],
    }).compile();

    service = module.get<RetentionService>(RetentionService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('getRetentionOverview', () => {
    it('should accurately calculate segmentation summary metrics for all 5 segments', async () => {
      const overview = await service.getRetentionOverview(mockTenantId);

      expect(overview).toBeDefined();
      expect(overview.totalCustomers).toBe(5);
      expect(overview.totalRevenueMinor).toBe(1500000 + 50000 + 200000 + 80000 + 60000);

      // Verify each segment count and presence
      expect(overview.segments.VIP.count).toBe(1);
      expect(overview.segments.VIP.segment).toBe('VIP');
      expect(overview.segments.VIP.totalRevenueMinor).toBe(1500000);
      expect(overview.segments.VIP.percentage).toBe(20);

      expect(overview.segments.NEW.count).toBe(1);
      expect(overview.segments.NEW.segment).toBe('NEW');
      expect(overview.segments.NEW.totalRevenueMinor).toBe(50000);

      expect(overview.segments.ACTIVE.count).toBe(1);
      expect(overview.segments.ACTIVE.segment).toBe('ACTIVE');
      expect(overview.segments.ACTIVE.totalRevenueMinor).toBe(200000);

      expect(overview.segments.AT_RISK.count).toBe(1);
      expect(overview.segments.AT_RISK.segment).toBe('AT_RISK');
      expect(overview.segments.AT_RISK.totalRevenueMinor).toBe(80000);

      expect(overview.segments.LOST.count).toBe(1);
      expect(overview.segments.LOST.segment).toBe('LOST');
      expect(overview.segments.LOST.totalRevenueMinor).toBe(60000);
    });

    it('should respect custom threshold criteria for segmentation', async () => {
      // Lower VIP threshold to 1,000 THB (100,000 satang)
      const overview = await service.getRetentionOverview(mockTenantId, {
        vipMinSpendMinor: 100000,
        activeDaysThreshold: 30,
      });

      expect(overview.criteria.vipMinSpendMinor).toBe(100000);
      expect(overview.criteria.activeDaysThreshold).toBe(30);
      // Both cust-vip-1 (1,500,000) and cust-active-1 (200,000) will qualify as VIP
      expect(overview.segments.VIP.count).toBe(2);
    });
  });

  describe('getSegmentedCustomers', () => {
    it('should filter customers by segment', async () => {
      const result = await service.getSegmentedCustomers(mockTenantId, {
        segment: 'VIP',
      });

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
      expect(result.data[0].id).toBe('cust-vip-1');
      expect(result.data[0].segment).toBe('VIP');
      expect(result.meta.total).toBe(1);
    });

    it('should filter customers by search query (name, phone, pet)', async () => {
      // Search by pet name "มีมี่"
      const result = await service.getSegmentedCustomers(mockTenantId, {
        search: 'มีมี่',
      });

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
      expect(result.data[0].id).toBe('cust-risk-1');
      expect(result.data[0].pets[0].name).toBe('มีมี่');
    });

    it('should sort customers by monetary spend descending', async () => {
      const result = await service.getSegmentedCustomers(mockTenantId, {
        sortBy: SegmentSortField.MONETARY,
        sortOrder: SortOrder.DESC,
      });

      expect(result.success).toBe(true);
      expect(result.data[0].id).toBe('cust-vip-1');
      expect(result.data[0].totalSpentMinor).toBe(1500000);
      expect(result.data[result.data.length - 1].totalSpentMinor).toBe(50000);
    });

    it('should paginate results properly', async () => {
      const result = await service.getSegmentedCustomers(mockTenantId, {
        page: 1,
        limit: 2,
      });

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(2);
      expect(result.meta.total).toBe(5);
      expect(result.meta.totalPages).toBe(3);
    });
  });

  describe('getCustomerSegmentDetail', () => {
    it('should return detailed segmentation and recent history for a valid customer', async () => {
      const detail = await service.getCustomerSegmentDetail(mockTenantId, 'cust-vip-1');

      expect(detail).toBeDefined();
      expect(detail.id).toBe('cust-vip-1');
      expect(detail.segment).toBe('VIP');
      expect(detail.totalSpentMinor).toBe(1500000);
      expect(detail.recentAppointments.length).toBeGreaterThan(0);
      expect(detail.recentInvoices.length).toBeGreaterThan(0);
    });

    it('should throw NotFoundException if customer does not exist in tenant', async () => {
      await expect(
        service.getCustomerSegmentDetail(mockTenantId, 'non-existent-id')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Tenant Isolation', () => {
    it('should return 0 customers for another tenant without access to mock tenant data', async () => {
      const overview = await service.getRetentionOverview(otherTenantId);

      expect(overview.totalCustomers).toBe(0);
      expect(overview.totalRevenueMinor).toBe(0);
      expect(overview.segments.VIP.count).toBe(0);
      expect(overview.segments.ACTIVE.count).toBe(0);
    });
  });
});
