import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-product.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new product with SKU uniqueness validation within the tenant
   */
  async create(tenantId: string, dto: CreateProductDto) {
    const trimmedSku = dto.sku.trim();

    // 1. Verify SKU uniqueness in tenant
    const existing = await this.prisma.product.findUnique({
      where: {
        tenantId_sku: {
          tenantId,
          sku: trimmedSku,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Product with SKU '${trimmedSku}' already exists in this tenant`
      );
    }

    // 2. If categoryId provided, verify it belongs to tenant
    if (dto.categoryId) {
      const category = await this.prisma.productCategory.findFirst({
        where: { id: dto.categoryId, tenantId },
      });
      if (!category) {
        throw new NotFoundException('Product category not found');
      }
    }

    // 3. Create product record
    return this.prisma.product.create({
      data: {
        tenantId,
        sku: trimmedSku,
        barcode: dto.barcode?.trim() || null,
        name: dto.name.trim(),
        categoryId: dto.categoryId || null,
        category: dto.category || 'GENERAL',
        unit: dto.unit || 'ชิ้น',
        costMinor: dto.costMinor !== undefined ? BigInt(dto.costMinor) : 0n,
        salePriceMinor: BigInt(dto.salePriceMinor),
        taxRate: new Prisma.Decimal(dto.taxRate !== undefined ? dto.taxRate : 7.0),
        reorderPoint: dto.reorderPoint !== undefined ? dto.reorderPoint : 5,
        description: dto.description || null,
        isPrescriptionOnly: dto.isPrescriptionOnly ?? false,
        isActive: dto.isActive ?? true,
      },
      include: {
        productCategory: true,
      },
    });
  }

  /**
   * Retrieves a paginated list of products with category and search filtering
   */
  async findAll(tenantId: string, query: QueryProductsDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      tenantId,
    };

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.isPrescriptionOnly !== undefined) {
      where.isPrescriptionOnly = query.isPrescriptionOnly;
    }

    if (query.search) {
      const s = query.search.trim();
      where.OR = [
        { sku: { contains: s, mode: 'insensitive' } },
        { barcode: { contains: s, mode: 'insensitive' } },
        { name: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          productCategory: true,
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves a single product by ID
   */
  async findOne(tenantId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
      include: {
        productCategory: true,
        inventoryTransactions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            branch: {
              select: { id: true, name: true, code: true },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  /**
   * Updates an existing product
   */
  async update(tenantId: string, id: string, dto: UpdateProductDto) {
    // 1. Verify existence
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // 2. If SKU is being updated, verify uniqueness
    if (dto.sku && dto.sku.trim() !== product.sku) {
      const trimmedSku = dto.sku.trim();
      const existing = await this.prisma.product.findUnique({
        where: {
          tenantId_sku: {
            tenantId,
            sku: trimmedSku,
          },
        },
      });

      if (existing) {
        throw new ConflictException(
          `Product with SKU '${trimmedSku}' already exists in this tenant`
        );
      }
    }

    // 3. Update record
    return this.prisma.product.update({
      where: { id },
      data: {
        sku: dto.sku ? dto.sku.trim() : undefined,
        barcode: dto.barcode !== undefined ? dto.barcode?.trim() || null : undefined,
        name: dto.name ? dto.name.trim() : undefined,
        categoryId: dto.categoryId !== undefined ? dto.categoryId || null : undefined,
        category: dto.category || undefined,
        unit: dto.unit || undefined,
        costMinor: dto.costMinor !== undefined ? BigInt(dto.costMinor) : undefined,
        salePriceMinor:
          dto.salePriceMinor !== undefined ? BigInt(dto.salePriceMinor) : undefined,
        taxRate:
          dto.taxRate !== undefined ? new Prisma.Decimal(dto.taxRate) : undefined,
        reorderPoint: dto.reorderPoint !== undefined ? dto.reorderPoint : undefined,
        description:
          dto.description !== undefined ? dto.description || null : undefined,
        isPrescriptionOnly: dto.isPrescriptionOnly,
        isActive: dto.isActive,
      },
      include: {
        productCategory: true,
      },
    });
  }

  /**
   * Deletes a product or soft-deactivates it if historic transactions exist
   */
  async remove(tenantId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: {
            invoiceItems: true,
            inventoryTransactions: true,
            purchaseItems: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const hasDependencies =
      product._count.invoiceItems > 0 ||
      product._count.inventoryTransactions > 0 ||
      product._count.purchaseItems > 0;

    if (hasDependencies) {
      // Soft delete
      await this.prisma.product.update({
        where: { id },
        data: { isActive: false },
      });
      return {
        message: 'Product has transaction history; deactivated instead of deleted',
        deactivated: true,
      };
    }

    await this.prisma.product.delete({
      where: { id },
    });

    return {
      message: 'Product deleted successfully',
      deleted: true,
    };
  }
}
