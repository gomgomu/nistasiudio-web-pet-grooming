import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { VaccinationsService } from './vaccinations.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVaccinationDto } from './dto/create-vaccination.dto';

describe('VaccinationsService (Veterinary Vaccinations & Immunization)', () => {
  let service: VaccinationsService;
  let prisma: PrismaService;

  const mockTenantId = 't1111111-1111-4111-a111-111111111111';
  const otherTenantId = 't2222222-2222-4222-a222-222222222222';
  const mockPetId = 'p1111111-1111-4111-a111-111111111111';
  const mockVaccinationId = 'vac11111-1111-4111-a111-111111111111';

  const mockCustomer = {
    id: 'c1111111-1111-4111-a111-111111111111',
    firstName: 'คุณกนกวรรณ',
    lastName: 'ศรีสุข',
    phone: '089-111-2233',
  };

  const mockPet = {
    id: mockPetId,
    tenantId: mockTenantId,
    name: 'น้องโมจิ',
    species: 'DOG',
    breed: 'Pomeranian',
    birthDate: new Date('2024-05-10'),
    microchipNumber: '900118822334455',
    photoUrl: null,
    customer: mockCustomer,
    vaccinations: [],
  };

  const mockVaccinationRecord = {
    id: mockVaccinationId,
    tenantId: mockTenantId,
    petId: mockPetId,
    clinicVisitId: null,
    productId: null,
    administeredById: 'vet-1',
    vaccineType: 'DOG_CORE_5_IN_1',
    vaccineName: 'Nobivac DHPPi + L (วัคซีนรวมสุนัข 5 โรค)',
    manufacturer: 'MSD Animal Health',
    lotNumber: 'LOT-2026-X99',
    administeredAt: new Date('2026-08-27T10:30:00Z'),
    nextDueAt: new Date('2027-08-27T00:00:00Z'),
    weightKg: 4.5,
    temperatureC: 38.5,
    siteOfInjection: 'Right shoulder (SC)',
    certificateNumber: 'VAC-2026-00441',
    isCompleted: true,
    reminderSent: false,
    reminderSentAt: null,
    notes: 'ไม่มีอาการแพ้',
    createdAt: new Date('2026-08-27T10:30:00Z'),
    pet: mockPet,
    clinicVisit: null,
    administeredBy: {
      firstName: 'น.สพ. วรปรัชญ์',
      lastName: 'เกียรติสกุล',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VaccinationsService,
        {
          provide: PrismaService,
          useValue: {
            pet: {
              findFirst: jest.fn().mockImplementation((args) => {
                if (args.where.id === mockPetId && args.where.tenantId === mockTenantId) {
                  return Promise.resolve({
                    ...mockPet,
                    vaccinations: [mockVaccinationRecord],
                  });
                }
                return Promise.resolve(null);
              }),
            },
            clinicVisit: {
              findFirst: jest.fn().mockResolvedValue({ id: 'v-1' }),
            },
            product: {
              findFirst: jest.fn().mockResolvedValue({ id: 'prod-1' }),
            },
            petVaccination: {
              findMany: jest.fn().mockResolvedValue([mockVaccinationRecord]),
              findFirst: jest.fn().mockImplementation((args) => {
                if (args.where.id === mockVaccinationId && args.where.tenantId === mockTenantId) {
                  return Promise.resolve(mockVaccinationRecord);
                }
                return Promise.resolve(null);
              }),
              create: jest.fn().mockResolvedValue(mockVaccinationRecord),
              update: jest.fn().mockImplementation((args) => {
                return Promise.resolve({
                  ...mockVaccinationRecord,
                  ...args.data,
                });
              }),
              delete: jest.fn().mockResolvedValue(mockVaccinationRecord),
            },
            petMedicalRecord: {
              create: jest.fn().mockResolvedValue({ id: 'med-rec-1' }),
            },
          },
        },
      ],
    }).compile();

    service = module.get<VaccinationsService>(VaccinationsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('getVaccinations', () => {
    it('should query and return vaccination records list', async () => {
      const result = await service.getVaccinations(mockTenantId, {});

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].vaccineName).toContain('Nobivac');
      expect(result[0].petName).toBe('น้องโมจิ');
      expect(result[0].customerName).toContain('กนกวรรณ');
    });
  });

  describe('getPetVaccinationPassport', () => {
    it('should return complete pet vaccination passport', async () => {
      const passport = await service.getPetVaccinationPassport(mockTenantId, mockPetId);

      expect(passport).toBeDefined();
      expect(passport.pet.name).toBe('น้องโมจิ');
      expect(passport.vaccinations.length).toBe(1);
      expect(passport.upcomingDueCount).toBeGreaterThanOrEqual(0);
    });

    it('should throw NotFoundException for non-existent pet or cross-tenant', async () => {
      await expect(
        service.getPetVaccinationPassport(otherTenantId, mockPetId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createVaccination', () => {
    it('should create vaccination record and append snapshot to PetMedicalRecord', async () => {
      const dto: CreateVaccinationDto = {
        petId: mockPetId,
        vaccineName: 'Nobivac DHPPi + L',
        vaccineType: 'DOG_CORE_5_IN_1',
        weightKg: 4.5,
        temperatureC: 38.5,
        siteOfInjection: 'Right shoulder (SC)',
      };

      const result = await service.createVaccination(mockTenantId, dto);

      expect(result).toBeDefined();
      expect(prisma.petVaccination.create).toHaveBeenCalled();
      expect(prisma.petMedicalRecord.create).toHaveBeenCalled();
    });
  });

  describe('updateVaccination & deleteVaccination', () => {
    it('should update vaccination details', async () => {
      const result = await service.updateVaccination(mockTenantId, mockVaccinationId, {
        notes: 'นัดตรวจซ้ำ 1 ปี',
      });

      expect(result).toBeDefined();
      expect(prisma.petVaccination.update).toHaveBeenCalled();
    });

    it('should delete vaccination record', async () => {
      const res = await service.deleteVaccination(mockTenantId, mockVaccinationId);

      expect(res.success).toBe(true);
      expect(prisma.petVaccination.delete).toHaveBeenCalledWith({
        where: { id: mockVaccinationId },
      });
    });
  });
});
