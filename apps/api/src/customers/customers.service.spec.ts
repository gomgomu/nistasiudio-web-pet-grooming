import { Test, TestingModule } from '@nestjs/testing';
import { CustomersService } from './customers.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MarketingStatus } from '@prisma/client';

describe('CustomersService', () => {
  let service: CustomersService;
  let prisma: PrismaService;

  const mockCustomer = {
    id: 'c1111111-1111-4111-a111-111111111111',
    tenantId: 't1111111-1111-4111-a111-111111111111',
    firstName: 'สมชาย',
    lastName: 'ใจดี',
    phone: '089-123-4567',
    email: 'somchai@example.com',
    lineUserId: 'U123456789',
    address: 'กรุงเทพฯ',
    notes: 'ลูกค้าประจำ',
    marketingStatus: MarketingStatus.OPTED_IN,
    createdAt: new Date(),
    updatedAt: new Date(),
    pets: [],
    customerTags: [],
  };

  const mockPrismaService = {
    customer: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    pet: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create customer successfully', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(null);
      mockPrismaService.customer.create.mockResolvedValue(mockCustomer);

      const result = await service.create(mockCustomer.tenantId, {
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        phone: '089-123-4567',
        email: 'somchai@example.com',
      });

      expect(result).toEqual(mockCustomer);
      expect(mockPrismaService.customer.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if phone already exists in tenant', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);

      await expect(
        service.create(mockCustomer.tenantId, {
          firstName: 'สมชาย',
          lastName: 'ใจดี',
          phone: '089-123-4567',
        })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated customers', async () => {
      mockPrismaService.customer.findMany.mockResolvedValue([mockCustomer]);
      mockPrismaService.customer.count.mockResolvedValue(1);

      const result = await service.findAll(mockCustomer.tenantId, { page: 1, limit: 20, q: 'สมชาย' });

      expect(result.items).toEqual([mockCustomer]);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('findById', () => {
    it('should return customer details if tenant matches', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);

      const result = await service.findById(mockCustomer.id, mockCustomer.tenantId);
      expect(result).toEqual(mockCustomer);
    });

    it('should throw ForbiddenException if tenantId does not match', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);

      await expect(
        service.findById(mockCustomer.id, 'other-tenant-uuid')
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if customer not found', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(null);

      await expect(
        service.findById('non-existent-id', mockCustomer.tenantId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update customer details successfully', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.customer.update.mockResolvedValue({
        ...mockCustomer,
        firstName: 'สมศักดิ์',
      });

      const result = await service.update(mockCustomer.id, mockCustomer.tenantId, {
        firstName: 'สมศักดิ์',
      });

      expect(result.firstName).toBe('สมศักดิ์');
    });
  });

  describe('delete', () => {
    it('should delete customer successfully', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.customer.delete.mockResolvedValue(mockCustomer);

      const result = await service.delete(mockCustomer.id, mockCustomer.tenantId);
      expect(result).toEqual(mockCustomer);
    });
  });

  describe('importCsv', () => {
    it('should import customers and pets successfully from rows', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(null);
      mockPrismaService.customer.create.mockResolvedValue(mockCustomer);
      mockPrismaService.pet.create.mockResolvedValue({ id: 'p1' });

      const result = await service.importCsv(mockCustomer.tenantId, {
        rows: [
          {
            firstName: 'กนกวรรณ',
            lastName: 'รักดี',
            phone: '089-111-2233',
            petName: 'โมจิ',
            species: 'DOG',
            breed: 'Pomeranian',
          },
        ],
      });

      expect(result.totalRows).toBe(1);
      expect(result.importedCustomers).toBe(1);
      expect(result.importedPets).toBe(1);
      expect(result.failedRows).toBe(0);
    });

    it('should parse and import customers from raw CSV text content', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(null);
      mockPrismaService.customer.create.mockResolvedValue(mockCustomer);
      mockPrismaService.pet.create.mockResolvedValue({ id: 'p1' });

      const csvContent = `firstName,lastName,phone,petName,species,breed\nกนกวรรณ,รักดี,089-111-2233,โมจิ,DOG,Pomeranian`;

      const result = await service.importCsv(mockCustomer.tenantId, { csvContent });
      expect(result.totalRows).toBe(1);
      expect(result.importedCustomers).toBe(1);
      expect(result.importedPets).toBe(1);
    });

    it('should report validation errors for invalid rows', async () => {
      const result = await service.importCsv(mockCustomer.tenantId, {
        rows: [
          {
            firstName: '',
            phone: '089-111-2233',
          },
          {
            firstName: 'สมชาย',
            phone: '',
          },
        ],
      });

      expect(result.totalRows).toBe(2);
      expect(result.failedRows).toBe(2);
      expect(result.errors.length).toBe(2);
      expect(result.errors[0].reason).toContain('First name is required');
      expect(result.errors[1].reason).toContain('Phone number is required');
    });
  });
});
