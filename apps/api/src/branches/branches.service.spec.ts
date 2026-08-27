import { Test, TestingModule } from '@nestjs/testing';
import { BranchesService } from './branches.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';

describe('BranchesService', () => {
  let service: BranchesService;

  const mockBranch = {
    id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
    tenantId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Thonglor Branch',
    code: 'TL-01',
    address: '888 Sukhumvit',
    phone: '02-712-3456',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    tenant: {
      findUnique: jest.fn(),
    },
    branch: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BranchesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BranchesService>(BranchesService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a branch successfully', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue({ id: mockBranch.tenantId });
      mockPrismaService.branch.findUnique.mockResolvedValue(null);
      mockPrismaService.branch.create.mockResolvedValue(mockBranch);

      const result = await service.create({
        tenantId: mockBranch.tenantId,
        name: 'Thonglor Branch',
        code: 'TL-01',
      });

      expect(result).toEqual(mockBranch);
      expect(mockPrismaService.branch.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if branch code exists in tenant', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue({ id: mockBranch.tenantId });
      mockPrismaService.branch.findUnique.mockResolvedValue(mockBranch);

      await expect(
        service.create({
          tenantId: mockBranch.tenantId,
          name: 'Another Branch',
          code: 'TL-01',
        })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('tenant isolation', () => {
    it('should throw ForbiddenException if branch belongs to another tenant', async () => {
      mockPrismaService.branch.findUnique.mockResolvedValue(mockBranch);

      await expect(
        service.findById(mockBranch.id, 'different-tenant-uuid')
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return branch if tenant matches', async () => {
      mockPrismaService.branch.findUnique.mockResolvedValue(mockBranch);

      const result = await service.findById(mockBranch.id, mockBranch.tenantId);
      expect(result).toEqual(mockBranch);
    });
  });
});
