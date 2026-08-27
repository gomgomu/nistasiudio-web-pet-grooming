import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RecordPaymentDto } from './dto/record-payment.dto';

describe('PaymentsService (PF-036)', () => {
  let service: PaymentsService;
  let prisma: any;

  const mockTenantId = 'tenant-uuid-1';
  const mockUserId = 'user-uuid-1';
  const mockBranchId = 'branch-uuid-1';
  const mockInvoiceId = 'invoice-uuid-1';

  beforeEach(async () => {
    prisma = {
      invoice: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      payment: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  describe('recordPayment', () => {
    const mockInvoice = {
      id: mockInvoiceId,
      tenantId: mockTenantId,
      branchId: mockBranchId,
      invoiceNo: 'INV-202608-0001',
      status: 'UNPAID',
      totalMinor: 53500n, // 535.00 THB
      paidAmountMinor: 0n,
      paidAt: null,
    };

    it('records PromptPay payment in full and updates invoice status to PAID', async () => {
      prisma.invoice.findFirst.mockResolvedValue(mockInvoice);
      prisma.payment.create.mockResolvedValue({
        id: 'pay-001',
        method: 'PROMPTPAY',
        amountMinor: 53500n,
        reference: 'PP-20260825-99823',
      });
      prisma.invoice.update.mockResolvedValue({
        ...mockInvoice,
        status: 'PAID',
        paidAmountMinor: 53500n,
      });

      const dto: RecordPaymentDto = {
        method: 'PROMPTPAY',
        amountMinor: 53500,
        reference: 'PP-20260825-99823',
      };

      const result = await service.recordPayment(
        mockTenantId,
        [mockBranchId],
        mockInvoiceId,
        mockUserId,
        dto
      );

      expect(prisma.payment.create).toHaveBeenCalled();
      expect(prisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PAID',
            paidAmountMinor: 53500n,
          }),
        })
      );
      expect(result.payment.method).toBe('PROMPTPAY');
    });

    it('records CASH payment and calculates change correctly when customer tenders extra cash', async () => {
      prisma.invoice.findFirst.mockResolvedValue(mockInvoice);
      prisma.payment.create.mockResolvedValue({
        id: 'pay-002',
        method: 'CASH',
        amountMinor: 53500n,
        receivedAmountMinor: 100000n, // 1,000.00 THB tendered
        changeMinor: 46500n, // 465.00 THB change returned
      });
      prisma.invoice.update.mockResolvedValue({
        ...mockInvoice,
        status: 'PAID',
        paidAmountMinor: 53500n,
      });

      const dto: RecordPaymentDto = {
        method: 'CASH',
        amountMinor: 53500,
        receivedAmountMinor: 100000,
      };

      await service.recordPayment(
        mockTenantId,
        [mockBranchId],
        mockInvoiceId,
        mockUserId,
        dto
      );

      expect(prisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            method: 'CASH',
            amountMinor: 53500n,
            receivedAmountMinor: 100000n,
            changeMinor: 46500n,
          }),
        })
      );
    });

    it('throws BadRequestException if cash received amount is less than payment amount', async () => {
      prisma.invoice.findFirst.mockResolvedValue(mockInvoice);

      const dto: RecordPaymentDto = {
        method: 'CASH',
        amountMinor: 53500,
        receivedAmountMinor: 50000, // Less than required 535.00 THB
      };

      await expect(
        service.recordPayment(
          mockTenantId,
          [mockBranchId],
          mockInvoiceId,
          mockUserId,
          dto
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('handles Split Payments: transitions to PARTIALLY_PAID on partial payment', async () => {
      prisma.invoice.findFirst.mockResolvedValue(mockInvoice);
      prisma.payment.create.mockResolvedValue({
        id: 'pay-003',
        method: 'CASH',
        amountMinor: 30000n, // 300.00 THB partial
      });
      prisma.invoice.update.mockResolvedValue({
        ...mockInvoice,
        status: 'PARTIALLY_PAID',
        paidAmountMinor: 30000n,
      });

      const dto: RecordPaymentDto = {
        method: 'CASH',
        amountMinor: 30000,
      };

      const result = await service.recordPayment(
        mockTenantId,
        [mockBranchId],
        mockInvoiceId,
        mockUserId,
        dto
      );

      expect(prisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PARTIALLY_PAID',
            paidAmountMinor: 30000n,
          }),
        })
      );
      expect(result.invoice.status).toBe('PARTIALLY_PAID');
    });

    it('rejects overpayment exceeding invoice remaining balance', async () => {
      prisma.invoice.findFirst.mockResolvedValue(mockInvoice);

      const dto: RecordPaymentDto = {
        method: 'CREDIT_CARD',
        amountMinor: 60000, // Exceeds 535.00 THB total
      };

      await expect(
        service.recordPayment(
          mockTenantId,
          [mockBranchId],
          mockInvoiceId,
          mockUserId,
          dto
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects payment on already fully PAID invoice', async () => {
      prisma.invoice.findFirst.mockResolvedValue({
        ...mockInvoice,
        status: 'PAID',
        paidAmountMinor: 53500n,
      });

      const dto: RecordPaymentDto = {
        method: 'BANK_TRANSFER',
        amountMinor: 10000,
      };

      await expect(
        service.recordPayment(
          mockTenantId,
          [mockBranchId],
          mockInvoiceId,
          mockUserId,
          dto
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects payment on VOID invoice', async () => {
      prisma.invoice.findFirst.mockResolvedValue({
        ...mockInvoice,
        status: 'VOID',
      });

      const dto: RecordPaymentDto = {
        method: 'PROMPTPAY',
        amountMinor: 53500,
      };

      await expect(
        service.recordPayment(
          mockTenantId,
          [mockBranchId],
          mockInvoiceId,
          mockUserId,
          dto
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects payment on DRAFT invoice', async () => {
      prisma.invoice.findFirst.mockResolvedValue({
        ...mockInvoice,
        status: 'DRAFT',
      });

      const dto: RecordPaymentDto = {
        method: 'PROMPTPAY',
        amountMinor: 53500,
      };

      await expect(
        service.recordPayment(
          mockTenantId,
          [mockBranchId],
          mockInvoiceId,
          mockUserId,
          dto
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when invoice is not found', async () => {
      prisma.invoice.findFirst.mockResolvedValue(null);

      const dto: RecordPaymentDto = {
        method: 'CASH',
        amountMinor: 53500,
      };

      await expect(
        service.recordPayment(
          mockTenantId,
          [mockBranchId],
          'non-existent',
          mockUserId,
          dto
        )
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findInvoicePayments', () => {
    it('returns payment history for an invoice', async () => {
      prisma.invoice.findFirst.mockResolvedValue({ id: mockInvoiceId, tenantId: mockTenantId });
      prisma.payment.findMany.mockResolvedValue([
        { id: 'pay-1', method: 'CASH', amountMinor: 30000n },
        { id: 'pay-2', method: 'PROMPTPAY', amountMinor: 23500n },
      ]);

      const result = await service.findInvoicePayments(mockTenantId, [mockBranchId], mockInvoiceId);
      expect(result).toHaveLength(2);
    });

    it('throws NotFoundException if invoice not found', async () => {
      prisma.invoice.findFirst.mockResolvedValue(null);

      await expect(
        service.findInvoicePayments(mockTenantId, [mockBranchId], 'non-existent')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllPayments', () => {
    it('returns paginated payments list', async () => {
      prisma.payment.findMany.mockResolvedValue([
        { id: 'pay-1', method: 'PROMPTPAY', amountMinor: 50000n },
      ]);
      prisma.payment.count.mockResolvedValue(1);

      const result = await service.findAllPayments(mockTenantId, [mockBranchId], {
        page: 1,
        limit: 20,
        method: 'PROMPTPAY',
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('voidPayment', () => {
    it('reverses a payment and reverts invoice status to PARTIALLY_PAID or UNPAID', async () => {
      const mockPayment = {
        id: 'pay-1',
        invoiceId: mockInvoiceId,
        amountMinor: 53500n,
        tenantId: mockTenantId,
        branchId: mockBranchId,
        invoice: {
          id: mockInvoiceId,
          totalMinor: 53500n,
          paidAmountMinor: 53500n,
        },
      };

      prisma.payment.findFirst.mockResolvedValue(mockPayment);
      prisma.payment.delete.mockResolvedValue({ id: 'pay-1' });
      prisma.invoice.update.mockResolvedValue({
        id: mockInvoiceId,
        status: 'UNPAID',
        paidAmountMinor: 0n,
      });

      const result = await service.voidPayment(mockTenantId, [mockBranchId], 'pay-1');

      expect(prisma.payment.delete).toHaveBeenCalledWith({ where: { id: 'pay-1' } });
      expect(prisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            paidAmountMinor: 0n,
            status: 'UNPAID',
          }),
        })
      );
      expect(result.message).toContain('successfully');
    });

    it('throws NotFoundException if payment not found', async () => {
      prisma.payment.findFirst.mockResolvedValue(null);

      await expect(
        service.voidPayment(mockTenantId, [mockBranchId], 'non-existent')
      ).rejects.toThrow(NotFoundException);
    });
  });
});
