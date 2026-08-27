import { Test, TestingModule } from '@nestjs/testing';
import { ServicesService } from './services.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PetSpecies, Prisma } from '@prisma/client';

describe('ServicesService', () => {
  let service: ServicesService;
  let prisma: PrismaService;

  const mockTenantId = 't1111111-1111-4111-a111-111111111111';
  const mockOtherTenantId = 't2222222-2222-4222-a222-222222222222';

  const mockCategory = {
    id: 'cat-1111-1111-1111-111111111111',
    tenantId: mockTenantId,
    name: 'อาบน้ำตัดขน',
    createdAt: new Date(),
    services: [],
    _count: { services: 2 },
  };

  const mockBranch = {
    id: 'b1111111-1111-4111-a111-111111111111',
    tenantId: mockTenantId,
    name: 'สาขาสุขุมวิท',
    code: 'BKK01',
  };

  const mockService = {
    id: 'srv-1111-1111-1111-111111111111',
    tenantId: mockTenantId,
    branchId: mockBranch.id,
    categoryId: mockCategory.id,
    name: 'ตัดขนสุนัขพันธุ์เล็ก (Small Dog Grooming)',
    category: 'GROOMING',
    durationMinutes: 60,
    basePriceMinor: BigInt(45000),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    serviceCategory: mockCategory,
    branch: mockBranch,
  };

  const mockPrismaService = {
    serviceCategory: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    branch: {
      findUnique: jest.fn(),
    },
    service: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    servicePriceRule: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    pet: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Category Tests
  // ---------------------------------------------------------------------------

  describe('createCategory', () => {
    it('should create a service category successfully', async () => {
      mockPrismaService.serviceCategory.findUnique.mockResolvedValue(null);
      mockPrismaService.serviceCategory.create.mockResolvedValue(mockCategory);

      const result = await service.createCategory(mockTenantId, {
        name: 'อาบน้ำตัดขน',
      });

      expect(result).toEqual(mockCategory);
      expect(mockPrismaService.serviceCategory.create).toHaveBeenCalledWith({
        data: {
          tenantId: mockTenantId,
          name: 'อาบน้ำตัดขน',
        },
      });
    });

    it('should throw ConflictException if category name already exists', async () => {
      mockPrismaService.serviceCategory.findUnique.mockResolvedValue(mockCategory);

      await expect(
        service.createCategory(mockTenantId, { name: 'อาบน้ำตัดขน' })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAllCategories', () => {
    it('should return all categories for tenant', async () => {
      mockPrismaService.serviceCategory.findMany.mockResolvedValue([mockCategory]);

      const result = await service.findAllCategories(mockTenantId);
      expect(result).toEqual([mockCategory]);
      expect(mockPrismaService.serviceCategory.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId },
        orderBy: { name: 'asc' },
        include: { _count: { select: { services: true } } },
      });
    });
  });

  describe('findCategoryById', () => {
    it('should return category when found and belongs to tenant', async () => {
      mockPrismaService.serviceCategory.findUnique.mockResolvedValue(mockCategory);

      const result = await service.findCategoryById(mockCategory.id, mockTenantId);
      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException if category does not exist', async () => {
      mockPrismaService.serviceCategory.findUnique.mockResolvedValue(null);

      await expect(
        service.findCategoryById('non-existent-id', mockTenantId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if category belongs to another tenant', async () => {
      mockPrismaService.serviceCategory.findUnique.mockResolvedValue({
        ...mockCategory,
        tenantId: mockOtherTenantId,
      });

      await expect(
        service.findCategoryById(mockCategory.id, mockTenantId)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateCategory', () => {
    it('should update category name successfully', async () => {
      mockPrismaService.serviceCategory.findUnique
        .mockResolvedValueOnce(mockCategory) // for findCategoryById
        .mockResolvedValueOnce(null); // for uniqueness check
      mockPrismaService.serviceCategory.update.mockResolvedValue({
        ...mockCategory,
        name: 'สปาและทรีตเมนต์',
      });

      const result = await service.updateCategory(mockCategory.id, mockTenantId, {
        name: 'สปาและทรีตเมนต์',
      });

      expect(result.name).toEqual('สปาและทรีตเมนต์');
    });

    it('should throw ConflictException if updated name belongs to another category in same tenant', async () => {
      mockPrismaService.serviceCategory.findUnique
        .mockResolvedValueOnce(mockCategory) // for findCategoryById
        .mockResolvedValueOnce({ ...mockCategory, id: 'other-cat-id' }); // for duplicate name

      await expect(
        service.updateCategory(mockCategory.id, mockTenantId, {
          name: 'ชื่อซ้ำ',
        })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('deleteCategory', () => {
    it('should unbind services and delete category', async () => {
      mockPrismaService.serviceCategory.findUnique.mockResolvedValue(mockCategory);
      mockPrismaService.service.updateMany.mockResolvedValue({ count: 2 });
      mockPrismaService.serviceCategory.delete.mockResolvedValue(mockCategory);

      const result = await service.deleteCategory(mockCategory.id, mockTenantId);
      expect(result).toEqual({ message: 'Service category deleted successfully' });
      expect(mockPrismaService.service.updateMany).toHaveBeenCalled();
      expect(mockPrismaService.serviceCategory.delete).toHaveBeenCalledWith({
        where: { id: mockCategory.id },
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Service Tests
  // ---------------------------------------------------------------------------

  describe('create', () => {
    it('should create service successfully and convert BigInt basePriceMinor to Number', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(null);
      mockPrismaService.serviceCategory.findUnique.mockResolvedValue(mockCategory);
      mockPrismaService.branch.findUnique.mockResolvedValue(mockBranch);
      mockPrismaService.service.create.mockResolvedValue(mockService);

      const result = await service.create(mockTenantId, {
        name: 'ตัดขนสุนัขพันธุ์เล็ก (Small Dog Grooming)',
        categoryId: mockCategory.id,
        branchId: mockBranch.id,
        durationMinutes: 60,
        basePriceMinor: 45000,
      });

      expect(result.name).toEqual('ตัดขนสุนัขพันธุ์เล็ก (Small Dog Grooming)');
      expect(result.basePriceMinor).toEqual(45000);
      expect(typeof result.basePriceMinor).toBe('number');
    });

    it('should throw ConflictException if service name already exists in tenant', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);

      await expect(
        service.create(mockTenantId, {
          name: 'ตัดขนสุนัขพันธุ์เล็ก (Small Dog Grooming)',
        })
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ForbiddenException if referenced category belongs to another tenant', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(null);
      mockPrismaService.serviceCategory.findUnique.mockResolvedValue({
        ...mockCategory,
        tenantId: mockOtherTenantId,
      });

      await expect(
        service.create(mockTenantId, {
          name: 'New Service',
          categoryId: mockCategory.id,
        })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if referenced branch belongs to another tenant', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(null);
      mockPrismaService.branch.findUnique.mockResolvedValue({
        ...mockBranch,
        tenantId: mockOtherTenantId,
      });

      await expect(
        service.create(mockTenantId, {
          name: 'New Service',
          branchId: mockBranch.id,
        })
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('should return paginated services list with filters', async () => {
      mockPrismaService.service.findMany.mockResolvedValue([mockService]);
      mockPrismaService.service.count.mockResolvedValue(1);

      const result = await service.findAll(mockTenantId, {
        q: 'Grooming',
        category: 'GROOMING',
        isActive: true,
        page: 1,
        limit: 20,
      });

      expect(result.items.length).toBe(1);
      expect(result.items[0].basePriceMinor).toBe(45000);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('findById', () => {
    it('should return service by ID with serialized price', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);

      const result = await service.findById(mockService.id, mockTenantId);
      expect(result.id).toEqual(mockService.id);
      expect(result.basePriceMinor).toBe(45000);
    });

    it('should throw NotFoundException if service does not exist', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(null);

      await expect(
        service.findById('non-existent-id', mockTenantId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException on cross-tenant access', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue({
        ...mockService,
        tenantId: mockOtherTenantId,
      });

      await expect(
        service.findById(mockService.id, mockTenantId)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update service details successfully', async () => {
      mockPrismaService.service.findUnique
        .mockResolvedValueOnce(mockService) // for findById
        .mockResolvedValueOnce(null); // for uniqueness check
      mockPrismaService.service.update.mockResolvedValue({
        ...mockService,
        name: 'Updated Service Name',
        basePriceMinor: BigInt(50000),
      });

      const result = await service.update(mockService.id, mockTenantId, {
        name: 'Updated Service Name',
        basePriceMinor: 50000,
      });

      expect(result.name).toEqual('Updated Service Name');
      expect(result.basePriceMinor).toBe(50000);
    });
  });

  describe('delete', () => {
    it('should delete service successfully', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.service.delete.mockResolvedValue(mockService);

      const result = await service.delete(mockService.id, mockTenantId);
      expect(result).toEqual({ message: 'Service deleted successfully' });
      expect(mockPrismaService.service.delete).toHaveBeenCalledWith({
        where: { id: mockService.id },
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Price Rules Tests
  // ---------------------------------------------------------------------------

  const mockPriceRule = {
    id: 'pr-1111-1111-1111-111111111111',
    tenantId: mockTenantId,
    serviceId: mockService.id,
    species: PetSpecies.DOG,
    name: 'สุนัขพันธุ์เล็ก (0 - 5 kg)',
    minWeight: new Prisma.Decimal(0),
    maxWeight: new Prisma.Decimal(5),
    priceMinor: BigInt(40000),
    durationMinutes: 45,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    service: mockService,
  };

  describe('createPriceRule', () => {
    it('should create price rule successfully', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.servicePriceRule.create.mockResolvedValue(mockPriceRule);

      const result = await service.createPriceRule(mockTenantId, {
        serviceId: mockService.id,
        species: PetSpecies.DOG,
        name: 'สุนัขพันธุ์เล็ก (0 - 5 kg)',
        minWeight: 0,
        maxWeight: 5,
        priceMinor: 40000,
        durationMinutes: 45,
      });

      expect(result.name).toEqual('สุนัขพันธุ์เล็ก (0 - 5 kg)');
      expect(result.priceMinor).toBe(40000);
      expect(result.minWeight).toBe(0);
      expect(result.maxWeight).toBe(5);
    });

    it('should throw BadRequestException if minWeight > maxWeight', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);

      await expect(
        service.createPriceRule(mockTenantId, {
          serviceId: mockService.id,
          minWeight: 10,
          maxWeight: 5,
          priceMinor: 40000,
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findPriceRulesByService', () => {
    it('should return price rules for service', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.servicePriceRule.findMany.mockResolvedValue([mockPriceRule]);

      const result = await service.findPriceRulesByService(mockService.id, mockTenantId);
      expect(result.length).toBe(1);
      expect(result[0].priceMinor).toBe(40000);
    });
  });

  describe('calculateServicePrice', () => {
    it('should match weight rule and return custom price and duration', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.servicePriceRule.findMany.mockResolvedValue([mockPriceRule]);

      const result = await service.calculateServicePrice(mockTenantId, {
        serviceId: mockService.id,
        species: PetSpecies.DOG,
        weightKg: 3.5, // Inside 0 - 5 kg
      });

      expect(result.isRuleApplied).toBe(true);
      expect(result.appliedRuleId).toBe(mockPriceRule.id);
      expect(result.finalPriceMinor).toBe(40000);
      expect(result.durationMinutes).toBe(45);
    });

    it('should fallback to default base service price when no rule matches', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.servicePriceRule.findMany.mockResolvedValue([mockPriceRule]);

      const result = await service.calculateServicePrice(mockTenantId, {
        serviceId: mockService.id,
        species: PetSpecies.DOG,
        weightKg: 12.0, // Outside 0 - 5 kg
      });

      expect(result.isRuleApplied).toBe(false);
      expect(result.finalPriceMinor).toBe(45000); // Default base price
      expect(result.durationMinutes).toBe(60);    // Default duration
    });

    it('should look up pet weight and species automatically from petId', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.pet.findUnique.mockResolvedValue({
        id: 'p1111111-1111-4111-a111-111111111111',
        tenantId: mockTenantId,
        species: PetSpecies.DOG,
        weight: new Prisma.Decimal(4.0),
      });
      mockPrismaService.servicePriceRule.findMany.mockResolvedValue([mockPriceRule]);

      const result = await service.calculateServicePrice(mockTenantId, {
        serviceId: mockService.id,
        petId: 'p1111111-1111-4111-a111-111111111111',
      });

      expect(result.isRuleApplied).toBe(true);
      expect(result.weightKg).toBe(4.0);
      expect(result.finalPriceMinor).toBe(40000);
    });
  });
});
