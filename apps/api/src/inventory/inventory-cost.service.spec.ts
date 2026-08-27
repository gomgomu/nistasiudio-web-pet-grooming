import { Test, TestingModule } from '@nestjs/testing';
import { InventoryCostService } from './inventory-cost.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('InventoryCostService (PF-043)', () => {
  let service: InventoryCostService;
  let prisma: any;

  const mockTenantId = 'tenant-uuid-1';
  const mockBranchId = 'branch-uuid-1';
  const mockProductId = 'product-uuid-1';

  beforeEach(async () => {
    prisma = {
      product: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      purchaseItem: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      inventoryTransaction: {
        findMany: jest.fn(),
      },
      invoiceItem: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryCostService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<InventoryCostService>(InventoryCostService);
  });

  describe('calculateProductMovingAverageCost', () => {
    it('returns catalog master cost when no purchase items exist', async () => {
      prisma.product.findFirst.mockResolvedValue({
        costMinor: BigInt(15000), // 150.00 THB
      });
      prisma.purchaseItem.findMany.mockResolvedValue([]);

      const mac = await service.calculateProductMovingAverageCost(
        mockTenantId,
        mockProductId
      );

      expect(mac).toBe(15000);
    });

    it('calculates weighted average cost across multiple purchase batches', async () => {
      prisma.product.findFirst.mockResolvedValue({
        costMinor: BigInt(10000),
      });

      // Batch 1: 10 units @ 10,000 satang (100 THB) -> Val = 100,000
      // Batch 2: 10 units @ 20,000 satang (200 THB) -> Val = 200,000
      // Total: 20 units -> 300,000 / 20 = 15,000 satang (150 THB)
      prisma.purchaseItem.findMany.mockResolvedValue([
        { quantity: new Prisma.Decimal(10), unitCostMinor: BigInt(10000) },
        { quantity: new Prisma.Decimal(10), unitCostMinor: BigInt(20000) },
      ]);

      const mac = await service.calculateProductMovingAverageCost(
        mockTenantId,
        mockProductId
      );

      expect(mac).toBe(15000);
    });

    it('throws NotFoundException when product does not exist', async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      await expect(
        service.calculateProductMovingAverageCost(mockTenantId, 'unknown')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getProductCostSummary', () => {
    it('computes unit gross margin, margin percent, and total stock valuation', async () => {
      prisma.product.findFirst.mockResolvedValue({
        id: mockProductId,
        sku: 'DOG-SHMP-300',
        name: 'แชมพูสุนัข',
        unit: 'ขวด',
        category: 'GROOMING_SUPPLY',
        costMinor: BigInt(10000),
        salePriceMinor: BigInt(25000), // 250.00 THB
      });

      prisma.purchaseItem.findMany.mockResolvedValue([
        { quantity: new Prisma.Decimal(10), unitCostMinor: BigInt(10000) },
      ]);
      prisma.purchaseItem.findFirst.mockResolvedValue({
        unitCostMinor: BigInt(10000),
      });

      prisma.inventoryTransaction.findMany.mockResolvedValue([
        { quantity: new Prisma.Decimal(20) }, // 20 units in stock
      ]);

      const summary = await service.getProductCostSummary(
        mockTenantId,
        [mockBranchId],
        mockProductId
      );

      expect(summary.movingAverageCostMinor).toBe(10000); // 100.00 THB
      expect(summary.salePriceMinor).toBe(25000); // 250.00 THB
      expect(summary.unitGrossProfitMinor).toBe(15000); // 150.00 THB
      expect(summary.grossMarginPercent).toBe(60); // (150/250)*100 = 60%
      expect(summary.totalStockQuantity).toBe(20);
      expect(summary.totalValuationMinor).toBe(200000); // 20 * 10,000 = 200,000 satang (2,000 THB)
    });
  });

  describe('getInventoryValuationReport', () => {
    it('aggregates portfolio valuation and calculates overall gross margin', async () => {
      prisma.product.findMany.mockResolvedValue([
        {
          id: 'p1',
          sku: 'SKU-1',
          name: 'Item 1',
          category: 'PETSHOP',
          unit: 'ชิ้น',
          costMinor: BigInt(10000),
          salePriceMinor: BigInt(20000),
        },
      ]);

      prisma.inventoryTransaction.findMany.mockResolvedValue([
        { productId: 'p1', quantity: new Prisma.Decimal(10) },
      ]);

      prisma.purchaseItem.findMany.mockResolvedValue([]);

      const report = await service.getInventoryValuationReport(
        mockTenantId,
        [mockBranchId],
        { costingMethod: 'MOVING_AVERAGE' }
      );

      expect(report.items).toHaveLength(1);
      expect(report.summary.totalProductCount).toBe(1);
      expect(report.summary.totalStockQuantity).toBe(10);
      expect(report.summary.totalValuationMinor).toBe(100000); // 10 * 10,000 = 100,000
      expect(report.summary.totalPotentialRevenueMinor).toBe(200000); // 10 * 20,000 = 200,000
      expect(report.summary.totalPotentialGrossProfitMinor).toBe(100000);
      expect(report.summary.overallGrossMarginPercent).toBe(50);
    });

    it('throws ForbiddenException when requested branch is not in allowedBranches', async () => {
      await expect(
        service.getInventoryValuationReport(
          mockTenantId,
          [mockBranchId],
          { branchId: 'unauthorized-branch' }
        )
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getProductProfitabilityReport', () => {
    it('analyzes realized sales revenue, COGS, and realized gross profit', async () => {
      prisma.invoiceItem.findMany.mockResolvedValue([
        {
          productId: mockProductId,
          quantity: new Prisma.Decimal(5),
          totalMinor: BigInt(125000), // 5 * 250 THB = 1,250 THB (125,000 satang)
          product: {
            sku: 'SKU-PROFIT',
            name: 'Profit Item',
            category: 'PETSHOP',
            unit: 'ชิ้น',
            costMinor: BigInt(10000), // 100 THB
          },
        },
      ]);

      prisma.product.findFirst.mockResolvedValue({
        costMinor: BigInt(10000),
      });
      prisma.purchaseItem.findMany.mockResolvedValue([]);

      const report = await service.getProductProfitabilityReport(
        mockTenantId,
        [mockBranchId],
        {}
      );

      expect(report).toHaveLength(1);
      expect(report[0].unitsSold).toBe(5);
      expect(report[0].totalRevenueMinor).toBe(125000);
      expect(report[0].totalCogsMinor).toBe(50000); // 5 * 10,000 = 50,000
      expect(report[0].grossProfitMinor).toBe(75000); // 125,000 - 50,000 = 75,000
      expect(report[0].grossMarginPercent).toBe(60); // 75,000 / 125,000 = 60%
    });
  });
});
