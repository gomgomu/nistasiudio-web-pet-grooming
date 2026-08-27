import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateInventoryTransactionDto, StockTakeAdjustmentDto } from './dto/create-transaction.dto';
import { Prisma } from '@prisma/client';

describe('InventoryService (PF-040)', () => {
  let service: InventoryService;
  let prisma: any;

  const mockTenantId = 'tenant-uuid-1';
  const mockBranchId1 = 'branch-uuid-1';
  const mockBranchId2 = 'branch-uuid-2';
  const mockProductId = 'product-uuid-1';

  beforeEach(async () => {
    prisma = {
      branch: {
        findFirst: jest.fn(),
      },
      product: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      inventoryTransaction: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  describe('recordTransaction', () => {
    beforeEach(() => {
      prisma.branch.findFirst.mockResolvedValue({ id: mockBranchId1, tenantId: mockTenantId });
      prisma.product.findFirst.mockResolvedValue({ id: mockProductId, tenantId: mockTenantId });
    });

    it('records Stock-In (IN) with positive quantity and returns updated balance', async () => {
      prisma.inventoryTransaction.create.mockResolvedValue({
        id: 'tx-1',
        type: 'IN',
        quantity: new Prisma.Decimal(25),
      });
      prisma.inventoryTransaction.findMany.mockResolvedValue([
        { quantity: new Prisma.Decimal(25) },
      ]);

      const dto: CreateInventoryTransactionDto = {
        branchId: mockBranchId1,
        productId: mockProductId,
        type: 'IN',
        quantity: 25,
        referenceType: 'PURCHASE',
      };

      const result = await service.recordTransaction(
        mockTenantId,
        [mockBranchId1],
        dto
      );

      expect(prisma.inventoryTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'IN',
            quantity: new Prisma.Decimal(25),
          }),
        })
      );
      expect((result as any).currentStock).toBe(25);
    });

    it('records Sales Stock-Out (OUT) with negative quantity', async () => {
      prisma.inventoryTransaction.create.mockResolvedValue({
        id: 'tx-2',
        type: 'OUT',
        quantity: new Prisma.Decimal(-3),
      });
      prisma.inventoryTransaction.findMany.mockResolvedValue([
        { quantity: new Prisma.Decimal(25) },
        { quantity: new Prisma.Decimal(-3) },
      ]);

      const dto: CreateInventoryTransactionDto = {
        branchId: mockBranchId1,
        productId: mockProductId,
        type: 'OUT',
        quantity: 3,
        referenceType: 'INVOICE',
      };

      const result = await service.recordTransaction(
        mockTenantId,
        [mockBranchId1],
        dto
      );

      expect(prisma.inventoryTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'OUT',
            quantity: new Prisma.Decimal(-3),
          }),
        })
      );
      expect((result as any).currentStock).toBe(22);
    });

    it('records Clinical / Grooming CONSUMPTION with negative quantity', async () => {
      prisma.inventoryTransaction.create.mockResolvedValue({
        id: 'tx-3',
        type: 'CONSUMPTION',
        quantity: new Prisma.Decimal(-1),
      });
      prisma.inventoryTransaction.findMany.mockResolvedValue([
        { quantity: new Prisma.Decimal(10) },
        { quantity: new Prisma.Decimal(-1) },
      ]);

      const dto: CreateInventoryTransactionDto = {
        branchId: mockBranchId1,
        productId: mockProductId,
        type: 'CONSUMPTION',
        quantity: 1,
        referenceType: 'GROOMING_USE',
      };

      const result = await service.recordTransaction(
        mockTenantId,
        [mockBranchId1],
        dto
      );

      expect(prisma.inventoryTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'CONSUMPTION',
            quantity: new Prisma.Decimal(-1),
          }),
        })
      );
      expect((result as any).currentStock).toBe(9);
    });

    it('executes paired Inter-branch TRANSFER atomically', async () => {
      prisma.branch.findFirst
        .mockResolvedValueOnce({ id: mockBranchId1, tenantId: mockTenantId })
        .mockResolvedValueOnce({ id: mockBranchId2, tenantId: mockTenantId });

      prisma.inventoryTransaction.create
        .mockResolvedValueOnce({ id: 'tx-src', type: 'TRANSFER', quantity: new Prisma.Decimal(-5) })
        .mockResolvedValueOnce({ id: 'tx-dest', type: 'TRANSFER', quantity: new Prisma.Decimal(5) });

      const dto: CreateInventoryTransactionDto = {
        branchId: mockBranchId1,
        productId: mockProductId,
        type: 'TRANSFER',
        quantity: 5,
        targetBranchId: mockBranchId2,
      };

      const result = await service.recordTransaction(
        mockTenantId,
        [mockBranchId1],
        dto
      );

      expect(prisma.inventoryTransaction.create).toHaveBeenCalledTimes(2);
      expect((result as any).transferredQuantity).toBe(5);
    });

    it('rejects transfer when targetBranchId is same as source branchId', async () => {
      const dto: CreateInventoryTransactionDto = {
        branchId: mockBranchId1,
        productId: mockProductId,
        type: 'TRANSFER',
        quantity: 5,
        targetBranchId: mockBranchId1,
      };

      await expect(
        service.recordTransaction(mockTenantId, [mockBranchId1], dto)
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException when branch is not in allowedBranches', async () => {
      const dto: CreateInventoryTransactionDto = {
        branchId: 'unauthorized-branch',
        productId: mockProductId,
        type: 'IN',
        quantity: 10,
      };

      await expect(
        service.recordTransaction(mockTenantId, [mockBranchId1], dto)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('adjustStock', () => {
    it('creates ADJUSTMENT transaction for physical discrepancy', async () => {
      prisma.branch.findFirst.mockResolvedValue({ id: mockBranchId1, tenantId: mockTenantId });
      prisma.product.findFirst.mockResolvedValue({ id: mockProductId, tenantId: mockTenantId });
      // Current theoretical stock is 20
      prisma.inventoryTransaction.findMany.mockResolvedValue([
        { quantity: new Prisma.Decimal(20) },
      ]);
      // Actual physical count is 25 -> delta +5
      prisma.inventoryTransaction.create.mockResolvedValue({
        id: 'tx-adj',
        type: 'ADJUSTMENT',
        quantity: new Prisma.Decimal(5),
      });

      const dto: StockTakeAdjustmentDto = {
        branchId: mockBranchId1,
        productId: mockProductId,
        actualCount: 25,
        notes: 'ตรวจนับสต็อกสิ้นเดือน',
      };

      const result = await service.adjustStock(
        mockTenantId,
        [mockBranchId1],
        dto
      );

      expect(prisma.inventoryTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'ADJUSTMENT',
            quantity: new Prisma.Decimal(5),
          }),
        })
      );
      expect(result.delta).toBe(5);
      expect(result.previousStock).toBe(20);
    });

    it('returns zero delta when stock is already reconciled', async () => {
      prisma.branch.findFirst.mockResolvedValue({ id: mockBranchId1, tenantId: mockTenantId });
      prisma.product.findFirst.mockResolvedValue({ id: mockProductId, tenantId: mockTenantId });
      prisma.inventoryTransaction.findMany.mockResolvedValue([
        { quantity: new Prisma.Decimal(20) },
      ]);

      const dto: StockTakeAdjustmentDto = {
        branchId: mockBranchId1,
        productId: mockProductId,
        actualCount: 20,
      };

      const result = await service.adjustStock(
        mockTenantId,
        [mockBranchId1],
        dto
      );

      expect(prisma.inventoryTransaction.create).not.toHaveBeenCalled();
      expect(result.delta).toBe(0);
    });
  });

  describe('getBranchStockList', () => {
    it('computes stock statuses (IN_STOCK, LOW_STOCK, OUT_OF_STOCK)', async () => {
      prisma.product.findMany.mockResolvedValue([
        { id: 'p1', name: 'แชมพู A', reorderPoint: 5 },
        { id: 'p2', name: 'ยา B', reorderPoint: 10 },
        { id: 'p3', name: 'วัคซีน C', reorderPoint: 5 },
      ]);
      prisma.inventoryTransaction.findMany.mockResolvedValue([
        { productId: 'p1', quantity: new Prisma.Decimal(20) }, // 20 > 5 -> IN_STOCK
        { productId: 'p2', quantity: new Prisma.Decimal(3) },  // 3 <= 10 -> LOW_STOCK
        { productId: 'p3', quantity: new Prisma.Decimal(0) },  // 0 -> OUT_OF_STOCK
      ]);

      const result = await service.getBranchStockList(
        mockTenantId,
        [mockBranchId1],
        mockBranchId1
      );

      expect(result[0].stockStatus).toBe('IN_STOCK');
      expect(result[1].stockStatus).toBe('LOW_STOCK');
      expect(result[2].stockStatus).toBe('OUT_OF_STOCK');
    });
  });

  describe('findTransactions', () => {
    it('returns paginated transaction log', async () => {
      prisma.inventoryTransaction.findMany.mockResolvedValue([
        { id: 'tx-1', type: 'IN', quantity: new Prisma.Decimal(10) },
      ]);
      prisma.inventoryTransaction.count.mockResolvedValue(1);

      const result = await service.findTransactions(
        mockTenantId,
        [mockBranchId1],
        { page: 1, limit: 20 }
      );

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });
});
