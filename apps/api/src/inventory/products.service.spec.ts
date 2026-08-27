import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

describe('ProductsService (PF-039)', () => {
  let service: ProductsService;
  let prisma: any;

  const mockTenantId = 'tenant-uuid-1';
  const mockProductId = 'product-uuid-1';

  beforeEach(async () => {
    prisma = {
      product: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      productCategory: {
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  describe('create', () => {
    const createDto: CreateProductDto = {
      sku: 'SHMP-001',
      barcode: '8850123456789',
      name: 'แชมพูบำรุงขน 300ml',
      category: 'GROOMING_SUPPLY',
      unit: 'ขวด',
      costMinor: 15000,
      salePriceMinor: 35000,
      taxRate: 7.0,
      reorderPoint: 5,
      isPrescriptionOnly: false,
    };

    it('creates a new product successfully with satang prices', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      prisma.product.create.mockResolvedValue({
        id: mockProductId,
        tenantId: mockTenantId,
        ...createDto,
        costMinor: 15000n,
        salePriceMinor: 35000n,
      });

      const result = await service.create(mockTenantId, createDto);

      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: {
          tenantId_sku: {
            tenantId: mockTenantId,
            sku: 'SHMP-001',
          },
        },
      });
      expect(prisma.product.create).toHaveBeenCalled();
      expect(result.id).toBe(mockProductId);
    });

    it('throws ConflictException if SKU already exists for the tenant', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'existing-id', sku: 'SHMP-001' });

      await expect(service.create(mockTenantId, createDto)).rejects.toThrow(
        ConflictException
      );
    });

    it('throws NotFoundException if categoryId does not belong to tenant', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      prisma.productCategory.findFirst.mockResolvedValue(null);

      await expect(
        service.create(mockTenantId, { ...createDto, categoryId: 'invalid-cat-id' })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('returns paginated product list scoped to tenant', async () => {
      prisma.product.findMany.mockResolvedValue([
        { id: mockProductId, sku: 'SHMP-001', name: 'แชมพูบำรุงขน' },
      ]);
      prisma.product.count.mockResolvedValue(1);

      const result = await service.findAll(mockTenantId, { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: mockTenantId }),
        })
      );
    });

    it('filters by search keyword across SKU, barcode, and name', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await service.findAll(mockTenantId, { search: '8850123' });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: mockTenantId,
            OR: [
              { sku: { contains: '8850123', mode: 'insensitive' } },
              { barcode: { contains: '8850123', mode: 'insensitive' } },
              { name: { contains: '8850123', mode: 'insensitive' } },
            ],
          }),
        })
      );
    });
  });

  describe('findOne', () => {
    it('returns product details when found', async () => {
      prisma.product.findFirst.mockResolvedValue({
        id: mockProductId,
        tenantId: mockTenantId,
        sku: 'SHMP-001',
      });

      const result = await service.findOne(mockTenantId, mockProductId);
      expect(result.id).toBe(mockProductId);
    });

    it('throws NotFoundException if product not found', async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      await expect(service.findOne(mockTenantId, 'non-existent')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateProductDto = {
      name: 'แชมพูบำรุงขนสูตรพรีเมียม 300ml',
      salePriceMinor: 38000,
    };

    it('updates product successfully', async () => {
      prisma.product.findFirst.mockResolvedValue({
        id: mockProductId,
        tenantId: mockTenantId,
        sku: 'SHMP-001',
      });
      prisma.product.update.mockResolvedValue({
        id: mockProductId,
        ...updateDto,
        salePriceMinor: 38000n,
      });

      const result = await service.update(mockTenantId, mockProductId, updateDto);

      expect(prisma.product.update).toHaveBeenCalled();
      expect(result.name).toBe(updateDto.name);
    });

    it('throws ConflictException if updated SKU collides with another product', async () => {
      prisma.product.findFirst.mockResolvedValue({
        id: mockProductId,
        tenantId: mockTenantId,
        sku: 'SHMP-001',
      });
      prisma.product.findUnique.mockResolvedValue({
        id: 'other-product-id',
        sku: 'SHMP-002',
      });

      await expect(
        service.update(mockTenantId, mockProductId, { sku: 'SHMP-002' })
      ).rejects.toThrow(ConflictException);
    });

    it('throws NotFoundException if product does not exist', async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      await expect(
        service.update(mockTenantId, 'non-existent', updateDto)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deactivates (soft delete) product if transaction history exists', async () => {
      prisma.product.findFirst.mockResolvedValue({
        id: mockProductId,
        tenantId: mockTenantId,
        _count: { invoiceItems: 2, inventoryTransactions: 5, purchaseItems: 0 },
      });
      prisma.product.update.mockResolvedValue({ id: mockProductId, isActive: false });

      const result = await service.remove(mockTenantId, mockProductId);

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: mockProductId },
        data: { isActive: false },
      });
      expect(result.deactivated).toBe(true);
    });

    it('hard deletes product if no transaction history exists', async () => {
      prisma.product.findFirst.mockResolvedValue({
        id: mockProductId,
        tenantId: mockTenantId,
        _count: { invoiceItems: 0, inventoryTransactions: 0, purchaseItems: 0 },
      });
      prisma.product.delete.mockResolvedValue({ id: mockProductId });

      const result = await service.remove(mockTenantId, mockProductId);

      expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: mockProductId } });
      expect(result.deleted).toBe(true);
    });

    it('throws NotFoundException if product does not exist', async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      await expect(service.remove(mockTenantId, 'non-existent')).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
