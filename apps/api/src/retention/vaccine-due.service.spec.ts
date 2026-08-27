import { Test, TestingModule } from '@nestjs/testing';
import { VaccineDueService } from './vaccine-due.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { VaccineDueSortField } from './dto/query-vaccine-due.dto';

describe('VaccineDueService (Vaccine Due Detector)', () => {
  let service: VaccineDueService;
  let prisma: PrismaService;

  const mockTenantId = 't1111111-1111-4111-a111-111111111111';
  const otherTenantId = 't2222222-2222-4222-a222-222222222222';

  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const daysFromNow = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const mockCustomer = {
    id: 'cust-1',
    tenantId: mockTenantId,
    firstName: 'วิภา',
    lastName: 'รักหมา',
    phone: '0812345678',
    lineUserId: 'U_line_vax',
    marketingStatus: 'OPTED_IN',
  };

  const mockPets = [
    // 1. UPCOMING Pet: Dog vaccinated 345 days ago -> Next due in 20 days (within 30 days upcoming window)
    {
      id: 'pet-vax-upcoming',
      tenantId: mockTenantId,
      name: 'โมจิ',
      species: 'DOG',
      breed: 'Pomeranian',
      birthDate: daysAgo(700),
      photoUrl: null,
      isActive: true,
      createdAt: daysAgo(500),
      customer: mockCustomer,
      vaccinations: [
        {
          id: 'vax-1',
          vaccineName: 'วัคซีนรวมสุนัข 5 โรค (DHPPi)',
          lotNumber: 'LOT-2025-01',
          administeredAt: daysAgo(345),
          nextDueAt: daysFromNow(20),
        },
      ],
      appointments: [],
    },
    // 2. DUE_NOW Pet: Dog vaccinated 368 days ago -> Next due 3 days ago (overdue by 3 days -> DUE_NOW)
    {
      id: 'pet-vax-duenow',
      tenantId: mockTenantId,
      name: 'ลัคกี้',
      species: 'DOG',
      breed: 'Golden Retriever',
      birthDate: daysAgo(800),
      photoUrl: null,
      isActive: true,
      createdAt: daysAgo(600),
      customer: mockCustomer,
      vaccinations: [
        {
          id: 'vax-2',
          vaccineName: 'วัคซีนพิษสุนัขบ้า (Rabies)',
          lotNumber: 'LOT-RAB-02',
          administeredAt: daysAgo(368),
          nextDueAt: daysAgo(3),
        },
      ],
      appointments: [],
    },
    // 3. OVERDUE Pet: Cat vaccinated 400 days ago -> Overdue by 35 days (15-60 days overdue -> OVERDUE)
    {
      id: 'pet-vax-overdue',
      tenantId: mockTenantId,
      name: 'ส้มส้ม',
      species: 'CAT',
      breed: 'Persian',
      birthDate: daysAgo(500),
      photoUrl: null,
      isActive: true,
      createdAt: daysAgo(450),
      customer: mockCustomer,
      vaccinations: [
        {
          id: 'vax-3',
          vaccineName: 'วัคซีนรวมไข้หัด-หวัดแมว (FVRCP)',
          lotNumber: 'LOT-CAT-03',
          administeredAt: daysAgo(400),
          nextDueAt: daysAgo(35),
        },
      ],
      appointments: [],
    },
    // 4. CRITICAL_OVERDUE Pet: Dog vaccinated 480 days ago -> Overdue by 115 days (>60 days -> CRITICAL_OVERDUE)
    {
      id: 'pet-vax-critical',
      tenantId: mockTenantId,
      name: 'บัดดี้',
      species: 'DOG',
      breed: 'French Bulldog',
      birthDate: daysAgo(900),
      photoUrl: null,
      isActive: true,
      createdAt: daysAgo(700),
      customer: mockCustomer,
      vaccinations: [
        {
          id: 'vax-4',
          vaccineName: 'วัคซีนรวมสุนัข 6 โรค (DHPPL)',
          lotNumber: 'LOT-DOG-04',
          administeredAt: daysAgo(480),
          nextDueAt: daysAgo(115),
        },
      ],
      appointments: [],
    },
    // 5. UP_TO_DATE Pet: Cat vaccinated 60 days ago -> Next due in 305 days (> 30 days -> UP_TO_DATE)
    {
      id: 'pet-vax-uptodate',
      tenantId: mockTenantId,
      name: 'ชาโคล',
      species: 'CAT',
      breed: 'British Shorthair',
      birthDate: daysAgo(300),
      photoUrl: null,
      isActive: true,
      createdAt: daysAgo(200),
      customer: mockCustomer,
      vaccinations: [
        {
          id: 'vax-5',
          vaccineName: 'วัคซีนลิวคีเมียแมว (FeLV)',
          lotNumber: 'LOT-FELV-05',
          administeredAt: daysAgo(60),
          nextDueAt: daysFromNow(305),
        },
      ],
      appointments: [],
    },
    // 6. Pet with Future Booking: Due now (overdue by 5 days) that already booked appointment
    {
      id: 'pet-vax-booked',
      tenantId: mockTenantId,
      name: 'คุกกี้',
      species: 'DOG',
      breed: 'Bichon',
      birthDate: daysAgo(400),
      photoUrl: null,
      isActive: true,
      createdAt: daysAgo(300),
      customer: mockCustomer,
      vaccinations: [
        {
          id: 'vax-6',
          vaccineName: 'วัคซีนพิษสุนัขบ้า (Rabies)',
          lotNumber: 'LOT-RAB-06',
          administeredAt: daysAgo(370),
          nextDueAt: daysAgo(5),
        },
      ],
      appointments: [
        {
          id: 'apt-vax-future',
          startAt: daysFromNow(3),
          status: 'CONFIRMED',
        },
      ],
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VaccineDueService,
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
              findFirst: jest.fn().mockImplementation((args) => {
                if (args?.where?.tenantId === mockTenantId) {
                  const pet = mockPets.find((p) => p.id === args?.where?.id);
                  return Promise.resolve(pet || null);
                }
                return Promise.resolve(null);
              }),
            },
            petVaccination: {
              create: jest.fn().mockImplementation((args) => {
                return Promise.resolve({
                  id: 'new-vax-id',
                  ...args.data,
                  createdAt: new Date(),
                });
              }),
            },
          },
        },
      ],
    }).compile();

    service = module.get<VaccineDueService>(VaccineDueService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('getVaccineDueSummary', () => {
    it('should aggregate vaccination due statuses properly', async () => {
      const summary = await service.getVaccineDueSummary(mockTenantId);

      expect(summary).toBeDefined();
      expect(summary.totalVaccinatedPets).toBe(6);
      expect(summary.upcomingCount).toBe(1); // pet-vax-upcoming
      expect(summary.dueNowCount).toBe(2); // pet-vax-duenow & pet-vax-booked
      expect(summary.overdueCount).toBe(1); // pet-vax-overdue
      expect(summary.criticalOverdueCount).toBe(1); // pet-vax-critical
      expect(summary.upToDateCount).toBe(1); // pet-vax-uptodate
      expect(summary.totalDueOrOverdue).toBe(5);
      expect(summary.estimatedPotentialRevenueMinor).toBeGreaterThan(0);
    });
  });

  describe('getVaccineDuePets', () => {
    it('should filter pets by due status (e.g. CRITICAL_OVERDUE)', async () => {
      const result = await service.getVaccineDuePets(mockTenantId, {
        status: 'CRITICAL_OVERDUE',
      });

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
      expect(result.data[0].petId).toBe('pet-vax-critical');
      expect(result.data[0].dueStatus).toBe('CRITICAL_OVERDUE');
      expect(result.data[0].riskLevel).toBe('CRITICAL');
    });

    it('should filter pets by vaccine type (e.g. Rabies)', async () => {
      const result = await service.getVaccineDuePets(mockTenantId, {
        vaccineType: 'Rabies',
      });

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(2); // pet-vax-duenow & pet-vax-booked
      expect(result.data.every((p) => p.vaccineName.includes('Rabies'))).toBe(true);
    });

    it('should filter pets with future booking', async () => {
      const result = await service.getVaccineDuePets(mockTenantId, {
        hasFutureBooking: true,
      });

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
      expect(result.data[0].petId).toBe('pet-vax-booked');
      expect(result.data[0].hasFutureBooking).toBe(true);
    });

    it('should sort by daysDifference descending', async () => {
      const result = await service.getVaccineDuePets(mockTenantId, {
        sortBy: VaccineDueSortField.DAYS_DIFFERENCE,
        sortOrder: 'desc',
      });

      expect(result.success).toBe(true);
      expect(result.data[0].petId).toBe('pet-vax-critical');
    });
  });

  describe('recordVaccination', () => {
    it('should record a new vaccination successfully for valid pet', async () => {
      const result = await service.recordVaccination(mockTenantId, {
        petId: 'pet-vax-upcoming',
        vaccineName: 'วัคซีนรวมสุนัข 5 โรค (DHPPi)',
        lotNumber: 'LOT-NEW-2026',
        administeredAt: now.toISOString(),
      });

      expect(result).toBeDefined();
      expect(result.petId).toBe('pet-vax-upcoming');
      expect(result.vaccineName).toBe('วัคซีนรวมสุนัข 5 โรค (DHPPi)');
    });

    it('should throw NotFoundException if pet does not belong to the tenant', async () => {
      await expect(
        service.recordVaccination(mockTenantId, {
          petId: 'non-existent-pet',
          vaccineName: 'Rabies',
        })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Tenant Isolation', () => {
    it('should return 0 records for another tenant', async () => {
      const summary = await service.getVaccineDueSummary(otherTenantId);

      expect(summary.totalVaccinatedPets).toBe(0);
      expect(summary.totalDueOrOverdue).toBe(0);
    });
  });
});
