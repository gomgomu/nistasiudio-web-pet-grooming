import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';

describe('PrescriptionsService (Veterinary Prescriptions & Dispensing)', () => {
  let service: PrescriptionsService;
  let prisma: PrismaService;

  const mockTenantId = 't1111111-1111-4111-a111-111111111111';
  const otherTenantId = 't2222222-2222-4222-a222-222222222222';
  const mockVisitId = 'v1111111-1111-4111-a111-111111111111';
  const mockPrescriptionId = 'rx111111-1111-4111-a111-111111111111';
  const mockProductId = 'prod1111-1111-4111-a111-111111111111';
  const mockBranchId = 'b1111111-1111-4111-a111-111111111111';

  const mockVisit = {
    id: mockVisitId,
    tenantId: mockTenantId,
    branchId: mockBranchId,
    visitNumber: 'VN-2026-0089',
    customer: {
      firstName: 'คุณกนกวรรณ',
      lastName: 'ศรีสุข',
    },
    pet: {
      name: 'น้องโมจิ',
      species: 'DOG',
      breed: 'Pomeranian',
    },
    branch: {
      name: 'PetFlow สาขาทองหล่อ',
      phone: '02-123-4567',
      address: 'ทองหล่อ สุขุมวิท 55',
    },
    veterinarian: {
      firstName: 'น.สพ. วรปรัชญ์',
      lastName: 'เกียรติสกุล',
    },
  };

  const mockProduct = {
    id: mockProductId,
    tenantId: mockTenantId,
    sku: 'MED-DEX-01',
    name: 'Dexoryl Ear Drops 10g',
    salePriceMinor: BigInt(35000),
    costMinor: BigInt(22000),
  };

  const mockPrescription = {
    id: mockPrescriptionId,
    tenantId: mockTenantId,
    clinicVisitId: mockVisitId,
    productId: mockProductId,
    medicationName: 'Dexoryl Ear Drops',
    genericName: 'Gentamicin + Thiabendazole + Dexamethasone',
    dosageForm: 'DROPS',
    strength: '10 g/bottle',
    dosagePerKg: 12.5,
    calculatedDose: '5 drops / ear',
    route: 'EAR (หยอดหูขวา)',
    frequency: 'BID (วันละ 2 ครั้ง เช้า-เย็น)',
    duration: '7 วัน',
    quantity: 1,
    unit: 'ขวด',
    instruction: 'หยอดหูข้างขวาครั้งละ 5 หยด เช้า-เย็น หลังทำความสะอาดหู',
    cautionNotes: 'เก็บในอุณหภูมิห้อง ไม่เกิน 30°C เขย่าขวดก่อนใช้',
    priceMinor: BigInt(35000),
    isDispensed: false,
    dispensedAt: null,
    dispensedById: null,
    createdAt: new Date('2026-08-27T10:20:00Z'),
    product: mockProduct,
    dispensedBy: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrescriptionsService,
        {
          provide: PrismaService,
          useValue: {
            clinicVisit: {
              findFirst: jest.fn().mockImplementation((args) => {
                if (args.where.id === mockVisitId && args.where.tenantId === mockTenantId) {
                  return Promise.resolve(mockVisit);
                }
                return Promise.resolve(null);
              }),
            },
            product: {
              findFirst: jest.fn().mockImplementation((args) => {
                if (args.where.id === mockProductId && args.where.tenantId === mockTenantId) {
                  return Promise.resolve(mockProduct);
                }
                return Promise.resolve(null);
              }),
            },
            prescription: {
              findMany: jest.fn().mockImplementation((args) => {
                if (args.where.clinicVisitId === mockVisitId && args.where.tenantId === mockTenantId) {
                  return Promise.resolve([mockPrescription]);
                }
                return Promise.resolve([]);
              }),
              findFirst: jest.fn().mockImplementation((args) => {
                if (args.where.id === mockPrescriptionId && args.where.tenantId === mockTenantId) {
                  return Promise.resolve({
                    ...mockPrescription,
                    clinicVisit: mockVisit,
                  });
                }
                return Promise.resolve(null);
              }),
              create: jest.fn().mockResolvedValue(mockPrescription),
              update: jest.fn().mockImplementation((args) => {
                return Promise.resolve({
                  ...mockPrescription,
                  ...args.data,
                });
              }),
              delete: jest.fn().mockResolvedValue(mockPrescription),
            },
            $transaction: jest.fn().mockImplementation(async (cb) => {
              return cb({
                prescription: {
                  update: jest.fn().mockResolvedValue({
                    ...mockPrescription,
                    isDispensed: true,
                    dispensedAt: new Date(),
                    dispensedById: 'user-1',
                  }),
                },
                inventoryTransaction: {
                  create: jest.fn().mockResolvedValue({ id: 'tx-1' }),
                },
              });
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PrescriptionsService>(PrescriptionsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('getPrescriptionsByVisitId', () => {
    it('should return prescriptions list for a visit', async () => {
      const result = await service.getPrescriptionsByVisitId(mockTenantId, mockVisitId);

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].medicationName).toBe('Dexoryl Ear Drops');
      expect(result[0].priceMinor).toBe(35000);
      expect(result[0].isDispensed).toBe(false);
    });

    it('should throw NotFoundException for non-existent visit or cross-tenant', async () => {
      await expect(
        service.getPrescriptionsByVisitId(otherTenantId, mockVisitId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createPrescription', () => {
    it('should create prescription and auto-calculate price from product', async () => {
      const dto: CreatePrescriptionDto = {
        productId: mockProductId,
        medicationName: 'Dexoryl Ear Drops',
        quantity: 1,
        unit: 'ขวด',
        route: 'EAR',
        frequency: 'BID',
        instruction: 'หยอดหู 5 หยด เช้า-เย็น',
      };

      const result = await service.createPrescription(mockTenantId, mockVisitId, dto);

      expect(result).toBeDefined();
      expect(result.medicationName).toBe('Dexoryl Ear Drops');
      expect(prisma.prescription.create).toHaveBeenCalled();
    });
  });

  describe('updatePrescription & deletePrescription', () => {
    it('should update prescription details', async () => {
      const result = await service.updatePrescription(mockTenantId, mockPrescriptionId, {
        duration: '14 วัน',
        quantity: 2,
      });

      expect(result).toBeDefined();
      expect(prisma.prescription.update).toHaveBeenCalled();
    });

    it('should delete prescription if belonging to tenant', async () => {
      const res = await service.deletePrescription(mockTenantId, mockPrescriptionId);
      expect(res.success).toBe(true);
      expect(prisma.prescription.delete).toHaveBeenCalledWith({
        where: { id: mockPrescriptionId },
      });
    });
  });

  describe('dispensePrescriptions & Inventory Integration', () => {
    it('should dispense medications atomically and record inventory consumption', async () => {
      const res = await service.dispensePrescriptions(
        mockTenantId,
        mockVisitId,
        {
          deductStock: true,
          branchId: mockBranchId,
        },
        'user-1'
      );

      expect(res).toBeDefined();
      expect(res.dispensedCount).toBe(1);
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('generatePrescriptionLabel', () => {
    it('should format complete print-ready Thai medicine label', async () => {
      const label = await service.generatePrescriptionLabel(mockTenantId, mockPrescriptionId);

      expect(label).toBeDefined();
      expect(label.clinicName).toContain('PetFlow');
      expect(label.petName).toBe('น้องโมจิ');
      expect(label.customerName).toBe('คุณกนกวรรณ ศรีสุข');
      expect(label.medicationName).toBe('Dexoryl Ear Drops');
      expect(label.instruction).toBeDefined();
    });
  });
});
