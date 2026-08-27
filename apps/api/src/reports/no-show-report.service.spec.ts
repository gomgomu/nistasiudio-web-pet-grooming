import { Test, TestingModule } from '@nestjs/testing';
import { NoShowReportService } from './no-show-report.service';
import { PrismaService } from '../prisma/prisma.service';

describe('NoShowReportService (No-Show Analytics & Lost Revenue)', () => {
  let service: NoShowReportService;
  let prisma: PrismaService;

  const mockTenantId = 't1111111-1111-4111-a111-111111111111';
  const otherTenantId = 't2222222-2222-4222-a222-222222222222';
  const mockBranchId = 'b1111111-1111-4111-a111-111111111111';

  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const mockCustomer1 = {
    id: 'cust-noshow-1',
    firstName: 'กิตติศักดิ์',
    lastName: 'มีชัย',
    phone: '081-111-2222',
    lineUserId: 'U_noshow_1',
    marketingStatus: 'OPTED_IN',
  };

  const mockCustomer2 = {
    id: 'cust-good-2',
    firstName: 'สุนิสา',
    lastName: 'เจริญดี',
    phone: '082-333-4444',
    lineUserId: 'U_good_2',
    marketingStatus: 'OPTED_IN',
  };

  const mockService1 = {
    id: 'srv-groom-1',
    name: 'อาบน้ำตัดขนสุนัขพันธุ์เล็ก (Full Grooming Small)',
    basePriceMinor: BigInt(65000), // 650 THB
    durationMinutes: 90,
  };

  const mockService2 = {
    id: 'srv-bath-2',
    name: 'อาบน้ำเป่าขนแมว (Cat Bath & Dry)',
    basePriceMinor: BigInt(45000), // 450 THB
    durationMinutes: 60,
  };

  const mockBranch = {
    id: mockBranchId,
    name: 'สาขาทองหล่อ (Thonglor)',
  };

  const mockPet1 = {
    id: 'pet-1',
    name: 'ชาโคล',
    species: 'DOG',
    breed: 'Poodle',
  };

  const mockPet2 = {
    id: 'pet-2',
    name: 'มิมี่',
    species: 'CAT',
    breed: 'Persian',
  };

  const mockAppointments = [
    // 1. Customer 1 - NO SHOW 1
    {
      id: 'apt-ns-1',
      tenantId: mockTenantId,
      branchId: mockBranchId,
      branch: mockBranch,
      customerId: mockCustomer1.id,
      customer: mockCustomer1,
      petId: mockPet1.id,
      pet: mockPet1,
      serviceId: mockService1.id,
      service: mockService1,
      staffId: 'staff-1',
      assignedStaff: { firstName: 'สมชาย', lastName: 'ใจดี' },
      status: 'NO_SHOW',
      priceMinor: BigInt(65000),
      startAt: daysAgo(20),
      endAt: daysAgo(20),
      cancellationReason: 'ลูกค้าไม่รับสาย และไม่มาตามนัด',
      notes: null,
    },
    // 2. Customer 1 - NO SHOW 2 (Repeat Offender!)
    {
      id: 'apt-ns-2',
      tenantId: mockTenantId,
      branchId: mockBranchId,
      branch: mockBranch,
      customerId: mockCustomer1.id,
      customer: mockCustomer1,
      petId: mockPet1.id,
      pet: mockPet1,
      serviceId: mockService1.id,
      service: mockService1,
      staffId: 'staff-1',
      assignedStaff: { firstName: 'สมชาย', lastName: 'ใจดี' },
      status: 'NO_SHOW',
      priceMinor: BigInt(65000),
      startAt: daysAgo(5),
      endAt: daysAgo(5),
      cancellationReason: 'ไม่มาตามเวลา',
      notes: null,
    },
    // 3. Customer 1 - COMPLETED
    {
      id: 'apt-cp-1',
      tenantId: mockTenantId,
      branchId: mockBranchId,
      branch: mockBranch,
      customerId: mockCustomer1.id,
      customer: mockCustomer1,
      petId: mockPet1.id,
      pet: mockPet1,
      serviceId: mockService2.id,
      service: mockService2,
      staffId: 'staff-1',
      assignedStaff: { firstName: 'สมชาย', lastName: 'ใจดี' },
      status: 'COMPLETED',
      priceMinor: BigInt(45000),
      startAt: daysAgo(10),
      endAt: daysAgo(10),
      cancellationReason: null,
      notes: null,
    },
    // 4. Customer 2 - COMPLETED
    {
      id: 'apt-cp-2',
      tenantId: mockTenantId,
      branchId: mockBranchId,
      branch: mockBranch,
      customerId: mockCustomer2.id,
      customer: mockCustomer2,
      petId: mockPet2.id,
      pet: mockPet2,
      serviceId: mockService2.id,
      service: mockService2,
      staffId: 'staff-1',
      assignedStaff: { firstName: 'สมชาย', lastName: 'ใจดี' },
      status: 'COMPLETED',
      priceMinor: BigInt(45000),
      startAt: daysAgo(8),
      endAt: daysAgo(8),
      cancellationReason: null,
      notes: null,
    },
    // 5. Customer 2 - CANCELLED
    {
      id: 'apt-can-1',
      tenantId: mockTenantId,
      branchId: mockBranchId,
      branch: mockBranch,
      customerId: mockCustomer2.id,
      customer: mockCustomer2,
      petId: mockPet2.id,
      pet: mockPet2,
      serviceId: mockService1.id,
      service: mockService1,
      staffId: 'staff-1',
      assignedStaff: { firstName: 'สมชาย', lastName: 'ใจดี' },
      status: 'CANCELLED',
      priceMinor: BigInt(65000),
      startAt: daysAgo(2),
      endAt: daysAgo(2),
      cancellationReason: null,
      notes: null,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NoShowReportService,
        {
          provide: PrismaService,
          useValue: {
            appointment: {
              findMany: jest.fn().mockImplementation((args) => {
                if (args?.where?.tenantId === mockTenantId) {
                  let res = [...mockAppointments];
                  if (args?.where?.status) {
                    res = res.filter((a) => a.status === args.where.status);
                  }
                  if (args?.where?.branchId) {
                    res = res.filter((a) => a.branchId === args.where.branchId);
                  }
                  return Promise.resolve(res);
                }
                return Promise.resolve([]);
              }),
            },
          },
        },
      ],
    }).compile();

    service = module.get<NoShowReportService>(NoShowReportService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('getNoShowSummary', () => {
    it('should calculate no-show rate, lost revenue, and lost minutes properly', async () => {
      const summary = await service.getNoShowSummary(mockTenantId, {});

      expect(summary).toBeDefined();
      expect(summary.totalAppointments).toBe(5);
      expect(summary.completedAppointments).toBe(2);
      expect(summary.noShowCount).toBe(2);
      expect(summary.cancelledCount).toBe(1);
      expect(summary.noShowRate).toBe(40.0); // 2 out of 5 = 40%
      expect(summary.totalLostRevenueMinor).toBe(130000); // 2 * 65000 = 130000
      expect(summary.lostCapacityMinutes).toBe(180); // 2 * 90 = 180 min
      expect(summary.repeatOffendersCount).toBe(1); // Customer 1 has 2 no shows
    });
  });

  describe('getNoShowByCustomers', () => {
    it('should flag repeat no-show offenders and require deposit', async () => {
      const customers = await service.getNoShowByCustomers(mockTenantId, {});

      expect(customers.length).toBe(1); // Only customer 1 has no-shows
      expect(customers[0].customerId).toBe(mockCustomer1.id);
      expect(customers[0].noShowCount).toBe(2);
      expect(customers[0].requireDeposit).toBe(true);
      expect(customers[0].riskBadge).toBe('HIGH_RISK');
    });
  });

  describe('getNoShowByServices', () => {
    it('should aggregate no-show count and lost revenue by service', async () => {
      const services = await service.getNoShowByServices(mockTenantId, {});

      expect(services.length).toBe(2);
      const srv1 = services.find((s) => s.serviceId === mockService1.id);
      expect(srv1).toBeDefined();
      expect(srv1!.noShowCount).toBe(2);
      expect(srv1!.lostRevenueMinor).toBe(130000);
    });
  });

  describe('getNoShowByDayOfWeek', () => {
    it('should return 7 days with no-show counts and rates', async () => {
      const days = await service.getNoShowByDayOfWeek(mockTenantId, {});

      expect(days.length).toBe(7);
      expect(days[0].dayName).toBe('วันอาทิตย์');
    });
  });

  describe('getNoShowAppointments', () => {
    it('should return paginated list of no-show appointments with details', async () => {
      const result = await service.getNoShowAppointments(mockTenantId, {});

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(2);
      expect(result.data[0].customerName).toBe('กิตติศักดิ์ มีชัย');
      expect(result.data[0].serviceName).toBe('อาบน้ำตัดขนสุนัขพันธุ์เล็ก (Full Grooming Small)');
    });
  });

  describe('Tenant Isolation', () => {
    it('should return 0 records for another tenant', async () => {
      const summary = await service.getNoShowSummary(otherTenantId, {});

      expect(summary.totalAppointments).toBe(0);
      expect(summary.noShowCount).toBe(0);
      expect(summary.totalLostRevenueMinor).toBe(0);
    });
  });
});
