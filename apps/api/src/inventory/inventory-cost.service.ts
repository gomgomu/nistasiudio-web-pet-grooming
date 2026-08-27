import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  QueryInventoryValuationDto,
  QueryProfitabilityDto,
} from './dto/cost-calculation.dto';
import {
  ProductCostSummary,
  InventoryValuationItem,
  InventoryValuationReport,
  ProductProfitabilityItem,
} from '@petflow/types';
import { Prisma } from '@prisma/client';

@Injectable()
export class InventoryCostService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Computes the Moving Weighted Average Cost (MAC) for a product based on historical supplier purchases
   */
  async calculateProductMovingAverageCost(
    tenantId: string,
    productId: string
  ): Promise<number> {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId },
      select: { costMinor: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const defaultCostMinor = Number(product.costMinor);

    const purchaseItems = await this.prisma.purchaseItem.findMany({
      where: {
        productId,
        purchase: { tenantId, status: 'COMPLETED' },
      },
      orderBy: { purchase: { purchasedAt: 'asc' } },
      select: {
        quantity: true,
        unitCostMinor: true,
      },
    });

    if (purchaseItems.length === 0) {
      return defaultCostMinor;
    }

    let runningQty = 0;
    let runningCostMinor = defaultCostMinor;

    for (const item of purchaseItems) {
      const itemQty = Number(item.quantity);
      const itemCost = Number(item.unitCostMinor);

      if (runningQty <= 0) {
        runningQty = itemQty;
        runningCostMinor = itemCost;
      } else {
        const totalValue = runningQty * runningCostMinor + itemQty * itemCost;
        runningQty += itemQty;
        runningCostMinor = Math.round(totalValue / runningQty);
      }
    }

    return runningCostMinor;
  }

  /**
   * Retrieves a comprehensive cost, margin, and stock valuation breakdown for a single product
   */
  async getProductCostSummary(
    tenantId: string,
    allowedBranches: string[],
    productId: string
  ): Promise<ProductCostSummary> {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId },
      include: { productCategory: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const [movingAverageCostMinor, latestPurchaseItem, transactions] =
      await Promise.all([
        this.calculateProductMovingAverageCost(tenantId, productId),
        this.prisma.purchaseItem.findFirst({
          where: { productId, purchase: { tenantId } },
          orderBy: { purchase: { purchasedAt: 'desc' } },
          select: { unitCostMinor: true },
        }),
        this.prisma.inventoryTransaction.findMany({
          where: {
            tenantId,
            productId,
            branchId:
              allowedBranches.length > 0 ? { in: allowedBranches } : undefined,
          },
          select: { quantity: true },
        }),
      ]);

    const totalStockQuantity = Math.max(
      0,
      Math.round(
        transactions.reduce((acc, tx) => acc + Number(tx.quantity), 0) * 100
      ) / 100
    );

    const masterCostMinor = Number(product.costMinor);
    const latestPurchaseCostMinor = latestPurchaseItem
      ? Number(latestPurchaseItem.unitCostMinor)
      : masterCostMinor;
    const salePriceMinor = Number(product.salePriceMinor);

    const unitGrossProfitMinor = salePriceMinor - movingAverageCostMinor;
    const grossMarginPercent =
      salePriceMinor > 0
        ? Math.round(((unitGrossProfitMinor / salePriceMinor) * 100) * 100) / 100
        : 0;

    const totalValuationMinor = Math.round(
      totalStockQuantity * movingAverageCostMinor
    );

    return {
      productId: product.id,
      sku: product.sku,
      name: product.name,
      unit: product.unit,
      category: product.category,
      masterCostMinor,
      movingAverageCostMinor,
      latestPurchaseCostMinor,
      salePriceMinor,
      unitGrossProfitMinor,
      grossMarginPercent,
      totalStockQuantity,
      totalValuationMinor,
    };
  }

  /**
   * Generates a complete inventory asset valuation report with weighted average costing
   */
  async getInventoryValuationReport(
    tenantId: string,
    allowedBranches: string[],
    query: QueryInventoryValuationDto
  ): Promise<InventoryValuationReport> {
    if (
      query.branchId &&
      allowedBranches.length > 0 &&
      !allowedBranches.includes(query.branchId)
    ) {
      throw new ForbiddenException('You do not have access to this branch');
    }

    const costingMethod = query.costingMethod || 'MOVING_AVERAGE';

    const productWhere: Prisma.ProductWhereInput = {
      tenantId,
      isActive: true,
      categoryId: query.categoryId || undefined,
    };

    const [products, transactions, purchaseItems] = await Promise.all([
      this.prisma.product.findMany({
        where: productWhere,
        include: { productCategory: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.inventoryTransaction.findMany({
        where: {
          tenantId,
          branchId: query.branchId
            ? query.branchId
            : allowedBranches.length > 0
              ? { in: allowedBranches }
              : undefined,
        },
        select: { productId: true, quantity: true },
      }),
      this.prisma.purchaseItem.findMany({
        where: { purchase: { tenantId, status: 'COMPLETED' } },
        orderBy: { purchase: { purchasedAt: 'asc' } },
        select: { productId: true, quantity: true, unitCostMinor: true },
      }),
    ]);

    // Aggregate stock by productId
    const stockMap = new Map<string, number>();
    for (const tx of transactions) {
      const current = stockMap.get(tx.productId) || 0;
      stockMap.set(tx.productId, current + Number(tx.quantity));
    }

    // Pre-calculate MAC map
    const macMap = new Map<string, number>();
    const latestCostMap = new Map<string, number>();

    const purchaseByProduct = new Map<
      string,
      Array<{ quantity: number; unitCostMinor: number }>
    >();
    for (const pi of purchaseItems) {
      const list = purchaseByProduct.get(pi.productId) || [];
      list.push({
        quantity: Number(pi.quantity),
        unitCostMinor: Number(pi.unitCostMinor),
      });
      purchaseByProduct.set(pi.productId, list);
    }

    for (const prod of products) {
      const purchases = purchaseByProduct.get(prod.id) || [];
      const masterCost = Number(prod.costMinor);

      if (purchases.length === 0) {
        macMap.set(prod.id, masterCost);
        latestCostMap.set(prod.id, masterCost);
      } else {
        let runningQty = 0;
        let runningCost = masterCost;

        for (const p of purchases) {
          if (runningQty <= 0) {
            runningQty = p.quantity;
            runningCost = p.unitCostMinor;
          } else {
            runningCost = Math.round(
              (runningQty * runningCost + p.quantity * p.unitCostMinor) /
                (runningQty + p.quantity)
            );
            runningQty += p.quantity;
          }
        }

        macMap.set(prod.id, runningCost);
        latestCostMap.set(
          prod.id,
          purchases[purchases.length - 1].unitCostMinor
        );
      }
    }

    const items: InventoryValuationItem[] = [];
    let totalStockQuantity = 0;
    let totalValuationMinor = 0;
    let totalPotentialRevenueMinor = 0;
    let totalPotentialGrossProfitMinor = 0;

    for (const prod of products) {
      const currentStock = Math.max(
        0,
        Math.round((stockMap.get(prod.id) || 0) * 100) / 100
      );

      let unitCostMinor: number;
      if (costingMethod === 'LATEST_COST') {
        unitCostMinor = latestCostMap.get(prod.id) || Number(prod.costMinor);
      } else if (costingMethod === 'MASTER_COST') {
        unitCostMinor = Number(prod.costMinor);
      } else {
        unitCostMinor = macMap.get(prod.id) || Number(prod.costMinor);
      }

      const salePriceMinor = Number(prod.salePriceMinor);
      const itemValuationMinor = Math.round(currentStock * unitCostMinor);
      const potentialRevenueMinor = Math.round(currentStock * salePriceMinor);
      const potentialProfitMinor = Math.max(
        0,
        potentialRevenueMinor - itemValuationMinor
      );
      const grossMarginPercent =
        potentialRevenueMinor > 0
          ? Math.round(
              ((potentialProfitMinor / potentialRevenueMinor) * 100) * 100
            ) / 100
          : 0;

      items.push({
        productId: prod.id,
        sku: prod.sku,
        barcode: prod.barcode || undefined,
        name: prod.name,
        category: prod.category,
        unit: prod.unit,
        currentStock,
        unitCostMinor,
        salePriceMinor,
        totalValuationMinor: itemValuationMinor,
        potentialRevenueMinor,
        potentialProfitMinor,
        grossMarginPercent,
        costingMethod,
      });

      totalStockQuantity += currentStock;
      totalValuationMinor += itemValuationMinor;
      totalPotentialRevenueMinor += potentialRevenueMinor;
      totalPotentialGrossProfitMinor += potentialProfitMinor;
    }

    const overallGrossMarginPercent =
      totalPotentialRevenueMinor > 0
        ? Math.round(
            ((totalPotentialGrossProfitMinor / totalPotentialRevenueMinor) *
              100) *
              100
          ) / 100
        : 0;

    return {
      items,
      summary: {
        totalProductCount: products.length,
        totalStockQuantity: Math.round(totalStockQuantity * 100) / 100,
        totalValuationMinor,
        totalPotentialRevenueMinor,
        totalPotentialGrossProfitMinor,
        overallGrossMarginPercent,
        costingMethod,
      },
    };
  }

  /**
   * Generates product profitability analysis comparing sales revenue vs cost of goods sold (COGS)
   */
  async getProductProfitabilityReport(
    tenantId: string,
    allowedBranches: string[],
    query: QueryProfitabilityDto
  ): Promise<ProductProfitabilityItem[]> {
    if (
      query.branchId &&
      allowedBranches.length > 0 &&
      !allowedBranches.includes(query.branchId)
    ) {
      throw new ForbiddenException('You do not have access to this branch');
    }

    const invoiceWhere: Prisma.InvoiceWhereInput = {
      tenantId,
      branchId: query.branchId
        ? query.branchId
        : allowedBranches.length > 0
          ? { in: allowedBranches }
          : undefined,
      status: { in: ['PAID', 'PARTIALLY_PAID'] },
    };

    if (query.startDate || query.endDate) {
      invoiceWhere.createdAt = {};
      if (query.startDate) {
        invoiceWhere.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        invoiceWhere.createdAt.lte = end;
      }
    }

    const invoiceItems = await this.prisma.invoiceItem.findMany({
      where: {
        invoice: invoiceWhere,
        productId: { not: null },
      },
      include: {
        product: true,
      },
    });

    const profitMap = new Map<
      string,
      {
        product: any;
        unitsSold: number;
        totalRevenueMinor: number;
      }
    >();

    for (const item of invoiceItems) {
      if (!item.productId || !item.product) continue;
      const current = profitMap.get(item.productId) || {
        product: item.product,
        unitsSold: 0,
        totalRevenueMinor: 0,
      };

      current.unitsSold += Number(item.quantity);
      current.totalRevenueMinor += Number(item.totalMinor);
      profitMap.set(item.productId, current);
    }

    const results: ProductProfitabilityItem[] = [];

    for (const [productId, data] of profitMap.entries()) {
      const macCostMinor = await this.calculateProductMovingAverageCost(
        tenantId,
        productId
      );
      const totalCogsMinor = Math.round(data.unitsSold * macCostMinor);
      const grossProfitMinor = data.totalRevenueMinor - totalCogsMinor;
      const grossMarginPercent =
        data.totalRevenueMinor > 0
          ? Math.round(
              ((grossProfitMinor / data.totalRevenueMinor) * 100) * 100
            ) / 100
          : 0;

      results.push({
        productId,
        sku: data.product.sku,
        name: data.product.name,
        category: data.product.category,
        unit: data.product.unit,
        unitsSold: Math.round(data.unitsSold * 100) / 100,
        totalRevenueMinor: data.totalRevenueMinor,
        totalCogsMinor,
        grossProfitMinor,
        grossMarginPercent,
      });
    }

    return results.sort((a, b) => b.grossProfitMinor - a.grossProfitMinor);
  }
}
