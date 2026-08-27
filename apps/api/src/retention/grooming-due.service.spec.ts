import { Test, TestingModule } from '@nestjs/testing';
import { GroomingDueService } from './grooming-due.service';
import { PrismaService } from '../prisma/prisma.service';
import { GroomingDueSortField } from './dto/query-grooming-due.dto';

describe('GroomingDueService (Grooming Due Detector)', () => {
  let service: GroomingDueService;
  let prisma: PrismaService;

  const mockTenantId = 't1111111-1111-4111-a111-111111111111';
  const otherTenantId = 't2222222-2222-4222-a222-222222222222';

  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const daysFromNow = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const mockCustomer = {
    id: 'cust-1',
    tenantId: mockTenantId,
    firstName: 'สมชาย',
    lastName: 'รักสัตว์',
    phone: '0811112222',
    lineUserId: 'U_line_123',
    marketingStatus: 'OPTED_IN',
  };

  const mockPets = [
    // 1. UPCOMING Pet: Dog groomed 23 days ago (Cycle = 28 days, Due in 5 days, within 7 days window)
    {
      id: 'pet-upcoming',
      tenantId: mockTenantId,
      name: 'โมจิ',
      species: 'DOG',
      breed: 'Pomeranian',
      photoUrl: null,
      specialRequirements: null,
      isActive: true,
      createdAt: daysAgo(100),
      customer: mockCustomer,
      groomingProfile: null,
      appointments: [
        {
          id: 'apt-1',
          startAt: daysAgo(23),
          status: 'COMPLETED',
          priceMinor: BigInt(50000),
          service: { name: 'อาบน้ำตัดขนสุนัขเล็ก' },
        },
      ],
      groomingQueueItems: [],
    },
    // 2. DUE_NOW Pet: Dog groomed 29 days ago (Cycle = 28 days, 1 day overdue -> DUE_NOW)
    {
      id: 'pet-duenow',
      tenantId: mockTenantId,
      name: 'ลัคกี้',
      species: 'DOG',
      breed: 'Golden Retriever',
      photoUrl: null,
      specialRequirements: 'ระวังขาหลัง',
      isActive: true,
      createdAt: daysAgo(120),
      customer: mockCustomer,
      groomingProfile: { warnings: 'ระวังขาหลัง' },
      appointments: [
        {
          id: 'apt-2',
          startAt: daysAgo(29),
          status: 'COMPLETED',
          priceMinor: BigInt(80000),
          service: { name: 'กรูมมิ่งสุนัขใหญ่' },
        },
      ],
      groomingQueueItems: [],
    },
    // 3. OVERDUE Pet: Dog groomed 45 days ago (Cycle = 28 days, 17 days overdue -> OVERDUE)
    {
      id: 'pet-overdue',
      tenantId: mockTenantId,
      name: 'บัดดี้',
      species: 'DOG',
      breed: 'French Bulldog',
      photoUrl: null,
      specialRequirements: null,
      isActive: true,
      createdAt: daysAgo(150),
      customer: mockCustomer,
      groomingProfile: null,
      appointments: [
        {
          id: 'apt-3',
          startAt: daysAgo(45),
          status: 'COMPLETED',
          priceMinor: BigInt(60000),
          service: { name: 'อาบน้ำตัดขน' },
        },
      ],
      groomingQueueItems: [],
    },
    // 4. CRITICAL_OVERDUE Pet: Cat groomed 95 days ago (Cat cycle = 45 days, 50 days overdue -> CRITICAL_OVERDUE)
    {
      id: 'pet-critical',
      tenantId: mockTenantId,
      name: 'ส้มส้ม',
      species: 'CAT',
      breed: 'Persian',
      photoUrl: null,
      specialRequirements: 'ขนพันกันง่าย',
      isActive: true,
      createdAt: daysAgo(200),
      customer: mockCustomer,
      groomingProfile: null,
      appointments: [
        {
          id: 'apt-4',
          startAt: daysAgo(95),
          status: 'COMPLETED',
          priceMinor: BigInt(70000),
          service: { name: 'กรูมมิ่งแมวขนยาว' },
        },
      ],
      groomingQueueItems: [],
    },
    // 5. ON_TRACK Pet: Dog groomed 7 days ago (Cycle = 28 days, 21 days remaining -> ON_TRACK)
    {
      id: 'pet-ontrack',
      tenantId: mockTenantId,
      name: 'ชาโคล',
      species: 'DOG',
      breed: 'Poodle',
      photoUrl: null,
      specialRequirements: null,
      isActive: true,
      createdAt: daysAgo(60),
      customer: mockCustomer,
      groomingProfile: null,
      appointments: [
        {
          id: 'apt-5',
          startAt: daysAgo(7),
          status: 'COMPLETED',
          priceMinor: BigInt(55000),
          service: { name: 'สปาขนสุนัข' },
        },
      ],
      groomingQueueItems: [],
    },
    // 6. Pet with Future Booking: Overdue dog that already booked an appointment for next week
    {
      id: 'pet-future-booking',
      tenantId: mockTenantId,
      name: 'มีมี่',
      species: 'DOG',
      breed: 'Shih Tzu',
      photoUrl: null,
      specialRequirements: null,
      isActive: true,
      createdAt: daysAgo(100),
      customer: mockCustomer,
      groomingProfile: null,
      appointments: [
        {
          id: 'apt-6-past',
          startAt: daysAgo(40),
          status: 'COMPLETED',
          priceMinor: BigInt(50000),
          service: { name: 'ตัดขน' },
        },
        {
          id: 'apt-6-future',
          startAt: daysFromNow(4),
          status: 'CONFIRMED',
          priceMinor: BigInt(50000),
          service: { name: 'ตัดขน' },
        },
      ],
      groomingQueueItems: [],
    },
    // 7. Personalized Cycle Pet: 3 sequential visits with 21 days gap -> personalized cycle = 21 days
    {
      id: 'pet-personalized',
      tenantId: mockTenantId,
      name: 'คุกกี้',
      species: 'DOG',
      breed: 'Bichon',
      photoUrl: null,
      specialRequirements: null,
      isActive: true,
      createdAt: daysAgo(100),
      customer: mockCustomer,
      groomingProfile: null,
      appointments: [
        { id: 'p-apt-1', startAt: daysAgo(21), status: 'COMPLETED', priceMinor: BigInt(60000), service: { name: 'ตัดขน' } },
        { id: 'p-apt-2', startAt: daysAgo(42), status: 'COMPLETED', priceMinor: BigInt(60000), service: { name: 'ตัดขน' } },
        { id: 'p-apt-3', startAt: daysAgo(63), status: 'COMPLETED', priceMinor: BigInt(60000), service: { name: 'ตัดขน' } },
      ],
      groomingQueueItems: [],
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroomingDueService,
        {
          provide: PrismaService,
          useValue: {
            pet: {
              findMany: jest.fn().mockImplementation((args) => {
                if (args?.where?.tenantId === mockTenantId) {
                  return Promise.resolve(mockPets);
                }
                return Promise.resolve([]);
              }),
            },
          },
        },
      ],
    }).compile();

    service = module.get<GroomingDueService>(GroomingDueService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('getGroomingDueSummary', () => {
    it('should calculate due statuses and summary counts accurately', async () => {
      const summary = await service.getGroomingDueSummary(mockTenantId);

      expect(summary).toBeDefined();
      expect(summary.totalGroomedPets).toBe(7);
      expect(summary.upcomingCount).toBe(1); // pet-upcoming
      expect(summary.dueNowCount).toBe(2); // pet-duenow & pet-personalized (21 days ago with 21 days cycle)
      expect(summary.overdueCount).toBe(2); // pet-overdue & pet-future-booking
      expect(summary.criticalOverdueCount).toBe(1); // pet-critical
      expect(summary.onTrackCount).toBe(1); // pet-ontrack
      expect(summary.totalDueOrOverdue).toBe(6);
      expect(summary.estimatedPotentialRevenueMinor).toBeGreaterThan(0);
    });

    it('should support customized cycle rules (e.g. changing dog interval)', async () => {
      // If we change dog interval to 60 days, pet-duenow (29 days ago) and pet-overdue (45 days ago) will be ON_TRACK
      const summary = await service.getGroomingDueSummary(mockTenantId, {
        dogIntervalDays: 60,
        usePersonalizedInterval: false,
      });

      expect(summary.rules.dogIntervalDays).toBe(60);
      expect(summary.onTrackCount).toBeGreaterThanOrEqual(3);
    });
  });

  describe('getGroomingDuePets', () => {
    it('should filter pets by due status (e.g. CRITICAL_OVERDUE)', async () => {
      const result = await service.getGroomingDuePets(mockTenantId, {
        status: 'CRITICAL_OVERDUE',
      });

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
      expect(result.data[0].petId).toBe('pet-critical');
      expect(result.data[0].species).toBe('CAT');
      expect(result.data[0].dueStatus).toBe('CRITICAL_OVERDUE');
      expect(result.data[0].daysDifference).toBeGreaterThan(30);
    });

    it('should correctly detect personalized cycle for pets with >= 2 visits', async () => {
      const result = await service.getGroomingDuePets(mockTenantId, {
        search: 'คุกกี้',
      });

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
      const pet = result.data[0];
      expect(pet.petName).toBe('คุกกี้');
      expect(pet.isPersonalizedCycle).toBe(true);
      expect(pet.cycleDays).toBe(21);
      expect(pet.dueStatus).toBe('DUE_NOW');
    });

    it('should correctly identify future bookings and prevent unnecessary reminders', async () => {
      const result = await service.getGroomingDuePets(mockTenantId, {
        hasFutureBooking: true,
      });

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
      expect(result.data[0].petId).toBe('pet-future-booking');
      expect(result.data[0].hasFutureBooking).toBe(true);
      expect(result.data[0].futureBookingAt).toBeDefined();
    });

    it('should sort pets by daysDifference descending', async () => {
      const result = await service.getGroomingDuePets(mockTenantId, {
        sortBy: GroomingDueSortField.DAYS_DIFFERENCE,
        sortOrder: 'desc',
      });

      expect(result.success).toBe(true);
      expect(result.data[0].petId).toBe('pet-critical'); // most overdue
    });
  });

  describe('Tenant Isolation', () => {
    it('should return 0 due pets for another tenant', async () => {
      const summary = await service.getGroomingDueSummary(otherTenantId);

      expect(summary.totalGroomedPets).toBe(0);
      expect(summary.totalDueOrOverdue).toBe(0);
      expect(summary.estimatedPotentialRevenueMinor).toBe(0);
    });
  });
});
