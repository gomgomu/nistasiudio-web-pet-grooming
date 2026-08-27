import { Test, TestingModule } from '@nestjs/testing';
import { InventoryAlertsService } from './inventory-alerts.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreateProductLotDto } from './dto/create-lot.dto';
import { Prisma } from '@prisma/client';

describe('InventoryAlertsService (PF-042)', () => {
  let service: InventoryAlertsService;
  let prisma: any;

  const mockTenantId = 'tenant-uuid-1';
  const mockBranchId = 'branch-uuid-1';
  const mockProductId1 = 'prod-1';
  const mockProductId2 = 'prod-2';
  const mockProductId3 = 'prod-3';

  beforeEach(async () => {
    prisma = {
      branch: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      product: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      productLot: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      inventoryTransaction: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryAlertsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<InventoryAlertsService>(InventoryAlertsService);
  });

  describe('getLowStockAlerts', () => {
    beforeEach(() => {
      prisma.branch.findMany.mockResolvedValue([
        { id: mockBranchId, name: 'สาขาทองหล่อ' },
      ]);
      prisma.product.findMany.mockResolvedValue([
        {
          id: mockProductId1,
          sku: 'DOG-SHMP',
          name: 'แชมพูสุนัข',
          category: 'GROOMING_SUPPLY',
          unit: 'ขวด',
          reorderPoint: 10,
        },
        {
          id: mockProductId2,
          sku: 'MED-RABIES',
          name: 'วัคซีนพิษสุนัขบ้า',
          category: 'VACCINE',
          unit: 'โดส',
          reorderPoint: 10,
        },
        {
          id: mockProductId3,
          sku: 'TREAT-BEEF',
          name: 'ขนมสุนัข',
          category: 'PETSHOP',
          unit: 'ถุง',
          reorderPoint: 10,
        },
      ]);
    });

    it('ranks and categorizes OUT_OF_STOCK, CRITICAL_LOW, and LOW_STOCK with reorder quantities', async () => {
      prisma.inventoryTransaction.findMany.mockResolvedValue([
        { branchId: mockBranchId, productId: mockProductId1, quantity: new Prisma.Decimal(0) }, // OUT_OF_STOCK
        { branchId: mockBranchId, productId: mockProductId2, quantity: new Prisma.Decimal(3) }, // CRITICAL_LOW (<= 5)
        { branchId: mockBranchId, productId: mockProductId3, quantity: new Prisma.Decimal(8) }, // LOW_STOCK (<= 10)
      ]);

      const alerts = await service.getLowStockAlerts(
        mockTenantId,
        [mockBranchId],
        {}
      );

      expect(alerts).toHaveLength(3);
      expect(alerts[0].severity).toBe('OUT_OF_STOCK');
      expect(alerts[0].deficit).toBe(10);
      expect(alerts[0].suggestedReorderQuantity).toBe(20);

      expect(alerts[1].severity).toBe('CRITICAL_LOW');
      expect(alerts[1].deficit).toBe(7);

      expect(alerts[2].severity).toBe('LOW_STOCK');
      expect(alerts[2].deficit).toBe(2);
    });

    it('filters only critical alerts when criticalOnly is true', async () => {
      prisma.inventoryTransaction.findMany.mockResolvedValue([
        { branchId: mockBranchId, productId: mockProductId1, quantity: new Prisma.Decimal(0) },
        { branchId: mockBranchId, productId: mockProductId2, quantity: new Prisma.Decimal(3) },
        { branchId: mockBranchId, productId: mockProductId3, quantity: new Prisma.Decimal(8) },
      ]);

      const alerts = await service.getLowStockAlerts(
        mockTenantId,
        [mockBranchId],
        { criticalOnly: true }
      );

      expect(alerts).toHaveLength(2); // OUT_OF_STOCK & CRITICAL_LOW only
      expect(alerts.map((a) => a.severity)).not.toContain('LOW_STOCK');
    });

    it('throws ForbiddenException if requested branch is not in allowedBranches', async () => {
      await expect(
        service.getLowStockAlerts(mockTenantId, [mockBranchId], {
          branchId: 'unauthorized-branch',
        })
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getExpiryAlerts', () => {
    it('stratifies lots into EXPIRED, EXPIRING_CRITICAL, and EXPIRING_WARNING', async () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
      const criticalDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // in 7 days
      const warningDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // in 30 days

      prisma.productLot.findMany.mockResolvedValue([
        {
          id: 'lot-1',
          productId: mockProductId1,
          lotNumber: 'LOT-EXP-01',
          expDate: pastDate,
          currentQuantity: new Prisma.Decimal(5),
          product: { sku: 'MED-1', name: 'ยา A', unit: 'แผง', isPrescriptionOnly: true },
          branch: { id: mockBranchId, name: 'สาขาทองหล่อ' },
        },
        {
          id: 'lot-2',
          productId: mockProductId2,
          lotNumber: 'LOT-CRIT-02',
          expDate: criticalDate,
          currentQuantity: new Prisma.Decimal(10),
          product: { sku: 'VAC-1', name: 'วัคซีน B', unit: 'โดส', isPrescriptionOnly: true },
          branch: { id: mockBranchId, name: 'สาขาทองหล่อ' },
        },
        {
          id: 'lot-3',
          productId: mockProductId3,
          lotNumber: 'LOT-WARN-03',
          expDate: warningDate,
          currentQuantity: new Prisma.Decimal(20),
          product: { sku: 'SHMP-1', name: 'แชมพู C', unit: 'ขวด', isPrescriptionOnly: false },
          branch: { id: mockBranchId, name: 'สาขาทองหล่อ' },
        },
      ]);

      const alerts = await service.getExpiryAlerts(
        mockTenantId,
        [mockBranchId],
        { daysAhead: 60 }
      );

      expect(alerts).toHaveLength(3);
      expect(alerts[0].severity).toBe('EXPIRED');
      expect(alerts[0].daysRemaining).toBeLessThan(0);

      expect(alerts[1].severity).toBe('EXPIRING_CRITICAL');
      expect(alerts[1].daysRemaining).toBeLessThanOrEqual(15);

      expect(alerts[2].severity).toBe('EXPIRING_WARNING');
      expect(alerts[2].daysRemaining).toBeGreaterThan(15);
    });
  });

  describe('getDashboardAlertsSummary', () => {
    it('aggregates stock and expiry alert metrics for KPI banners', async () => {
      prisma.branch.findMany.mockResolvedValue([
        { id: mockBranchId, name: 'สาขาทองหล่อ' },
      ]);
      prisma.product.findMany.mockResolvedValue([
        { id: 'p1', reorderPoint: 5 },
      ]);
      prisma.inventoryTransaction.findMany.mockResolvedValue([
        { branchId: mockBranchId, productId: 'p1', quantity: new Prisma.Decimal(0) }, // 1 OUT_OF_STOCK
      ]);
      prisma.productLot.findMany.mockResolvedValue([
        {
          id: 'lot-1',
          expDate: new Date(Date.now() - 86400000), // EXPIRED
          currentQuantity: new Prisma.Decimal(5),
          product: { sku: 'MED-1', name: 'ยา', unit: 'กล่อง', isPrescriptionOnly: false },
          branch: { id: mockBranchId, name: 'สาขา' },
        },
      ]);

      const summary = await service.getDashboardAlertsSummary(
        mockTenantId,
        [mockBranchId]
      );

      expect(summary.outOfStockCount).toBe(1);
      expect(summary.expiredLotsCount).toBe(1);
      expect(summary.totalAlerts).toBe(2);
    });
  });

  describe('createLot', () => {
    it('creates product lot and automatically records an incoming stock transaction', async () => {
      prisma.branch.findFirst.mockResolvedValue({ id: mockBranchId, tenantId: mockTenantId });
      prisma.product.findFirst.mockResolvedValue({ id: mockProductId1, tenantId: mockTenantId });

      prisma.productLot.create.mockResolvedValue({
        id: 'lot-new-1',
        lotNumber: 'BATCH-2026-X',
        expDate: new Date('2027-12-31'),
        initialQuantity: new Prisma.Decimal(50),
        currentQuantity: new Prisma.Decimal(50),
      });

      prisma.inventoryTransaction.create.mockResolvedValue({
        id: 'tx-lot-1',
        type: 'IN',
        quantity: new Prisma.Decimal(50),
      });

      const dto: CreateProductLotDto = {
        branchId: mockBranchId,
        productId: mockProductId1,
        lotNumber: 'BATCH-2026-X',
        expDate: '2027-12-31',
        quantity: 50,
      };

      const result = await service.createLot(
        mockTenantId,
        [mockBranchId],
        dto
      );

      expect(prisma.productLot.create).toHaveBeenCalled();
      expect(prisma.inventoryTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'IN',
            quantity: new Prisma.Decimal(50),
          }),
        })
      );
      expect(result.lot.id).toBe('lot-new-1');
    });

    it('throws NotFoundException when product does not exist', async () => {
      prisma.branch.findFirst.mockResolvedValue({ id: mockBranchId, tenantId: mockTenantId });
      prisma.product.findFirst.mockResolvedValue(null);

      const dto: CreateProductLotDto = {
        branchId: mockBranchId,
        productId: 'non-existent',
        lotNumber: 'BATCH-2026-X',
        expDate: '2027-12-31',
        quantity: 50,
      };

      await expect(
        service.createLot(mockTenantId, [mockBranchId], dto)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findLots', () => {
    it('returns paginated lots with computed daysRemaining and isExpired', async () => {
      const now = new Date();
      prisma.productLot.findMany.mockResolvedValue([
        {
          id: 'lot-1',
          lotNumber: 'LOT-A',
          expDate: new Date(now.getTime() + 10 * 86400000),
          product: { sku: 'SKU-1', name: 'Product 1' },
          branch: { id: mockBranchId, name: 'Main' },
        },
      ]);
      prisma.productLot.count.mockResolvedValue(1);

      const result = await service.findLots(
        mockTenantId,
        [mockBranchId],
        { page: 1, limit: 20 }
      );

      expect(result.data).toHaveLength(1);
      expect(result.data[0].daysRemaining).toBe(10);
      expect(result.data[0].isExpired).toBe(false);
    });
  });
});
