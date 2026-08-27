import { Test, TestingModule } from '@nestjs/testing';
import { PetsService } from './pets.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PetSex, PetSpecies, Prisma } from '@prisma/client';

describe('PetsService', () => {
  let service: PetsService;
  let prisma: PrismaService;

  const mockTenantId = 't1111111-1111-4111-a111-111111111111';
  const mockCustomer = {
    id: 'c1111111-1111-4111-a111-111111111111',
    tenantId: mockTenantId,
    firstName: 'กนกวรรณ',
    lastName: 'รักดี',
    phone: '089-111-2233',
  };

  const mockPet = {
    id: 'p1111111-1111-4111-a111-111111111111',
    tenantId: mockTenantId,
    customerId: mockCustomer.id,
    name: 'โมจิ (Mochi)',
    species: PetSpecies.DOG,
    breed: 'Pomeranian',
    sex: PetSex.FEMALE,
    weight: new Prisma.Decimal(3.5),
    microchipNumber: '900182001928374',
    allergies: 'แพ้ยา Amoxicillin',
    behavioralNotes: 'กลัวเสียงไดร์เป่าขน',
    specialRequirements: null,
    photoUrl: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    customer: mockCustomer,
  };

  const mockPrismaService = {
    customer: {
      findUnique: jest.fn(),
    },
    pet: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    petNote: { findMany: jest.fn().mockResolvedValue([]) },
    appointment: { findMany: jest.fn().mockResolvedValue([]) },
    clinicVisit: { findMany: jest.fn().mockResolvedValue([]) },
    petMedicalRecord: { findMany: jest.fn().mockResolvedValue([]) },
    petVaccination: { findMany: jest.fn().mockResolvedValue([]) },
    groomingQueueItem: { findMany: jest.fn().mockResolvedValue([]) },
    invoice: { findMany: jest.fn().mockResolvedValue([]) },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PetsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PetsService>(PetsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create pet successfully if customer belongs to tenant', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.pet.create.mockResolvedValue(mockPet);

      const result = await service.create(mockTenantId, {
        customerId: mockCustomer.id,
        name: 'โมจิ (Mochi)',
        species: PetSpecies.DOG,
        breed: 'Pomeranian',
      });

      expect(result).toEqual(mockPet);
      expect(mockPrismaService.pet.create).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if customer belongs to different tenant', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue({
        ...mockCustomer,
        tenantId: 'different-tenant-id',
      });

      await expect(
        service.create(mockTenantId, {
          customerId: mockCustomer.id,
          name: 'โมจิ (Mochi)',
        })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if customer does not exist', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(null);

      await expect(
        service.create(mockTenantId, {
          customerId: 'non-existent-id',
          name: 'โมจิ (Mochi)',
        })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated list of pets', async () => {
      mockPrismaService.pet.findMany.mockResolvedValue([mockPet]);
      mockPrismaService.pet.count.mockResolvedValue(1);

      const result = await service.findAll(mockTenantId, { page: 1, limit: 20 });
      expect(result.items).toEqual([mockPet]);
      expect(result.total).toBe(1);
    });
  });

  describe('findById', () => {
    it('should return pet details if tenant matches', async () => {
      mockPrismaService.pet.findUnique.mockResolvedValue(mockPet);

      const result = await service.findById(mockPet.id, mockTenantId);
      expect(result).toEqual(mockPet);
    });

    it('should throw ForbiddenException if pet tenant does not match', async () => {
      mockPrismaService.pet.findUnique.mockResolvedValue(mockPet);

      await expect(
        service.findById(mockPet.id, 'other-tenant-id')
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update pet details successfully', async () => {
      mockPrismaService.pet.findUnique.mockResolvedValue(mockPet);
      mockPrismaService.pet.update.mockResolvedValue({
        ...mockPet,
        name: 'โมจิจัง (Mochi-chan)',
      });

      const result = await service.update(mockPet.id, mockTenantId, {
        name: 'โมจิจัง (Mochi-chan)',
      });

      expect(result.name).toBe('โมจิจัง (Mochi-chan)');
    });
  });

  describe('delete', () => {
    it('should delete pet successfully', async () => {
      mockPrismaService.pet.findUnique.mockResolvedValue(mockPet);
      mockPrismaService.pet.delete.mockResolvedValue(mockPet);

      const result = await service.delete(mockPet.id, mockTenantId);
      expect(result).toEqual(mockPet);
    });
  });

  describe('getTimeline', () => {
    it('should return chronological timeline events', async () => {
      mockPrismaService.pet.findUnique.mockResolvedValue(mockPet);
      mockPrismaService.petNote.findMany.mockResolvedValue([
        {
          id: 'n1',
          type: 'GENERAL',
          content: 'ชอบกินขนมแกะ',
          createdAt: new Date('2026-08-01T10:00:00Z'),
          creator: { firstName: 'หมอต้น', lastName: 'ใจดี' },
        },
      ]);
      mockPrismaService.petVaccination.findMany.mockResolvedValue([
        {
          id: 'v1',
          vaccineName: 'DHPPiL',
          lotNumber: 'LOT-99',
          administeredAt: new Date('2026-08-10T11:00:00Z'),
          nextDueAt: new Date('2027-08-10'),
        },
      ]);

      const result = await service.getTimeline(mockPet.id, mockTenantId);
      expect(result.petId).toBe(mockPet.id);
      expect(result.totalEvents).toBe(2);
      expect(result.timeline[0].type).toBe('VACCINATION'); // Newer event first
      expect(result.timeline[1].type).toBe('NOTE');
    });
  });
});
