import { Test, TestingModule } from '@nestjs/testing';
import { RevenueRecoveryService } from './revenue-recovery.service';
import { PrismaService } from '../prisma/prisma.service';
import { NoShowReportService } from './no-show-report.service';
import { GroomingDueService } from '../retention/grooming-due.service';
import { VaccineDueService } from '../retention/vaccine-due.service';
import { RetentionService } from '../retention/retention.service';
import { LineService } from '../line/line.service';

describe('RevenueRecoveryService (Revenue Recovery Command Center)', () => {
  let service: RevenueRecoveryService;
  let prisma: PrismaService;
  let lineService: LineService;

  const mockTenantId = 't1111111-1111-4111-a111-111111111111';
  const otherTenantId = 't2222222-2222-4222-a222-222222222222';

  const mockNoShowSummary = {
    totalAppointments: 100,
    completedAppointments: 85,
    noShowCount: 10,
    cancelledCount: 5,
    noShowRate: 10.0,
    cancellationRate: 5.0,
    totalLostRevenueMinor: 650000, // 6,500 THB
    lostCapacityMinutes: 600,
    averageLostPerNoShowMinor: 65000,
    repeatOffendersCount: 2,
    periodStart: '2026-07-28T00:00:00Z',
    periodEnd: '2026-08-27T23:59:59Z',
  };

  const mockGroomingSummary = {
    totalGroomedPets: 80,
    upcomingCount: 5,
    dueNowCount: 10,
    overdueCount: 15,
    criticalOverdueCount: 0,
    onTrackCount: 55,
    totalDueOrOverdue: 25,
    estimatedPotentialRevenueMinor: 1625000,
    rules: {} as any,
    calculatedAt: '',
  };

  const mockVaccineSummary = {
    totalVaccinatedPets: 80,
    upcomingCount: 7,
    dueNowCount: 8,
    overdueCount: 5,
    criticalOverdueCount: 0,
    upToDateCount: 60,
    totalDueOrOverdue: 20,
    estimatedPotentialRevenueMinor: 1200000,
    rules: {} as any,
    calculatedAt: '',
  };

  const mockRetentionOverview = {
    totalCustomers: 100,
    totalRevenueMinor: 4500000,
    averageLtvMinor: 45000,
    segments: {
      VIP: { count: 10, revenueMinor: 1500000 },
      ACTIVE: { count: 50, revenueMinor: 2200000 },
      NEW: { count: 15, revenueMinor: 400000 },
      AT_RISK: { count: 18, revenueMinor: 300000 },
      LOST: { count: 7, revenueMinor: 100000 },
    },
  };

  const mockGroomingPets = [
    {
      petId: 'pet-1',
      petName: 'น้องบ๊อบบี้',
      species: 'DOG' as const,
      breed: 'Golden Retriever',
      customerId: 'cust-1',
      customerName: 'คุณสมชาย',
      customerPhone: '081-111-2222',
      lineUserId: 'U111',
      dueStatus: 'OVERDUE' as const,
      daysSinceLastGrooming: 60,
      estimatedPriceMinor: 65000,
      recommendedMessage: 'น้องบ๊อบบี้ถึงรอบอาบน้ำตัดขนแล้วครับ',
    },
  ];

  const mockVaccinePets = [
    {
      petId: 'pet-2',
      petName: 'น้องมีมี่',
      species: 'CAT' as const,
      breed: 'Persian',
      customerId: 'cust-2',
      customerName: 'คุณสุนิสา',
      customerPhone: '082-333-4444',
      lineUserId: 'U222',
      riskLevel: 'CRITICAL' as const,
      vaccineName: 'วัคซีนรวมแมวและพิษสุนัขบ้า',
      daysDifference: -45,
      estimatedPriceMinor: 60000,
      recommendedMessage: 'น้องมีมี่ถึงรอบฉีดวัคซีนแล้วครับ',
    },
  ];

  const mockNoShowCustomers = [
    {
      customerId: 'cust-3',
      customerName: 'คุณกิตติศักดิ์',
      customerPhone: '083-555-6666',
      lineUserId: 'U333',
      marketingStatus: 'OPTED_IN' as const,
      totalBookings: 5,
      noShowCount: 2,
      noShowRate: 40.0,
      totalLostRevenueMinor: 130000,
      lastNoShowAt: '2026-08-20T10:00:00Z',
      riskBadge: 'HIGH_RISK' as const,
      requireDeposit: true,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RevenueRecoveryService,
        {
          provide: PrismaService,
          useValue: {
            campaignRecipient: {
              findMany: jest.fn().mockImplementation((args) => {
                if (args?.where?.campaign?.tenantId === mockTenantId) {
                  return Promise.resolve([
                    { status: 'CONVERTED' },
                    { status: 'CONVERTED' },
                  ]);
                }
                return Promise.resolve([]);
              }),
            },
          },
        },
        {
          provide: NoShowReportService,
          useValue: {
            getNoShowSummary: jest.fn().mockImplementation((tenantId) => {
              if (tenantId === mockTenantId) return Promise.resolve(mockNoShowSummary);
              return Promise.resolve({
                totalAppointments: 0,
                completedAppointments: 0,
                noShowCount: 0,
                cancelledCount: 0,
                noShowRate: 0,
                cancellationRate: 0,
                totalLostRevenueMinor: 0,
                lostCapacityMinutes: 0,
                averageLostPerNoShowMinor: 0,
                repeatOffendersCount: 0,
                periodStart: '',
                periodEnd: '',
              });
            }),
            getNoShowByCustomers: jest.fn().mockImplementation((tenantId) => {
              if (tenantId === mockTenantId) return Promise.resolve(mockNoShowCustomers);
              return Promise.resolve([]);
            }),
          },
        },
        {
          provide: GroomingDueService,
          useValue: {
            getGroomingDueSummary: jest.fn().mockImplementation((tenantId) => {
              if (tenantId === mockTenantId) return Promise.resolve(mockGroomingSummary);
              return Promise.resolve({
                totalGroomedPets: 0,
                upcomingCount: 0,
                dueNowCount: 0,
                overdueCount: 0,
                criticalOverdueCount: 0,
                onTrackCount: 0,
                totalDueOrOverdue: 0,
                estimatedPotentialRevenueMinor: 0,
                rules: {} as any,
                calculatedAt: '',
              });
            }),
            getGroomingDuePets: jest.fn().mockImplementation((tenantId) => {
              if (tenantId === mockTenantId) return Promise.resolve({ data: mockGroomingPets });
              return Promise.resolve({ data: [] });
            }),
          },
        },
        {
          provide: VaccineDueService,
          useValue: {
            getVaccineDueSummary: jest.fn().mockImplementation((tenantId) => {
              if (tenantId === mockTenantId) return Promise.resolve(mockVaccineSummary);
              return Promise.resolve({
                totalVaccinatedPets: 0,
                upcomingCount: 0,
                dueNowCount: 0,
                overdueCount: 0,
                criticalOverdueCount: 0,
                upToDateCount: 0,
                totalDueOrOverdue: 0,
                estimatedPotentialRevenueMinor: 0,
                rules: {} as any,
                calculatedAt: '',
              });
            }),
            getVaccineDuePets: jest.fn().mockImplementation((tenantId) => {
              if (tenantId === mockTenantId) return Promise.resolve({ data: mockVaccinePets });
              return Promise.resolve({ data: [] });
            }),
          },
        },
        {
          provide: RetentionService,
          useValue: {
            getRetentionOverview: jest.fn().mockImplementation((tenantId) => {
              if (tenantId === mockTenantId) return Promise.resolve(mockRetentionOverview);
              return Promise.resolve({
                totalCustomers: 0,
                totalRevenueMinor: 0,
                averageLtvMinor: 0,
                segments: {
                  VIP: { count: 0, revenueMinor: 0 },
                  ACTIVE: { count: 0, revenueMinor: 0 },
                  NEW: { count: 0, revenueMinor: 0 },
                  AT_RISK: { count: 0, revenueMinor: 0 },
                  LOST: { count: 0, revenueMinor: 0 },
                },
              });
            }),
          },
        },
        {
          provide: LineService,
          useValue: {
            pushTextMessage: jest.fn().mockResolvedValue({ success: true, messageId: 'msg-123' }),
          },
        },
      ],
    }).compile();

    service = module.get<RevenueRecoveryService>(RevenueRecoveryService);
    prisma = module.get<PrismaService>(PrismaService);
    lineService = module.get<LineService>(LineService);
  });

  describe('getRevenueRecoverySummary', () => {
    it('should aggregate all revenue loss pillars and calculate total opportunity', async () => {
      const summary = await service.getRevenueRecoverySummary(mockTenantId);

      expect(summary).toBeDefined();
      expect(summary.noShowLostMinor).toBe(650000); // 6,500 THB
      expect(summary.noShowCount).toBe(10);

      // Inactive: 18 + 7 = 25 customers * 45000 = 1,125,000
      expect(summary.inactiveCustomersCount).toBe(25);
      expect(summary.inactiveCustomerOpportunityMinor).toBe(1125000);

      // Grooming: 15 + 10 = 25 pets * 65000 = 1,625,000
      expect(summary.groomingDuePetsCount).toBe(25);
      expect(summary.groomingDueOpportunityMinor).toBe(1625000);

      // Vaccine: 5 + 8 + 7 = 20 pets * 60000 = 1,200,000
      expect(summary.vaccineDuePetsCount).toBe(20);
      expect(summary.vaccineDueOpportunityMinor).toBe(1200000);

      // Total Opportunity: 650000 + 1125000 + 1625000 + 1200000 = 4,600,000
      expect(summary.totalOpportunityMinor).toBe(4600000);
      expect(summary.recoveredRevenueMinor).toBe(130000); // 2 * 65000
      expect(summary.recoveryRate).toBeCloseTo(2.8, 1);
    });
  });

  describe('getRevenueRecoveryOpportunities', () => {
    it('should prioritize opportunities by urgency and revenue', async () => {
      const opps = await service.getRevenueRecoveryOpportunities(mockTenantId);

      expect(opps.length).toBe(3);
      // Critical item with highest revenue should be first
      expect(opps[0].urgency).toBe('CRITICAL');
      expect(opps[0].type).toBe('NO_SHOW_FOLLOWUP');
      expect(opps[0].estimatedRevenueMinor).toBe(130000);

      // Second critical item
      expect(opps[1].urgency).toBe('CRITICAL');
      expect(opps[1].type).toBe('VACCINE_DUE');
      expect(opps[1].petName).toBe('น้องมีมี่');
    });
  });

  describe('quickDispatchRecoveryMessage', () => {
    it('should push message to LINE and return success', async () => {
      const res = await service.quickDispatchRecoveryMessage(mockTenantId, {
        customerId: 'cust-1',
        lineUserId: 'U111',
        message: 'น้องบ๊อบบี้ถึงรอบตัดขนแล้วครับ',
        opportunityId: 'opp-1',
      });

      expect(res.success).toBe(true);
      expect(lineService.pushTextMessage).toHaveBeenCalled();
    });

    it('should return error if customer has no LINE ID', async () => {
      const res = await service.quickDispatchRecoveryMessage(mockTenantId, {
        customerId: 'cust-no-line',
        lineUserId: null,
        message: 'Hello',
        opportunityId: 'opp-2',
      });

      expect(res.success).toBe(false);
      expect(res.message).toContain('LINE');
    });
  });

  describe('Tenant Isolation', () => {
    it('should return 0 opportunities and 0 revenue for tenant with no data', async () => {
      const data = await service.getRevenueRecoveryDashboardData(otherTenantId);

      expect(data.summary.totalOpportunityMinor).toBe(0);
      expect(data.opportunities.length).toBe(0);
    });
  });
});
