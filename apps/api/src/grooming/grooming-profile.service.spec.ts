import { Test, TestingModule } from '@nestjs/testing';
import { GroomingProfileService } from './grooming-profile.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PetSpecies, PetSex } from '@prisma/client';

describe('GroomingProfileService', () => {
  let service: GroomingProfileService;
  let prisma: PrismaService;

  const mockTenantId = 't1111111-1111-4111-a111-111111111111';
  const mockOtherTenantId = 't2222222-2222-4222-a222-222222222222';
  const mockPetId = 'p1111111-1111-4111-a111-111111111111';
  const mockGroomerId = 'u1111111-1111-4111-a111-111111111111';

  const mockPet = {
    id: mockPetId,
    tenantId: mockTenantId,
    customerId: 'c1111111-1111-4111-a111-111111111111',
    name: 'น้องโมจิ',
    species: PetSpecies.DOG,
    breed: 'ปอมเมอเรเนียน',
    sex: PetSex.MALE,
    weight: 3.8,
  };

  const mockGroomer = {
    id: mockGroomerId,
    tenantId: mockTenantId,
    firstName: 'เอกชัย',
    lastName: 'ช่างกรูมมิ่ง',
    role: 'GROOMER',
  };

  const mockGroomingProfile = {
    id: 'gp-1111-1111-1111-111111111111',
    tenantId: mockTenantId,
    petId: mockPetId,
    preferredCut: 'ทรงหน้าหมี ขนตัว 2 ซม. เท้าชิด',
    shampoo: 'แชมพู Hypoallergenic สูตรอ่อนโยน ไม่ใส่น้ำหอม',
    warnings: 'มีติ่งเนื้อที่หลังหูด้านซ้าย ระวังใบมีดบาด',
    behaviorNotes: 'กลัวเสียงไดร์เป่าขน ให้ใช้ลมเบา',
    preferredGroomerId: mockGroomerId,
    specialHandling: 'ต้องใส่คอลล่าร์ตอนตัดเล็บ',
    preferredGroomer: {
      id: mockGroomerId,
      firstName: 'เอกชัย',
      lastName: 'ช่างกรูมมิ่ง',
      role: 'GROOMER',
    },
  };

  const mockPrismaService: any = {
    pet: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    groomingProfile: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroomingProfileService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<GroomingProfileService>(GroomingProfileService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByPetId', () => {
    it('should return pet grooming profile with preferred groomer', async () => {
      mockPrismaService.pet.findUnique.mockResolvedValue(mockPet);
      mockPrismaService.groomingProfile.findUnique.mockResolvedValue(mockGroomingProfile);

      const result = await service.findByPetId(mockTenantId, mockPetId);

      expect(result).toBeDefined();
      expect(result?.preferredCut).toBe(mockGroomingProfile.preferredCut);
      expect(result?.shampoo).toBe(mockGroomingProfile.shampoo);
      expect(mockPrismaService.groomingProfile.findUnique).toHaveBeenCalledWith({
        where: { petId: mockPetId },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if pet does not exist', async () => {
      mockPrismaService.pet.findUnique.mockResolvedValue(null);

      await expect(
        service.findByPetId(mockTenantId, 'non-existent-pet')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if pet belongs to another tenant', async () => {
      mockPrismaService.pet.findUnique.mockResolvedValue({
        ...mockPet,
        tenantId: mockOtherTenantId,
      });

      await expect(
        service.findByPetId(mockTenantId, mockPetId)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('upsertByPetId', () => {
    it('should upsert grooming profile and sync behavior notes to pet record', async () => {
      mockPrismaService.pet.findUnique.mockResolvedValue(mockPet);
      mockPrismaService.user.findUnique.mockResolvedValue(mockGroomer);
      mockPrismaService.groomingProfile.upsert.mockResolvedValue(mockGroomingProfile);
      mockPrismaService.pet.update.mockResolvedValue(mockPet);

      const result = await service.upsertByPetId(mockTenantId, mockPetId, {
        preferredCut: mockGroomingProfile.preferredCut,
        shampoo: mockGroomingProfile.shampoo,
        warnings: mockGroomingProfile.warnings,
        behaviorNotes: mockGroomingProfile.behaviorNotes,
        preferredGroomerId: mockGroomerId,
      });

      expect(result).toBeDefined();
      expect(result.preferredCut).toBe(mockGroomingProfile.preferredCut);
      expect(mockPrismaService.groomingProfile.upsert).toHaveBeenCalled();
      expect(mockPrismaService.pet.update).toHaveBeenCalledWith({
        where: { id: mockPetId },
        data: { behavioralNotes: mockGroomingProfile.behaviorNotes },
      });
    });

    it('should throw NotFoundException if preferred groomer not found', async () => {
      mockPrismaService.pet.findUnique.mockResolvedValue(mockPet);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.upsertByPetId(mockTenantId, mockPetId, {
          preferredGroomerId: 'non-existent-groomer',
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if preferred groomer belongs to another tenant', async () => {
      mockPrismaService.pet.findUnique.mockResolvedValue(mockPet);
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockGroomer,
        tenantId: mockOtherTenantId,
      });

      await expect(
        service.upsertByPetId(mockTenantId, mockPetId, {
          preferredGroomerId: mockGroomerId,
        })
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteByPetId', () => {
    it('should delete grooming profile successfully', async () => {
      mockPrismaService.pet.findUnique.mockResolvedValue(mockPet);
      mockPrismaService.groomingProfile.findUnique.mockResolvedValue(mockGroomingProfile);
      mockPrismaService.groomingProfile.delete.mockResolvedValue(mockGroomingProfile);

      const result = await service.deleteByPetId(mockTenantId, mockPetId);

      expect(result.success).toBe(true);
      expect(mockPrismaService.groomingProfile.delete).toHaveBeenCalledWith({
        where: { petId: mockPetId },
      });
    });
  });
});
