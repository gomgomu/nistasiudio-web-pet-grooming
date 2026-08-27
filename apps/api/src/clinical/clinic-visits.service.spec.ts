import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ClinicVisitsService } from './clinic-visits.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClinicVisitDto } from './dto/create-clinic-visit.dto';

describe('ClinicVisitsService (Veterinary Clinic Core)', () => {
  let service: ClinicVisitsService;
  let prisma: PrismaService;

  const mockTenantId = 't1111111-1111-4111-a111-111111111111';
  const otherTenantId = 't2222222-2222-4222-a222-222222222222';
  const mockBranchId = 'b1111111-1111-4111-a111-111111111111';
  const mockCustomerId = 'c1111111-1111-4111-a111-111111111111';
  const mockPetId = 'p1111111-1111-4111-a111-111111111111';
  const mockVisitId = 'v1111111-1111-4111-a111-111111111111';

  const mockPet = {
    id: mockPetId,
    tenantId: mockTenantId,
    customerId: mockCustomerId,
    name: 'น้องโมจิ',
    species: 'DOG',
    breed: 'Pomeranian',
    weight: 4.2,
    customer: {
      id: mockCustomerId,
      firstName: 'คุณกนกวรรณ',
      lastName: 'ศรีสุข',
      phone: '089-111-2233',
      lineUserId: 'U111',
    },
  };

  const mockBranch = {
    id: mockBranchId,
    tenantId: mockTenantId,
    name: 'สาขาทองหล่อ',
  };

  const mockVisit = {
    id: mockVisitId,
    tenantId: mockTenantId,
    branchId: mockBranchId,
    customerId: mockCustomerId,
    petId: mockPetId,
    appointmentId: null,
    veterinarianId: 'vet-1',
    visitNumber: 'VN-2026-0001',
    status: 'WAITING',
    visitType: 'SICK_VISIT',
    chiefComplaint: 'คันหู เกาตลอดเวลา มีกลิ่น',
    symptoms: 'มีขี้หูสีดำสะเก็ด',
    diagnosis: 'Otitis Externa',
    differentialDiagnosis: 'Ear mites',
    weightKg: 4.5,
    temperatureC: 38.6,
    heartRateBpm: 120,
    respiratoryRateBpm: 24,
    capillaryRefillTime: '< 2s',
    mucousMembrane: 'Pink, Moist',
    bodyConditionScore: 5,
    subjective: 'เจ้าของสังเกตว่าสุนัขเกาหูบ่อย 3 วัน',
    objective: 'พบขี้หูดำ ช่องหูแดงบวมเล็กน้อย',
    assessment: 'ติดเชื้อยีสต์ในช่องหู',
    plan: 'ล้างทำความสะอาดหู + หยอด Dexoryl 5 หยด วันละ 2 ครั้ง',
    treatmentSummary: 'ทำความสะอาดช่องหูและหยอดยา',
    dischargeNotes: 'ระวังน้ำเข้าหู นัดตรวจซ้ำ 7 วัน',
    followUpDate: new Date('2026-09-03T00:00:00Z'),
    followUpReason: 'ตรวจซ้ำส่องกล้องหู',
    visitedAt: new Date('2026-08-27T10:00:00Z'),
    completedAt: null,
    createdAt: new Date('2026-08-27T10:00:00Z'),
    updatedAt: new Date('2026-08-27T10:00:00Z'),
    branch: mockBranch,
    customer: mockPet.customer,
    pet: mockPet,
    veterinarian: { id: 'vet-1', firstName: 'น.สพ. วรปรัชญ์', lastName: 'เกียรติสกุล' },
    _count: { prescriptions: 1, treatments: 1 },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClinicVisitsService,
        {
          provide: PrismaService,
          useValue: {
            pet: {
              findFirst: jest.fn().mockImplementation((args) => {
                if (args.where.id === mockPetId && args.where.tenantId === mockTenantId) {
                  return Promise.resolve(mockPet);
                }
                return Promise.resolve(null);
              }),
              update: jest.fn().mockResolvedValue(mockPet),
            },
            branch: {
              findFirst: jest.fn().mockImplementation((args) => {
                if (args.where.id === mockBranchId && args.where.tenantId === mockTenantId) {
                  return Promise.resolve(mockBranch);
                }
                return Promise.resolve(null);
              }),
            },
            clinicVisit: {
              count: jest.fn().mockResolvedValue(0),
              create: jest.fn().mockResolvedValue(mockVisit),
              findMany: jest.fn().mockResolvedValue([mockVisit]),
              findFirst: jest.fn().mockImplementation((args) => {
                if (args.where.id === mockVisitId && args.where.tenantId === mockTenantId) {
                  return Promise.resolve(mockVisit);
                }
                return Promise.resolve(null);
              }),
              update: jest.fn().mockImplementation((args) => {
                return Promise.resolve({
                  ...mockVisit,
                  ...args.data,
                  status: args.data.status || mockVisit.status,
                });
              }),
              delete: jest.fn().mockResolvedValue(mockVisit),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ClinicVisitsService>(ClinicVisitsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('createClinicVisit', () => {
    it('should create a clinic visit with sequential visit number and update pet weight', async () => {
      const dto: CreateClinicVisitDto = {
        branchId: mockBranchId,
        customerId: mockCustomerId,
        petId: mockPetId,
        visitType: 'SICK_VISIT',
        chiefComplaint: 'คันหู เกาตลอดเวลา มีกลิ่น',
        vitals: {
          weightKg: 4.5,
          temperatureC: 38.6,
          heartRateBpm: 120,
        },
      };

      const result = await service.createClinicVisit(mockTenantId, dto);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockVisitId);
      expect(result.visitNumber).toBe('VN-2026-0001');
      expect(result.status).toBe('WAITING');
      expect(result.customerName).toBe('คุณกนกวรรณ ศรีสุข');
      expect(result.vitals.weightKg).toBe(4.5);
      expect(prisma.pet.update).toHaveBeenCalledWith({
        where: { id: mockPetId },
        data: { weight: 4.5 },
      });
    });

    it('should throw NotFoundException if pet does not belong to tenant', async () => {
      const dto: CreateClinicVisitDto = {
        branchId: mockBranchId,
        customerId: mockCustomerId,
        petId: 'unknown-pet',
      };

      await expect(service.createClinicVisit(mockTenantId, dto)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getClinicVisits', () => {
    it('should return paginated list of clinic visits scoped to tenant', async () => {
      const result = await service.getClinicVisits(mockTenantId, { page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
      expect(result.data[0].petName).toBe('น้องโมจิ');
      expect(result.data[0].diagnosis).toBe('Otitis Externa');
    });
  });

  describe('getClinicVisitById', () => {
    it('should return single clinic visit details', async () => {
      const result = await service.getClinicVisitById(mockTenantId, mockVisitId);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockVisitId);
      expect(result.chiefComplaint).toBe('คันหู เกาตลอดเวลา มีกลิ่น');
    });

    it('should throw NotFoundException for non-existent visit or cross-tenant access', async () => {
      await expect(service.getClinicVisitById(otherTenantId, mockVisitId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('updateClinicVisit & updateClinicVisitStatus', () => {
    it('should update vitals and set completedAt when status is COMPLETED', async () => {
      const result = await service.updateClinicVisit(mockTenantId, mockVisitId, {
        status: 'COMPLETED',
        vitals: { weightKg: 4.6 },
        diagnosis: 'Otitis Externa Resolved',
      });

      expect(result).toBeDefined();
      expect(prisma.clinicVisit.update).toHaveBeenCalled();
    });

    it('should update status via updateClinicVisitStatus helper', async () => {
      const result = await service.updateClinicVisitStatus(
        mockTenantId,
        mockVisitId,
        'IN_CONSULTATION'
      );

      expect(result).toBeDefined();
    });
  });

  describe('deleteClinicVisit', () => {
    it('should delete visit if belonging to tenant', async () => {
      const result = await service.deleteClinicVisit(mockTenantId, mockVisitId);

      expect(result.success).toBe(true);
      expect(prisma.clinicVisit.delete).toHaveBeenCalledWith({
        where: { id: mockVisitId },
      });
    });

    it('should throw NotFoundException when trying to delete from another tenant', async () => {
      await expect(service.deleteClinicVisit(otherTenantId, mockVisitId)).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
