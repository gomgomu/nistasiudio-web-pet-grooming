import { Test, TestingModule } from '@nestjs/testing';
import { TenantsService } from './tenants.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { BusinessType } from '@prisma/client';

describe('TenantsService', () => {
  let service: TenantsService;

  const mockTenant = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Happy Paws Clinic',
    slug: 'happy-paws',
    businessType: BusinessType.HYBRID_CLINIC_GROOMING,
    phone: '02-123-4567',
    email: 'contact@happypaws.com',
    timezone: 'Asia/Bangkok',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService: Record<string, any> = {
    tenant: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    branch: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback: (tx: any) => Promise<any>) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new tenant with a default main branch', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);
      mockPrismaService.tenant.create.mockResolvedValue(mockTenant);
      mockPrismaService.branch.create.mockResolvedValue({ id: 'branch-1', code: 'MAIN' });

      const result = await service.create({
        name: 'Happy Paws Clinic',
        slug: 'happy-paws',
        businessType: BusinessType.HYBRID_CLINIC_GROOMING,
        phone: '02-123-4567',
        email: 'contact@happypaws.com',
      });

      expect(result).toEqual(mockTenant);
      expect(mockPrismaService.tenant.findUnique).toHaveBeenCalledWith({
        where: { slug: 'happy-paws' },
      });
      expect(mockPrismaService.tenant.create).toHaveBeenCalled();
      expect(mockPrismaService.branch.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if slug already exists', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);

      await expect(
        service.create({
          name: 'Another Clinic',
          slug: 'happy-paws',
        })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('should return tenant by id', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.findById(mockTenant.id);
      expect(result).toEqual(mockTenant);
    });

    it('should throw NotFoundException if tenant not found', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);

      await expect(service.findById('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
