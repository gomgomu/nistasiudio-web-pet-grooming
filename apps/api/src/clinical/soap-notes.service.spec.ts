import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SoapNotesService } from './soap-notes.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSoapNoteDto } from './dto/update-soap-note.dto';
import { AddClinicAttachmentDto } from './dto/add-clinic-attachment.dto';

describe('SoapNotesService (SOAP Notes & Clinical Records API)', () => {
  let service: SoapNotesService;
  let prisma: PrismaService;

  const mockTenantId = 't1111111-1111-4111-a111-111111111111';
  const otherTenantId = 't2222222-2222-4222-a222-222222222222';
  const mockPetId = 'p1111111-1111-4111-a111-111111111111';
  const mockVisitId = 'v1111111-1111-4111-a111-111111111111';
  const mockAttachmentId = 'att-1111-4111-a111-111111111111';

  const mockCustomer = {
    id: 'c111',
    firstName: 'คุณกนกวรรณ',
    lastName: 'ศรีสุข',
    phone: '089-111-2233',
  };

  const mockPet = {
    id: mockPetId,
    tenantId: mockTenantId,
    name: 'น้องโมจิ',
    species: 'DOG',
    breed: 'Pomeranian',
    weight: 4.2,
    allergies: 'แพ้ยาแก้แพ้บางกลุ่ม',
    customer: mockCustomer,
    clinicVisits: [],
    vaccinations: [],
    medicalRecords: [],
  };

  const mockAttachment = {
    id: mockAttachmentId,
    tenantId: mockTenantId,
    clinicVisitId: mockVisitId,
    attachmentType: 'WOUND_PHOTO',
    fileUrl: 'https://storage.petflow.app/attachments/wound-ear-01.jpg',
    fileName: 'wound-ear-01.jpg',
    caption: 'ภาพถ่ายบริเวณใบหูขวา',
    uploadedAt: new Date('2026-08-27T10:00:00Z'),
  };

  const mockMedicalRecord = {
    id: 'mr-1',
    petId: mockPetId,
    clinicVisitId: mockVisitId,
    recordType: 'SOAP',
    content: JSON.stringify({
      authorName: 'น.สพ. วรปรัชญ์',
      authorNote: 'ตรวจรักษาอาการช่องหูอักเสบครั้งแรก',
      diagnosis: 'Otitis Externa',
    }),
    createdAt: new Date('2026-08-27T10:00:00Z'),
  };

  const mockVisit = {
    id: mockVisitId,
    tenantId: mockTenantId,
    branchId: 'b111',
    customerId: 'c111',
    petId: mockPetId,
    veterinarianId: 'vet-1',
    visitNumber: 'VN-2026-0001',
    status: 'IN_CONSULTATION',
    visitType: 'SICK_VISIT',
    chiefComplaint: 'คันหู เกาตลอดเวลา มีกลิ่น',
    symptoms: 'มีขี้หูดำสะเก็ด',
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
    objective: 'พบขี้หูดำ ช่องหูแดงบวมเล็กน้อย Cytology: Malassezia (3+)',
    assessment: 'Right Otitis Externa from Malassezia overgrowth',
    plan: 'Flush ear + Dexoryl ear drops 5 drops BID x 7 days',
    treatmentSummary: 'ทำความสะอาดช่องหูและหยอดยา',
    dischargeNotes: 'ระวังน้ำเข้าหู นัดตรวจซ้ำ 7 วัน',
    followUpDate: new Date('2026-09-03T00:00:00Z'),
    followUpReason: 'ตรวจซ้ำส่องกล้องหู',
    visitedAt: new Date('2026-08-27T10:00:00Z'),
    completedAt: null,
    createdAt: new Date('2026-08-27T10:00:00Z'),
    customer: mockCustomer,
    pet: mockPet,
    veterinarian: { id: 'vet-1', firstName: 'น.สพ. วรปรัชญ์', lastName: 'เกียรติสกุล' },
    attachments: [mockAttachment],
    medicalRecords: [mockMedicalRecord],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SoapNotesService,
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
              update: jest.fn().mockImplementation((args) => {
                return Promise.resolve({
                  ...mockVisit,
                  ...args.data,
                });
              }),
            },
            pet: {
              findFirst: jest.fn().mockImplementation((args) => {
                if (args.where.id === mockPetId && args.where.tenantId === mockTenantId) {
                  return Promise.resolve({
                    ...mockPet,
                    clinicVisits: [mockVisit],
                    vaccinations: [],
                    medicalRecords: [mockMedicalRecord],
                  });
                }
                return Promise.resolve(null);
              }),
              update: jest.fn().mockResolvedValue(mockPet),
            },
            petMedicalRecord: {
              create: jest.fn().mockResolvedValue(mockMedicalRecord),
            },
            clinicAttachment: {
              create: jest.fn().mockResolvedValue(mockAttachment),
              findMany: jest.fn().mockImplementation((args) => {
                if (args.where.clinicVisitId === mockVisitId && args.where.tenantId === mockTenantId) {
                  return Promise.resolve([mockAttachment]);
                }
                return Promise.resolve([]);
              }),
              findFirst: jest.fn().mockImplementation((args) => {
                if (args.where.id === mockAttachmentId && args.where.tenantId === mockTenantId) {
                  return Promise.resolve(mockAttachment);
                }
                return Promise.resolve(null);
              }),
              delete: jest.fn().mockResolvedValue(mockAttachment),
            },
          },
        },
      ],
    }).compile();

    service = module.get<SoapNotesService>(SoapNotesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('getSoapNoteByVisitId', () => {
    it('should return structured SOAP note, vitals, attachments and revision history', async () => {
      const result = await service.getSoapNoteByVisitId(mockTenantId, mockVisitId);

      expect(result).toBeDefined();
      expect(result.visitId).toBe(mockVisitId);
      expect(result.subjective).toBe('เจ้าของสังเกตว่าสุนัขเกาหูบ่อย 3 วัน');
      expect(result.objective).toContain('Malassezia');
      expect(result.assessment).toContain('Otitis Externa');
      expect(result.plan).toContain('Dexoryl');
      expect(result.attachments.length).toBe(1);
      expect(result.attachments[0].attachmentType).toBe('WOUND_PHOTO');
      expect(result.historyEntries.length).toBe(1);
    });

    it('should throw NotFoundException for non-existent visit or cross-tenant access', async () => {
      await expect(service.getSoapNoteByVisitId(otherTenantId, mockVisitId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('updateSoapNote', () => {
    it('should update structured fields and create append-only audit snapshot in PetMedicalRecord', async () => {
      const dto: UpdateSoapNoteDto = {
        subjective: 'อาการคันหูลดลง ไม่เกาแล้ว',
        objective: 'ขี้หูลดลง ไม่บวมแดง',
        assessment: 'Otitis Externa - Improving',
        plan: 'ให้ยาหยอดหูต่ออีก 3 วันจนหมด',
        authorNote: 'ตรวจติดตามอาการหูอักเสบครั้งที่ 2',
        vitals: { weightKg: 4.6 },
      };

      const result = await service.updateSoapNote(
        mockTenantId,
        mockVisitId,
        dto,
        'user-1',
        'น.สพ. วรปรัชญ์'
      );

      expect(result).toBeDefined();
      expect(prisma.clinicVisit.update).toHaveBeenCalled();
      expect(prisma.pet.update).toHaveBeenCalledWith({
        where: { id: mockPetId },
        data: { weight: 4.6 },
      });
      expect(prisma.petMedicalRecord.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          petId: mockPetId,
          clinicVisitId: mockVisitId,
          recordType: 'SOAP',
        }),
      });
    });
  });

  describe('getPetMedicalHistory', () => {
    it('should return full chronological medical history for a pet', async () => {
      const history = await service.getPetMedicalHistory(mockTenantId, mockPetId);

      expect(history).toBeDefined();
      expect(history.pet.name).toBe('น้องโมจิ');
      expect(history.visitsCount).toBe(1);
      expect(history.visits[0].diagnosis).toBe('Otitis Externa');
    });

    it('should throw NotFoundException for pet of another tenant', async () => {
      await expect(service.getPetMedicalHistory(otherTenantId, mockPetId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('Clinical Attachments', () => {
    it('should add and retrieve clinical attachments', async () => {
      const dto: AddClinicAttachmentDto = {
        attachmentType: 'WOUND_PHOTO',
        fileUrl: 'https://storage.petflow.app/attachments/wound-ear-01.jpg',
        fileName: 'wound-ear-01.jpg',
        caption: 'ภาพถ่ายบริเวณใบหูขวา',
      };

      const added = await service.addClinicAttachment(mockTenantId, mockVisitId, dto);
      expect(added).toBeDefined();
      expect(added.attachmentType).toBe('WOUND_PHOTO');

      const list = await service.getClinicAttachments(mockTenantId, mockVisitId);
      expect(list.length).toBe(1);
    });

    it('should delete clinical attachment', async () => {
      const res = await service.deleteClinicAttachment(mockTenantId, mockAttachmentId);
      expect(res.success).toBe(true);
      expect(prisma.clinicAttachment.delete).toHaveBeenCalledWith({
        where: { id: mockAttachmentId },
      });
    });
  });
});
