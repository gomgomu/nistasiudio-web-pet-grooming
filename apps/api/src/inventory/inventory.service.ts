import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateInventoryTransactionDto,
  StockTakeAdjustmentDto,
  QueryInventoryTransactionsDto,
} from './dto/create-transaction.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records an immutable inventory transaction (Stock-In, Sales Out, Consumption, Waste, or Inter-branch Transfer)
   */
  async recordTransaction(
    tenantId: string,
    allowedBranches: string[],
    dto: CreateInventoryTransactionDto
  ) {
    // 1. Verify branch access
    if (allowedBranches.length > 0 && !allowedBranches.includes(dto.branchId)) {
      throw new ForbiddenException('You do not have access to this branch');
    }

    const branch = await this.prisma.branch.findFirst({
      where: { id: dto.branchId, tenantId },
    });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    // 2. Verify product exists and belongs to tenant
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, tenantId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // 3. Handle Inter-branch Transfer
    if (dto.type === 'TRANSFER') {
      if (!dto.targetBranchId) {
        throw new BadRequestException('Target branch ID is required for transfer');
      }
      if (dto.targetBranchId === dto.branchId) {
        throw new BadRequestException('Cannot transfer stock to the same branch');
      }

      const targetBranch = await this.prisma.branch.findFirst({
        where: { id: dto.targetBranchId, tenantId },
      });
      if (!targetBranch) {
        throw new NotFoundException('Target branch not found');
      }

      const qty = Math.abs(dto.quantity);

      return this.prisma.$transaction(async (tx) => {
        // Outgoing transaction from source branch
        const sourceTx = await tx.inventoryTransaction.create({
          data: {
            tenantId,
            branchId: dto.branchId,
            productId: dto.productId,
            type: 'TRANSFER',
            quantity: new Prisma.Decimal(-qty),
            referenceType: dto.referenceType || 'BRANCH_TRANSFER_OUT',
            referenceId: dto.referenceId || null,
          },
        });

        // Incoming transaction to destination branch
        const targetTx = await tx.inventoryTransaction.create({
          data: {
            tenantId,
            branchId: dto.targetBranchId!,
            productId: dto.productId,
            type: 'TRANSFER',
            quantity: new Prisma.Decimal(qty),
            referenceType: dto.referenceType || 'BRANCH_TRANSFER_IN',
            referenceId: dto.referenceId || null,
          },
        });

        return {
          sourceTransaction: sourceTx,
          targetTransaction: targetTx,
          transferredQuantity: qty,
        };
      });
    }

    // 4. Handle Standard Movement Types with signed quantity
    let signedQty: number;
    switch (dto.type) {
      case 'IN':
        signedQty = Math.abs(dto.quantity);
        break;
      case 'OUT':
      case 'CONSUMPTION':
      case 'WASTE':
        signedQty = -Math.abs(dto.quantity);
        break;
      case 'ADJUSTMENT':
        signedQty = dto.quantity;
        break;
      default:
        signedQty = dto.quantity;
    }

    const transaction = await this.prisma.inventoryTransaction.create({
      data: {
        tenantId,
        branchId: dto.branchId,
        productId: dto.productId,
        type: dto.type,
        quantity: new Prisma.Decimal(signedQty),
        referenceType: dto.referenceType || null,
        referenceId: dto.referenceId || null,
      },
      include: {
        product: true,
        branch: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    const newStock = await this.calculateBranchProductStock(
      tenantId,
      dto.branchId,
      dto.productId
    );

    return {
      transaction,
      currentStock: newStock,
    };
  }

  /**
   * Reconciles physical stock count against theoretical ledger by generating an immutable ADJUSTMENT record
   */
  async adjustStock(
    tenantId: string,
    allowedBranches: string[],
    dto: StockTakeAdjustmentDto
  ) {
    if (allowedBranches.length > 0 && !allowedBranches.includes(dto.branchId)) {
      throw new ForbiddenException('You do not have access to this branch');
    }

    const branch = await this.prisma.branch.findFirst({
      where: { id: dto.branchId, tenantId },
    });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, tenantId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const currentStock = await this.calculateBranchProductStock(
      tenantId,
      dto.branchId,
      dto.productId
    );

    const delta = dto.actualCount - currentStock;

    if (delta === 0) {
      return {
        message: 'Stock is already reconciled with actual count',
        previousStock: currentStock,
        actualCount: dto.actualCount,
        delta: 0,
      };
    }

    const transaction = await this.prisma.inventoryTransaction.create({
      data: {
        tenantId,
        branchId: dto.branchId,
        productId: dto.productId,
        type: 'ADJUSTMENT',
        quantity: new Prisma.Decimal(delta),
        referenceType: dto.notes ? `STOCK_TAKE: ${dto.notes}` : 'STOCK_TAKE',
      },
      include: {
        product: true,
        branch: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    return {
      message: 'Stock adjusted successfully',
      previousStock: currentStock,
      actualCount: dto.actualCount,
      delta,
      transaction,
    };
  }

  /**
   * Calculates the exact stock on hand for a single product at a specific branch via ledger summation
   */
  async calculateBranchProductStock(
    tenantId: string,
    branchId: string,
    productId: string
  ): Promise<number> {
    const transactions = await this.prisma.inventoryTransaction.findMany({
      where: { tenantId, branchId, productId },
      select: { quantity: true },
    });

    const total = transactions.reduce(
      (sum, tx) => sum + Number(tx.quantity),
      0
    );

    return Math.round(total * 100) / 100;
  }

  /**
   * Retrieves stock balances for all products in a given branch with low-stock status indicators
   */
  async getBranchStockList(
    tenantId: string,
    allowedBranches: string[],
    branchId: string,
    search?: string
  ) {
    if (allowedBranches.length > 0 && !allowedBranches.includes(branchId)) {
      throw new ForbiddenException('You do not have access to this branch');
    }

    const productWhere: Prisma.ProductWhereInput = {
      tenantId,
      isActive: true,
    };

    if (search) {
      const s = search.trim();
      productWhere.OR = [
        { sku: { contains: s, mode: 'insensitive' } },
        { barcode: { contains: s, mode: 'insensitive' } },
        { name: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [products, transactions] = await Promise.all([
      this.prisma.product.findMany({
        where: productWhere,
        include: { productCategory: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.inventoryTransaction.findMany({
        where: { tenantId, branchId },
        select: { productId: true, quantity: true },
      }),
    ]);

    // Map aggregate stock per product
    const stockMap = new Map<string, number>();
    for (const tx of transactions) {
      const current = stockMap.get(tx.productId) || 0;
      stockMap.set(tx.productId, current + Number(tx.quantity));
    }

    return products.map((prod) => {
      const currentStock = Math.round((stockMap.get(prod.id) || 0) * 100) / 100;
      let stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK';

      if (currentStock <= 0) {
        stockStatus = 'OUT_OF_STOCK';
      } else if (currentStock <= prod.reorderPoint) {
        stockStatus = 'LOW_STOCK';
      }

      return {
        ...prod,
        currentStock,
        stockStatus,
      };
    });
  }

  /**
   * Retrieves paginated inventory transaction log with filtering
   */
  async findTransactions(
    tenantId: string,
    allowedBranches: string[],
    query: QueryInventoryTransactionsDto
  ) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.InventoryTransactionWhereInput = {
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

    if (query.type) {
      where.type = query.type;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.inventoryTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              barcode: true,
              name: true,
              unit: true,
              category: true,
            },
          },
          branch: {
            select: { id: true, name: true, code: true },
          },
        },
      }),
      this.prisma.inventoryTransaction.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
