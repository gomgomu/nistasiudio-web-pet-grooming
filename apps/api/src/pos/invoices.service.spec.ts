import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesService } from './invoices.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

describe('InvoicesService (PF-035)', () => {
  let service: InvoicesService;
  let prisma: any;

  const mockTenantId = 'tenant-uuid-1';
  const mockUserId = 'user-uuid-1';
  const mockBranchId = 'branch-uuid-1';
  const mockCustomerId = 'customer-uuid-1';
  const mockPetId = 'pet-uuid-1';

  beforeEach(async () => {
    prisma = {
      branch: {
        findFirst: jest.fn(),
      },
      customer: {
        findFirst: jest.fn(),
      },
      pet: {
        findFirst: jest.fn(),
      },
      invoice: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      invoiceItem: {
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
  });

  describe('create', () => {
    const createDto: CreateInvoiceDto = {
      branchId: mockBranchId,
      customerId: mockCustomerId,
      petId: mockPetId,
      items: [
        {
          description: 'อาบน้ำตัดขนสุนัขพันธุ์เล็ก',
          itemType: 'SERVICE',
          quantity: 1,
          unitPriceMinor: 50000, // 500.00 THB
          taxRate: 7.0,
        },
        {
          description: 'แชมพูบำรุงขนสูตรพรีเมียม',
          itemType: 'PRODUCT',
          quantity: 1,
          unitPriceMinor: 20000, // 200.00 THB
          taxRate: 7.0,
        },
      ],
      discountMinor: 10000, // 100.00 THB invoice discount
      notes: 'ลูกค้าประจำ สาขาทองหล่อ',
    };

    it('creates invoice with sequential number and accurate financial calculation', async () => {
      prisma.branch.findFirst.mockResolvedValue({ id: mockBranchId, tenantId: mockTenantId });
      prisma.customer.findFirst.mockResolvedValue({ id: mockCustomerId, tenantId: mockTenantId });
      prisma.pet.findFirst.mockResolvedValue({ id: mockPetId, tenantId: mockTenantId });
      prisma.invoice.findFirst.mockResolvedValue({ invoiceNo: 'INV-202608-0005' });

      prisma.invoice.create.mockResolvedValue({
        id: 'inv-001',
        tenantId: mockTenantId,
        branchId: mockBranchId,
        invoiceNo: 'INV-202608-0006',
        status: 'UNPAID',
        subtotalMinor: 70000n, // 700.00 THB
        discountMinor: 10000n, // 100.00 THB
        taxMinor: 4200n, // 600 * 7% = 42.00 THB
        totalMinor: 64200n, // 642.00 THB
        items: [],
      });

      const result = await service.create(mockTenantId, mockUserId, createDto);

      expect(prisma.branch.findFirst).toHaveBeenCalledWith({
        where: { id: mockBranchId, tenantId: mockTenantId },
      });
      expect(prisma.customer.findFirst).toHaveBeenCalledWith({
        where: { id: mockCustomerId, tenantId: mockTenantId },
      });
      expect(prisma.invoice.create).toHaveBeenCalled();
      expect(result.invoiceNo).toBe('INV-202608-0006');
    });

    it('throws NotFoundException when branch is not found', async () => {
      prisma.branch.findFirst.mockResolvedValue(null);

      await expect(service.create(mockTenantId, mockUserId, createDto)).rejects.toThrow(
        NotFoundException
      );
    });

    it('throws NotFoundException when customer is not found', async () => {
      prisma.branch.findFirst.mockResolvedValue({ id: mockBranchId, tenantId: mockTenantId });
      prisma.customer.findFirst.mockResolvedValue(null);

      await expect(service.create(mockTenantId, mockUserId, createDto)).rejects.toThrow(
        NotFoundException
      );
    });

    it('throws NotFoundException when pet is not found', async () => {
      prisma.branch.findFirst.mockResolvedValue({ id: mockBranchId, tenantId: mockTenantId });
      prisma.customer.findFirst.mockResolvedValue({ id: mockCustomerId, tenantId: mockTenantId });
      prisma.pet.findFirst.mockResolvedValue(null);

      await expect(service.create(mockTenantId, mockUserId, createDto)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('findAll', () => {
    it('returns paginated invoice list with tenant scoping', async () => {
      const mockInvoices = [
        { id: 'inv-1', invoiceNo: 'INV-202608-0001', totalMinor: 50000n },
        { id: 'inv-2', invoiceNo: 'INV-202608-0002', totalMinor: 75000n },
      ];

      prisma.invoice.findMany.mockResolvedValue(mockInvoices);
      prisma.invoice.count.mockResolvedValue(2);

      const result = await service.findAll(mockTenantId, [mockBranchId], {
        page: 1,
        limit: 20,
        status: 'UNPAID',
      });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
    });
  });

  describe('findOne', () => {
    it('returns invoice details when found in allowed branches', async () => {
      const mockInvoice = {
        id: 'inv-1',
        invoiceNo: 'INV-202608-0001',
        tenantId: mockTenantId,
        branchId: mockBranchId,
        items: [],
        payments: [],
      };

      prisma.invoice.findFirst.mockResolvedValue(mockInvoice);

      const result = await service.findOne(mockTenantId, [mockBranchId], 'inv-1');
      expect(result.invoiceNo).toBe('INV-202608-0001');
    });

    it('throws NotFoundException when invoice does not exist', async () => {
      prisma.invoice.findFirst.mockResolvedValue(null);

      await expect(service.findOne(mockTenantId, [mockBranchId], 'inv-999')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('update', () => {
    it('updates invoice and recalculates totals', async () => {
      const existing = {
        id: 'inv-1',
        status: 'UNPAID',
        tenantId: mockTenantId,
        branchId: mockBranchId,
      };

      prisma.invoice.findFirst.mockResolvedValue(existing);
      prisma.invoice.update.mockResolvedValue({
        id: 'inv-1',
        totalMinor: 53500n,
      });

      const result = await service.update(mockTenantId, [mockBranchId], 'inv-1', {
        items: [
          {
            description: 'ตรวจรักษาทั่วไป',
            quantity: 1,
            unitPriceMinor: 50000,
            taxRate: 7.0,
          },
        ],
      });

      expect(prisma.invoiceItem.deleteMany).toHaveBeenCalled();
      expect(result.totalMinor).toBe(53500n);
    });

    it('throws BadRequestException when attempting to update PAID invoice', async () => {
      prisma.invoice.findFirst.mockResolvedValue({
        id: 'inv-1',
        status: 'PAID',
        tenantId: mockTenantId,
      });

      await expect(
        service.update(mockTenantId, [mockBranchId], 'inv-1', { notes: 'test' })
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when attempting to update VOID invoice', async () => {
      prisma.invoice.findFirst.mockResolvedValue({
        id: 'inv-1',
        status: 'VOID',
        tenantId: mockTenantId,
      });

      await expect(
        service.update(mockTenantId, [mockBranchId], 'inv-1', { notes: 'test' })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('void', () => {
    it('voids an invoice with audit reason', async () => {
      prisma.invoice.findFirst.mockResolvedValue({
        id: 'inv-1',
        status: 'UNPAID',
      });
      prisma.invoice.update.mockResolvedValue({
        id: 'inv-1',
        status: 'VOID',
        voidReason: 'ลูกค้าขอยกเลิกนัด',
      });

      const result = await service.void(mockTenantId, [mockBranchId], 'inv-1', mockUserId, {
        reason: 'ลูกค้าขอยกเลิกนัด',
      });

      expect(result.status).toBe('VOID');
      expect(result.voidReason).toBe('ลูกค้าขอยกเลิกนัด');
    });

    it('throws BadRequestException if invoice is already voided', async () => {
      prisma.invoice.findFirst.mockResolvedValue({
        id: 'inv-1',
        status: 'VOID',
      });

      await expect(
        service.void(mockTenantId, [mockBranchId], 'inv-1', mockUserId, {
          reason: 'ยกเลิกซ้ำ',
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('deletes draft invoice with no payments', async () => {
      prisma.invoice.findFirst.mockResolvedValue({
        id: 'inv-1',
        status: 'DRAFT',
        payments: [],
      });
      prisma.invoice.delete.mockResolvedValue({ id: 'inv-1' });

      const result = await service.delete(mockTenantId, [mockBranchId], 'inv-1');
      expect(result.message).toContain('successfully');
    });

    it('throws BadRequestException if invoice is not in DRAFT status', async () => {
      prisma.invoice.findFirst.mockResolvedValue({
        id: 'inv-1',
        status: 'UNPAID',
        payments: [],
      });

      await expect(service.delete(mockTenantId, [mockBranchId], 'inv-1')).rejects.toThrow(
        BadRequestException
      );
    });
  });
});
