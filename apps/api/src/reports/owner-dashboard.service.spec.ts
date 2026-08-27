import { Test, TestingModule } from '@nestjs/testing';
import { OwnerDashboardService } from './owner-dashboard.service';
import { PrismaService } from '../prisma/prisma.service';
import { RetentionService } from '../retention/retention.service';

describe('OwnerDashboardService (Owner Executive Dashboard Metrics)', () => {
  let service: OwnerDashboardService;
  let prisma: PrismaService;
  let retentionService: RetentionService;

  const mockTenantId = 't1111111-1111-4111-a111-111111111111';
  const otherTenantId = 't2222222-2222-4222-a222-222222222222';
  const mockBranchId = 'b1111111-1111-4111-a111-111111111111';

  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const mockCustomer1 = {
    id: 'cust-1',
    firstName: 'พิมพิศา',
    lastName: 'ว่องวิทย์',
    phone: '081-111-2222',
  };

  const mockCustomer2 = {
    id: 'cust-2',
    firstName: 'ธนากร',
    lastName: 'สุขสวัสดิ์',
    phone: '082-333-4444',
  };

  const mockInvoices = [
    {
      id: 'inv-1',
      invoiceNumber: 'INV-2026-001',
      tenantId: mockTenantId,
      branchId: mockBranchId,
      customerId: mockCustomer1.id,
      customer: mockCustomer1,
      status: 'PAID',
      totalMinor: BigInt(85000), // 850 THB
      paidAt: daysAgo(5),
      createdAt: daysAgo(5),
      payments: [
        { method: 'PROMPT_PAY', amountMinor: BigInt(85000) },
      ],
      items: [
        { itemType: 'GROOMING', totalMinor: BigInt(85000) },
      ],
    },
    {
      id: 'inv-2',
      invoiceNumber: 'INV-2026-002',
      tenantId: mockTenantId,
      branchId: mockBranchId,
      customerId: mockCustomer1.id, // Repeat customer!
      customer: mockCustomer1,
      status: 'PAID',
      totalMinor: BigInt(65000), // 650 THB
      paidAt: daysAgo(2),
      createdAt: daysAgo(2),
      payments: [
        { method: 'CASH', amountMinor: BigInt(65000) },
      ],
      items: [
        { itemType: 'GROOMING', totalMinor: BigInt(65000) },
      ],
    },
    {
      id: 'inv-3',
      invoiceNumber: 'INV-2026-003',
      tenantId: mockTenantId,
      branchId: mockBranchId,
      customerId: mockCustomer2.id,
      customer: mockCustomer2,
      status: 'PAID',
      totalMinor: BigInt(45000), // 450 THB
      paidAt: daysAgo(1),
      createdAt: daysAgo(1),
      payments: [
        { method: 'CREDIT_CARD', amountMinor: BigInt(45000) },
      ],
      items: [
        { itemType: 'SPA', totalMinor: BigInt(45000) },
      ],
    },
  ];

  const mockAppointments = [
    {
      id: 'apt-1',
      tenantId: mockTenantId,
      branchId: mockBranchId,
      customerId: mockCustomer1.id,
      customer: mockCustomer1,
      pet: { name: 'โมจิ' },
      service: { name: 'Full Grooming', basePriceMinor: BigInt(85000), durationMinutes: 90 },
      priceMinor: BigInt(85000),
      status: 'COMPLETED',
      startAt: daysAgo(5),
    },
    {
      id: 'apt-2',
      tenantId: mockTenantId,
      branchId: mockBranchId,
      customerId: mockCustomer2.id,
      customer: mockCustomer2,
      pet: { name: 'ลัคกี้' },
      service: { name: 'Bath & Dry', basePriceMinor: BigInt(45000), durationMinutes: 60 },
      priceMinor: BigInt(45000),
      status: 'NO_SHOW',
      startAt: daysAgo(3),
    },
    {
      id: 'apt-3',
      tenantId: mockTenantId,
      branchId: mockBranchId,
      customerId: mockCustomer1.id,
      customer: mockCustomer1,
      pet: { name: 'โมจิ' },
      service: { name: 'Spa Care', basePriceMinor: BigInt(65000), durationMinutes: 60 },
      priceMinor: BigInt(65000),
      status: 'CONFIRMED',
      startAt: daysAgo(1),
    },
  ];

  const mockRetentionOverview = {
    totalCustomers: 50,
    totalRevenueMinor: 1950000,
    averageLtvMinor: 39000,
    segments: {
      VIP: { count: 8, revenueMinor: 680000 },
      ACTIVE: { count: 22, revenueMinor: 880000 },
      NEW: { count: 6, revenueMinor: 180000 },
      AT_RISK: { count: 10, revenueMinor: 160000 },
      LOST: { count: 4, revenueMinor: 50000 },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OwnerDashboardService,
        {
          provide: PrismaService,
          useValue: {
            branch: {
              findFirst: jest.fn().mockResolvedValue({ id: mockBranchId, name: 'สาขาทองหล่อ' }),
            },
            invoice: {
              findMany: jest.fn().mockImplementation((args) => {
                if (args?.where?.tenantId === mockTenantId) {
                  return Promise.resolve(mockInvoices);
                }
                return Promise.resolve([]);
              }),
            },
            appointment: {
              findMany: jest.fn().mockImplementation((args) => {
                if (args?.where?.tenantId === mockTenantId) {
                  return Promise.resolve(mockAppointments);
                }
                return Promise.resolve([]);
              }),
            },
            customer: {
              count: jest.fn().mockResolvedValue(2),
            },
          },
        },
        {
          provide: RetentionService,
          useValue: {
            getRetentionOverview: jest.fn().mockResolvedValue(mockRetentionOverview),
          },
        },
      ],
    }).compile();

    service = module.get<OwnerDashboardService>(OwnerDashboardService);
    prisma = module.get<PrismaService>(PrismaService);
    retentionService = module.get<RetentionService>(RetentionService);
  });

  describe('getOwnerDashboardMetrics', () => {
    it('should compute revenue, bookings, no-show, and LTV metrics properly', async () => {
      const metrics = await service.getOwnerDashboardMetrics(mockTenantId, {
        period: 'THIS_MONTH',
      });

      expect(metrics).toBeDefined();
      expect(metrics.tenantId).toBe(mockTenantId);

      // Revenue assertions
      expect(metrics.revenue.totalRevenueMinor).toBe(195000); // 85000 + 65000 + 45000
      expect(metrics.revenue.grossProfitMinor).toBeGreaterThan(0);
      expect(metrics.revenue.revenueByPaymentMethod.length).toBeGreaterThan(0);
      expect(metrics.revenue.revenueByCategory.length).toBeGreaterThan(0);

      // Appointment assertions
      expect(metrics.appointments.totalAppointments).toBe(3);
      expect(metrics.appointments.completedAppointments).toBe(1);
      expect(metrics.appointments.noShowCount).toBe(1);
      expect(metrics.appointments.noShowLostRevenueMinor).toBe(45000);
      expect(metrics.appointments.noShowRate).toBeCloseTo(33.3, 1);

      // Customer & LTV assertions
      expect(metrics.customerAndLtv.averageTicketMinor).toBe(65000); // 195000 / 3 invoices = 65000
      expect(metrics.customerAndLtv.repeatCustomersCount).toBe(1);
      expect(metrics.customerAndLtv.inactiveCustomersCount).toBe(14); // 10 At-risk + 4 Lost

      // Retention assertions
      expect(metrics.retentionSummary.vipCount).toBe(8);
      expect(metrics.retentionSummary.activeCount).toBe(22);

      // Trend & Activities assertions
      expect(metrics.dailyRevenueTrend.length).toBeGreaterThan(0);
      expect(metrics.recentActivities.length).toBeGreaterThan(0);
    });

    it('should filter by branch when branchId is provided', async () => {
      const metrics = await service.getOwnerDashboardMetrics(mockTenantId, {
        branchId: mockBranchId,
        period: 'LAST_30_DAYS',
      });

      expect(metrics.branchId).toBe(mockBranchId);
      expect(metrics.branchName).toBe('สาขาทองหล่อ');
    });
  });

  describe('Tenant Isolation', () => {
    it('should return 0 revenue and 0 appointments for another tenant', async () => {
      const metrics = await service.getOwnerDashboardMetrics(otherTenantId, {});

      expect(metrics.revenue.totalRevenueMinor).toBe(0);
      expect(metrics.appointments.totalAppointments).toBe(0);
    });
  });
});
