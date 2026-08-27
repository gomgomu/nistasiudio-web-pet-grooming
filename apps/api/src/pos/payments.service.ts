import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecordPaymentDto, QueryPaymentsDto } from './dto/record-payment.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records a payment transaction against an invoice, calculates change for cash,
   * and updates invoice balance and status to PARTIALLY_PAID or PAID.
   */
  async recordPayment(
    tenantId: string,
    allowedBranches: string[],
    invoiceId: string,
    userId: string,
    dto: RecordPaymentDto
  ) {
    // 1. Verify invoice exists & belongs to tenant & allowed branches
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        tenantId,
        branchId: allowedBranches.length > 0 ? { in: allowedBranches } : undefined,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status === 'VOID') {
      throw new BadRequestException('Cannot record payment for a voided invoice');
    }

    if (invoice.status === 'PAID') {
      throw new BadRequestException('Invoice is already fully paid');
    }

    if (invoice.status === 'DRAFT') {
      throw new BadRequestException(
        'Cannot record payment for a draft invoice. Please issue the invoice first.'
      );
    }

    const paymentAmount = BigInt(dto.amountMinor);
    const remainingMinor = invoice.totalMinor - invoice.paidAmountMinor;

    if (paymentAmount > remainingMinor) {
      throw new BadRequestException(
        `Payment amount (${(Number(paymentAmount) / 100).toFixed(
          2
        )} THB) exceeds remaining balance (${(Number(remainingMinor) / 100).toFixed(2)} THB)`
      );
    }

    // 2. Calculate cash change if tender provided
    let changeMinor: bigint | null = null;
    let receivedAmountMinor: bigint | null = null;

    if (dto.method === 'CASH' && dto.receivedAmountMinor !== undefined && dto.receivedAmountMinor !== null) {
      receivedAmountMinor = BigInt(dto.receivedAmountMinor);
      if (receivedAmountMinor < paymentAmount) {
        throw new BadRequestException(
          'Received amount (cash tendered) cannot be less than payment amount'
        );
      }
      changeMinor = receivedAmountMinor - paymentAmount;
    }

    const paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();

    // 3. Execute payment and invoice status transition in a transaction
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          tenantId,
          branchId: invoice.branchId,
          invoiceId,
          method: dto.method,
          amountMinor: paymentAmount,
          receivedAmountMinor,
          changeMinor,
          reference: dto.reference,
          notes: dto.notes,
          recordedById: userId,
          paidAt,
        },
        include: {
          recordedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      const newPaidAmountMinor = invoice.paidAmountMinor + paymentAmount;
      const isFullyPaid = newPaidAmountMinor >= invoice.totalMinor;
      const newStatus = isFullyPaid ? 'PAID' : 'PARTIALLY_PAID';

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmountMinor: newPaidAmountMinor,
          status: newStatus,
          paidAt: isFullyPaid ? paidAt : invoice.paidAt,
        },
        include: {
          customer: {
            select: { id: true, firstName: true, lastName: true, phone: true },
          },
          pet: {
            select: { id: true, name: true, species: true, breed: true },
          },
        },
      });

      return {
        payment,
        invoice: updatedInvoice,
      };
    });
  }

  /**
   * Retrieves all payments recorded for a specific invoice
   */
  async findInvoicePayments(
    tenantId: string,
    allowedBranches: string[],
    invoiceId: string
  ) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        tenantId,
        branchId: allowedBranches.length > 0 ? { in: allowedBranches } : undefined,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return this.prisma.payment.findMany({
      where: { invoiceId, tenantId },
      orderBy: { paidAt: 'desc' },
      include: {
        recordedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  /**
   * Retrieves a paginated list of all payments with branch, method, and date filters
   */
  async findAllPayments(
    tenantId: string,
    allowedBranches: string[],
    query: QueryPaymentsDto
  ) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {
      tenantId,
      branchId: query.branchId
        ? query.branchId
        : allowedBranches.length > 0
          ? { in: allowedBranches }
          : undefined,
    };

    if (query.method) {
      where.method = query.method;
    }

    if (query.startDate || query.endDate) {
      where.paidAt = {};
      if (query.startDate) {
        where.paidAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        where.paidAt.lte = end;
      }
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { paidAt: 'desc' },
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNo: true,
              totalMinor: true,
              status: true,
              customer: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
          },
          branch: {
            select: { id: true, name: true, code: true },
          },
          recordedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data: payments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Voids/reverses a payment and updates the invoice balance and status
   */
  async voidPayment(
    tenantId: string,
    allowedBranches: string[],
    paymentId: string
  ) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        tenantId,
        branchId: allowedBranches.length > 0 ? { in: allowedBranches } : undefined,
      },
      include: {
        invoice: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Delete payment record
      await tx.payment.delete({
        where: { id: paymentId },
      });

      // 2. Decrement invoice paid amount
      const newPaidAmount = payment.invoice.paidAmountMinor - payment.amountMinor;
      const safePaidAmount = newPaidAmount > 0n ? newPaidAmount : 0n;
      const newStatus = safePaidAmount === 0n ? 'UNPAID' : 'PARTIALLY_PAID';

      const updatedInvoice = await tx.invoice.update({
        where: { id: payment.invoiceId },
        data: {
          paidAmountMinor: safePaidAmount,
          status: newStatus,
          paidAt: null,
        },
      });

      return {
        message: 'Payment reversed successfully',
        invoice: updatedInvoice,
      };
    });
  }
}
