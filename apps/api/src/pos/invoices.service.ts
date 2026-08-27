import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto, VoidInvoiceDto } from './dto/update-invoice.dto';
import { QueryInvoicesDto } from './dto/query-invoice.dto';
import { calculateInvoice } from './invoice-calculator';
import { Prisma } from '@prisma/client';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a monthly sequential invoice number per tenant (e.g. INV-202608-0001)
   */
  private async generateInvoiceNumber(
    prismaClient: Prisma.TransactionClient | PrismaService,
    tenantId: string,
    issuedAt: Date = new Date()
  ): Promise<string> {
    const yearMonth = issuedAt.toISOString().slice(0, 7).replace('-', '');
    const prefix = `INV-${yearMonth}-`;

    const lastInvoice = await prismaClient.invoice.findFirst({
      where: {
        tenantId,
        invoiceNo: {
          startsWith: prefix,
        },
      },
      orderBy: {
        invoiceNo: 'desc',
      },
      select: {
        invoiceNo: true,
      },
    });

    let nextSeq = 1;
    if (lastInvoice && lastInvoice.invoiceNo) {
      const parts = lastInvoice.invoiceNo.split('-');
      if (parts.length >= 3) {
        const lastSeqNum = parseInt(parts[2], 10);
        if (!isNaN(lastSeqNum)) {
          nextSeq = lastSeqNum + 1;
        }
      }
    }

    return `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }

  /**
   * Creates a new Invoice with line items and financial calculation
   */
  async create(tenantId: string, userId: string, dto: CreateInvoiceDto) {
    // 1. Verify branch exists & belongs to tenant
    const branch = await this.prisma.branch.findFirst({
      where: { id: dto.branchId, tenantId },
    });
    if (!branch) {
      throw new NotFoundException('Branch not found or does not belong to this tenant');
    }

    // 2. Verify customer exists & belongs to tenant
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, tenantId },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found or does not belong to this tenant');
    }

    // 3. Verify pet if provided
    if (dto.petId) {
      const pet = await this.prisma.pet.findFirst({
        where: { id: dto.petId, tenantId },
      });
      if (!pet) {
        throw new NotFoundException('Pet not found or does not belong to this tenant');
      }
    }

    // 4. Calculate financials using InvoiceCalculationEngine
    const calculation = calculateInvoice(dto.items, {
      invoiceDiscountMinor: dto.discountMinor,
      invoiceDiscountPercentage: dto.discountPercentage,
    });

    const issuedAt = dto.issuedAt ? new Date(dto.issuedAt) : new Date();

    // 5. Execute in database transaction
    return this.prisma.$transaction(async (tx) => {
      const invoiceNo = await this.generateInvoiceNumber(tx, tenantId, issuedAt);

      const invoice = await tx.invoice.create({
        data: {
          tenantId,
          branchId: dto.branchId,
          customerId: dto.customerId,
          petId: dto.petId,
          appointmentId: dto.appointmentId,
          queueItemId: dto.queueItemId,
          clinicVisitId: dto.clinicVisitId,
          invoiceNo,
          status: dto.status || 'UNPAID',
          subtotalMinor: calculation.subtotalMinor,
          discountMinor: calculation.totalDiscountMinor,
          taxMinor: calculation.taxMinor,
          totalMinor: calculation.totalMinor,
          paidAmountMinor: 0n,
          notes: dto.notes,
          issuedById: userId,
          issuedAt,
          items: {
            create: calculation.items.map((item) => ({
              description: item.description || 'รายการบริการ/สินค้า',
              itemType: item.itemType || 'SERVICE',
              quantity: new Prisma.Decimal(item.quantity),
              unitPriceMinor: item.unitPriceMinor,
              discountMinor: item.discountMinor,
              taxRate: new Prisma.Decimal(item.taxRate),
              totalMinor: item.totalMinor,
            })),
          },
        },
        include: {
          items: true,
          customer: {
            select: { id: true, firstName: true, lastName: true, phone: true, email: true },
          },
          pet: {
            select: { id: true, name: true, species: true, breed: true },
          },
          branch: {
            select: { id: true, name: true, code: true },
          },
        },
      });

      return invoice;
    });
  }

  /**
   * Retrieves a paginated list of invoices with multi-tenant and branch filtering
   */
  async findAll(tenantId: string, allowedBranches: string[], query: QueryInvoicesDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.InvoiceWhereInput = {
      tenantId,
      branchId: query.branchId
        ? query.branchId
        : allowedBranches.length > 0
          ? { in: allowedBranches }
          : undefined,
    };

    if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.petId) {
      where.petId = query.petId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.startDate || query.endDate) {
      where.issuedAt = {};
      if (query.startDate) {
        where.issuedAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        where.issuedAt.lte = end;
      }
    }

    if (query.search) {
      const s = query.search.trim();
      where.OR = [
        { invoiceNo: { contains: s, mode: 'insensitive' } },
        { customer: { firstName: { contains: s, mode: 'insensitive' } } },
        { customer: { lastName: { contains: s, mode: 'insensitive' } } },
        { customer: { phone: { contains: s, mode: 'insensitive' } } },
        { pet: { name: { contains: s, mode: 'insensitive' } } },
      ];
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { issuedAt: 'desc' },
        include: {
          customer: {
            select: { id: true, firstName: true, lastName: true, phone: true },
          },
          pet: {
            select: { id: true, name: true, species: true, breed: true },
          },
          branch: {
            select: { id: true, name: true, code: true },
          },
          items: true,
          payments: true,
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data: invoices,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves a single invoice by ID with comprehensive relationships
   */
  async findOne(tenantId: string, allowedBranches: string[], id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id,
        tenantId,
        branchId: allowedBranches.length > 0 ? { in: allowedBranches } : undefined,
      },
      include: {
        customer: true,
        pet: true,
        branch: true,
        items: {
          include: {
            service: true,
            product: true,
            staff: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
        payments: {
          include: {
            recordedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
          orderBy: { paidAt: 'desc' },
        },
        appointment: true,
        queueItem: true,
        clinicVisit: true,
        issuedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  /**
   * Updates an invoice (Only permitted for non-PAID and non-VOID invoices)
   */
  async update(
    tenantId: string,
    allowedBranches: string[],
    id: string,
    dto: UpdateInvoiceDto
  ) {
    const existing = await this.prisma.invoice.findFirst({
      where: {
        id,
        tenantId,
        branchId: allowedBranches.length > 0 ? { in: allowedBranches } : undefined,
      },
      include: {
        items: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Invoice not found');
    }

    if (existing.status === 'PAID') {
      throw new BadRequestException('Cannot modify a paid invoice. Use void or adjustment workflow.');
    }

    if (existing.status === 'VOID') {
      throw new BadRequestException('Cannot modify a voided invoice.');
    }

    // If items or discount updated, recalculate
    if (dto.items && dto.items.length > 0) {
      const calculation = calculateInvoice(dto.items, {
        invoiceDiscountMinor: dto.discountMinor,
        invoiceDiscountPercentage: dto.discountPercentage,
      });

      return this.prisma.$transaction(async (tx) => {
        // Delete previous items
        await tx.invoiceItem.deleteMany({
          where: { invoiceId: id },
        });

        // Update invoice and re-create items
        const updated = await tx.invoice.update({
          where: { id },
          data: {
            customerId: dto.customerId ?? existing.customerId,
            petId: dto.petId !== undefined ? dto.petId : existing.petId,
            notes: dto.notes !== undefined ? dto.notes : existing.notes,
            subtotalMinor: calculation.subtotalMinor,
            discountMinor: calculation.totalDiscountMinor,
            taxMinor: calculation.taxMinor,
            totalMinor: calculation.totalMinor,
            items: {
              create: calculation.items.map((item) => ({
                description: item.description || 'รายการบริการ/สินค้า',
                itemType: item.itemType || 'SERVICE',
                quantity: new Prisma.Decimal(item.quantity),
                unitPriceMinor: item.unitPriceMinor,
                discountMinor: item.discountMinor,
                taxRate: new Prisma.Decimal(item.taxRate),
                totalMinor: item.totalMinor,
              })),
            },
          },
          include: {
            items: true,
            customer: true,
            pet: true,
          },
        });

        return updated;
      });
    }

    // Update only metadata
    return this.prisma.invoice.update({
      where: { id },
      data: {
        customerId: dto.customerId,
        petId: dto.petId,
        notes: dto.notes,
      },
      include: {
        items: true,
        customer: true,
        pet: true,
      },
    });
  }

  /**
   * Voids an invoice with mandatory audit reason
   */
  async void(
    tenantId: string,
    allowedBranches: string[],
    id: string,
    _userId: string,
    dto: VoidInvoiceDto
  ) {
    const existing = await this.prisma.invoice.findFirst({
      where: {
        id,
        tenantId,
        branchId: allowedBranches.length > 0 ? { in: allowedBranches } : undefined,
      },
    });

    if (!existing) {
      throw new NotFoundException('Invoice not found');
    }

    if (existing.status === 'VOID') {
      throw new BadRequestException('Invoice is already voided');
    }

    return this.prisma.invoice.update({
      where: { id },
      data: {
        status: 'VOID',
        voidedAt: new Date(),
        voidReason: dto.reason,
      },
      include: {
        items: true,
        customer: true,
        pet: true,
      },
    });
  }

  /**
   * Deletes a draft invoice
   */
  async delete(tenantId: string, allowedBranches: string[], id: string) {
    const existing = await this.prisma.invoice.findFirst({
      where: {
        id,
        tenantId,
        branchId: allowedBranches.length > 0 ? { in: allowedBranches } : undefined,
      },
      include: {
        payments: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Invoice not found');
    }

    if (existing.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT invoices can be deleted');
    }

    if (existing.payments.length > 0) {
      throw new BadRequestException('Cannot delete invoice with recorded payments');
    }

    await this.prisma.invoice.delete({
      where: { id },
    });

    return { message: 'Invoice deleted successfully' };
  }
}
