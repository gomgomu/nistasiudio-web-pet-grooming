import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateProductLotDto,
  QueryProductLotsDto,
  QueryStockAlertsDto,
} from './dto/create-lot.dto';
import {
  LowStockAlert,
  ExpiryAlert,
  StockAlertSummary,
  StockAlertSeverity,
  ExpiryAlertSeverity,
} from '@petflow/types';
import { Prisma } from '@prisma/client';

@Injectable()
export class InventoryAlertsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Identifies products below minimum reorder points with urgency ranking and reorder recommendations
   */
  async getLowStockAlerts(
    tenantId: string,
    allowedBranches: string[],
    query: QueryStockAlertsDto
  ): Promise<LowStockAlert[]> {
    if (query.branchId && allowedBranches.length > 0 && !allowedBranches.includes(query.branchId)) {
      throw new ForbiddenException('You do not have access to this branch');
    }

    const branchWhere: Prisma.BranchWhereInput = {
      tenantId,
      id: query.branchId
        ? query.branchId
        : allowedBranches.length > 0
          ? { in: allowedBranches }
          : undefined,
      isActive: true,
    };

    const branches = await this.prisma.branch.findMany({
      where: branchWhere,
      select: { id: true, name: true },
    });

    const branchIds = branches.map((b) => b.id);
    const branchNameMap = new Map(branches.map((b) => [b.id, b.name]));

    const [products, transactions] = await Promise.all([
      this.prisma.product.findMany({
        where: { tenantId, isActive: true },
        include: { productCategory: true },
      }),
      this.prisma.inventoryTransaction.findMany({
        where: {
          tenantId,
          branchId: { in: branchIds },
        },
        select: {
          branchId: true,
          productId: true,
          quantity: true,
        },
      }),
    ]);

    // Aggregate stock by branchId_productId
    const stockMap = new Map<string, number>();
    for (const tx of transactions) {
      const key = `${tx.branchId}_${tx.productId}`;
      const current = stockMap.get(key) || 0;
      stockMap.set(key, current + Number(tx.quantity));
    }

    const alerts: LowStockAlert[] = [];

    for (const branchId of branchIds) {
      for (const prod of products) {
        const key = `${branchId}_${prod.id}`;
        const currentStock = Math.round((stockMap.get(key) || 0) * 100) / 100;

        if (currentStock <= prod.reorderPoint) {
          let severity: StockAlertSeverity = 'LOW_STOCK';
          if (currentStock <= 0) {
            severity = 'OUT_OF_STOCK';
          } else if (currentStock <= prod.reorderPoint / 2) {
            severity = 'CRITICAL_LOW';
          }

          if (query.criticalOnly && severity === 'LOW_STOCK') {
            continue;
          }

          const deficit = Math.max(0, prod.reorderPoint - currentStock);
          const suggestedReorderQuantity = Math.max(
            prod.reorderPoint * 2 - currentStock,
            prod.reorderPoint
          );

          alerts.push({
            productId: prod.id,
            sku: prod.sku,
            barcode: prod.barcode || undefined,
            name: prod.name,
            category: prod.category,
            unit: prod.unit,
            currentStock,
            reorderPoint: prod.reorderPoint,
            deficit,
            suggestedReorderQuantity,
            severity,
            branchId,
            branchName: branchNameMap.get(branchId),
          });
        }
      }
    }

    // Sort by severity: OUT_OF_STOCK first, then CRITICAL_LOW, then LOW_STOCK
    const severityWeight: Record<StockAlertSeverity, number> = {
      OUT_OF_STOCK: 1,
      CRITICAL_LOW: 2,
      LOW_STOCK: 3,
      HEALTHY: 4,
    };

    return alerts.sort((a, b) => severityWeight[a.severity] - severityWeight[b.severity]);
  }

  /**
   * Tracks expiring and expired drug/vaccine lots with risk stratification
   */
  async getExpiryAlerts(
    tenantId: string,
    allowedBranches: string[],
    query: QueryStockAlertsDto
  ): Promise<ExpiryAlert[]> {
    if (query.branchId && allowedBranches.length > 0 && !allowedBranches.includes(query.branchId)) {
      throw new ForbiddenException('You do not have access to this branch');
    }

    const daysAhead = Number(query.daysAhead) || 60;
    const now = new Date();
    const thresholdDate = new Date(now);
    thresholdDate.setDate(thresholdDate.getDate() + daysAhead);

    const lots = await this.prisma.productLot.findMany({
      where: {
        tenantId,
        branchId: query.branchId
          ? query.branchId
          : allowedBranches.length > 0
            ? { in: allowedBranches }
            : undefined,
        currentQuantity: { gt: 0 },
        expDate: { lte: thresholdDate },
      },
      include: {
        product: true,
        branch: { select: { id: true, name: true } },
      },
      orderBy: { expDate: 'asc' },
    });

    const alerts: ExpiryAlert[] = [];

    for (const lot of lots) {
      const expTime = new Date(lot.expDate).getTime();
      const diffMs = expTime - now.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let severity: ExpiryAlertSeverity = 'EXPIRING_WARNING';
      if (daysRemaining < 0) {
        severity = 'EXPIRED';
      } else if (daysRemaining <= 15) {
        severity = 'EXPIRING_CRITICAL';
      } else if (daysRemaining <= 60) {
        severity = 'EXPIRING_WARNING';
      } else {
        severity = 'VALID';
      }

      if (query.criticalOnly && (severity === 'EXPIRING_WARNING' || severity === 'VALID')) {
        continue;
      }

      alerts.push({
        lotId: lot.id,
        productId: lot.productId,
        sku: lot.product.sku,
        productName: lot.product.name,
        lotNumber: lot.lotNumber,
        expDate: lot.expDate.toISOString(),
        daysRemaining,
        currentQuantity: Number(lot.currentQuantity),
        unit: lot.product.unit,
        isPrescriptionOnly: lot.product.isPrescriptionOnly,
        severity,
        branchId: lot.branchId,
        branchName: lot.branch.name,
      });
    }

    return alerts;
  }

  /**
   * Aggregates a comprehensive KPI alert summary for dashboards
   */
  async getDashboardAlertsSummary(
    tenantId: string,
    allowedBranches: string[],
    branchId?: string
  ): Promise<StockAlertSummary> {
    const [lowStockAlerts, expiryAlerts] = await Promise.all([
      this.getLowStockAlerts(tenantId, allowedBranches, { branchId }),
      this.getExpiryAlerts(tenantId, allowedBranches, { branchId, daysAhead: 60 }),
    ]);

    const outOfStockCount = lowStockAlerts.filter((a) => a.severity === 'OUT_OF_STOCK').length;
    const criticalLowStockCount = lowStockAlerts.filter((a) => a.severity === 'CRITICAL_LOW').length;
    const lowStockCount = lowStockAlerts.filter((a) => a.severity === 'LOW_STOCK').length;

    const expiredLotsCount = expiryAlerts.filter((e) => e.severity === 'EXPIRED').length;
    const expiringSoonLotsCount = expiryAlerts.filter(
      (e) => e.severity === 'EXPIRING_CRITICAL' || e.severity === 'EXPIRING_WARNING'
    ).length;

    return {
      outOfStockCount,
      criticalLowStockCount,
      lowStockCount,
      expiredLotsCount,
      expiringSoonLotsCount,
      totalAlerts:
        outOfStockCount +
        criticalLowStockCount +
        lowStockCount +
        expiredLotsCount +
        expiringSoonLotsCount,
    };
  }

  /**
   * Registers a new product lot and automatically records an incoming stock ledger entry
   */
  async createLot(
    tenantId: string,
    allowedBranches: string[],
    dto: CreateProductLotDto
  ) {
    if (allowedBranches.length > 0 && !allowedBranches.includes(dto.branchId)) {
      throw new ForbiddenException('You do not have access to this branch');
    }

    const [branch, product] = await Promise.all([
      this.prisma.branch.findFirst({ where: { id: dto.branchId, tenantId } }),
      this.prisma.product.findFirst({ where: { id: dto.productId, tenantId } }),
    ]);

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const qty = Math.abs(dto.quantity);

    return this.prisma.$transaction(async (tx) => {
      // 1. Create ProductLot
      const lot = await tx.productLot.create({
        data: {
          tenantId,
          branchId: dto.branchId,
          productId: dto.productId,
          lotNumber: dto.lotNumber.trim(),
          mfgDate: dto.mfgDate ? new Date(dto.mfgDate) : null,
          expDate: new Date(dto.expDate),
          initialQuantity: new Prisma.Decimal(qty),
          currentQuantity: new Prisma.Decimal(qty),
          notes: dto.notes || null,
        },
        include: {
          product: true,
          branch: { select: { id: true, name: true, code: true } },
        },
      });

      // 2. Create corresponding IN transaction in immutable ledger
      const transaction = await tx.inventoryTransaction.create({
        data: {
          tenantId,
          branchId: dto.branchId,
          productId: dto.productId,
          type: 'IN',
          quantity: new Prisma.Decimal(qty),
          referenceType: `LOT_REGISTRATION: ${dto.lotNumber.trim()}`,
          referenceId: lot.id,
        },
      });

      return {
        lot,
        transaction,
      };
    });
  }

  /**
   * Queries product lots with pagination and expiry tracking
   */
  async findLots(
    tenantId: string,
    allowedBranches: string[],
    query: QueryProductLotsDto
  ) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ProductLotWhereInput = {
      tenantId,
      branchId: query.branchId
        ? query.branchId
        : allowedBranches.length > 0
          ? { in: allowedBranches }
          : undefined,
    };

    if (query.productId) {
      where.productId = query.productId;
    }

    const now = new Date();

    if (query.isExpired) {
      where.expDate = { lt: now };
    } else if (query.expiringWithinDays) {
      const threshold = new Date(now);
      threshold.setDate(threshold.getDate() + Number(query.expiringWithinDays));
      where.expDate = { lte: threshold, gte: now };
    }

    const [data, total] = await Promise.all([
      this.prisma.productLot.findMany({
        where,
        skip,
        take: limit,
        orderBy: { expDate: 'asc' },
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              barcode: true,
              name: true,
              unit: true,
              category: true,
              isPrescriptionOnly: true,
            },
          },
          branch: {
            select: { id: true, name: true, code: true },
          },
        },
      }),
      this.prisma.productLot.count({ where }),
    ]);

    return {
      data: data.map((lot) => {
        const diffMs = new Date(lot.expDate).getTime() - now.getTime();
        const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return {
          ...lot,
          daysRemaining,
          isExpired: daysRemaining < 0,
        };
      }),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
