import { Test, TestingModule } from '@nestjs/testing';
import { GroomingQueueService } from './grooming-queue.service';
import { GroomingNotificationService } from './grooming-notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { ServicesService } from '../services/services.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { GroomingQueueStatus, AppointmentStatus, PetSpecies, PetSex } from '@prisma/client';

describe('GroomingQueueService', () => {
  let service: GroomingQueueService;
  let prisma: PrismaService;
  let servicesService: ServicesService;

  const mockTenantId = 't1111111-1111-4111-a111-111111111111';
  const mockOtherTenantId = 't2222222-2222-4222-a222-222222222222';
  const mockBranchId = 'b1111111-1111-4111-a111-111111111111';
  const mockCustomerId = 'c1111111-1111-4111-a111-111111111111';
  const mockPetId = 'p1111111-1111-4111-a111-111111111111';
  const mockServiceId = 's1111111-1111-4111-a111-111111111111';
  const mockGroomerId = 'u1111111-1111-4111-a111-111111111111';
  const mockAppointmentId = 'a1111111-1111-4111-a111-111111111111';
  const mockQueueItemId = 'q1111111-1111-4111-a111-111111111111';

  const mockBranch = {
    id: mockBranchId,
    tenantId: mockTenantId,
    name: 'สาขาทองหล่อ',
  };

  const mockCustomer = {
    id: mockCustomerId,
    tenantId: mockTenantId,
    firstName: 'สมชาย',
    lastName: 'ใจดี',
  };

  const mockPet = {
    id: mockPetId,
    tenantId: mockTenantId,
    name: 'น้องโมจิ',
    species: PetSpecies.DOG,
    breed: 'ปอมเมอเรเนียน',
    sex: PetSex.MALE,
    weight: 4.2,
    groomingProfile: {
      preferredCut: 'ทรงหน้าหมี',
      warnings: 'ระวังติ่งเนื้อที่หู',
      preferredGroomerId: mockGroomerId,
    },
  };

  const mockServiceRecord = {
    id: mockServiceId,
    tenantId: mockTenantId,
    name: 'อาบน้ำตัดขนสุนัข',
    basePrice: 55000,
    durationMinutes: 90,
  };

  const mockGroomer = {
    id: mockGroomerId,
    tenantId: mockTenantId,
    firstName: 'เอกชัย',
    lastName: 'ช่างกรูมมิ่ง',
    role: 'GROOMER',
  };

  const mockAppointment = {
    id: mockAppointmentId,
    tenantId: mockTenantId,
    branchId: mockBranchId,
    status: AppointmentStatus.CONFIRMED,
  };

  const mockQueueItem = {
    id: mockQueueItemId,
    tenantId: mockTenantId,
    branchId: mockBranchId,
    customerId: mockCustomerId,
    petId: mockPetId,
    serviceId: mockServiceId,
    appointmentId: mockAppointmentId,
    groomerId: mockGroomerId,
    queueNumber: 1,
    status: GroomingQueueStatus.WAITING,
    specialCareNotes: 'ระวังติ่งเนื้อที่หู',
    weightKg: 4.2,
    estimatedDurationMinutes: 90,
    actualDurationMinutes: null,
    priceMinor: BigInt(55000),
    startedAt: null,
    bathingStartedAt: null,
    dryingStartedAt: null,
    groomingStartedAt: null,
    finishingStartedAt: null,
    readyAt: null,
    pickedUpAt: null,
    cancelledAt: null,
    cancellationReason: null,
    createdAt: new Date(),
    customer: mockCustomer,
    pet: mockPet,
    service: mockServiceRecord,
    groomer: mockGroomer,
    appointment: mockAppointment,
    photos: [],
  };

  const mockPrismaService: any = {
    branch: { findUnique: jest.fn() },
    customer: { findUnique: jest.fn() },
    pet: { findUnique: jest.fn(), update: jest.fn() },
    service: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
    appointment: { findUnique: jest.fn(), update: jest.fn() },
    groomingQueueItem: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockServicesService: any = {
    calculateServicePrice: jest.fn(),
  };

  const mockGroomingNotificationService: any = {
    sendGroomingReadyNotification: jest.fn().mockResolvedValue({ sent: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroomingQueueService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ServicesService, useValue: mockServicesService },
        { provide: GroomingNotificationService, useValue: mockGroomingNotificationService },
      ],
    }).compile();

    service = module.get<GroomingQueueService>(GroomingQueueService);
    prisma = module.get<PrismaService>(PrismaService);
    servicesService = module.get<ServicesService>(ServicesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkIn', () => {
    it('should check in pet, assign sequential queue number, and sync appointment status', async () => {
      mockPrismaService.branch.findUnique.mockResolvedValue(mockBranch);
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.pet.findUnique.mockResolvedValue(mockPet);
      mockPrismaService.service.findUnique.mockResolvedValue(mockServiceRecord);
      mockPrismaService.user.findUnique.mockResolvedValue(mockGroomer);
      mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointment);
      mockPrismaService.groomingQueueItem.findFirst.mockResolvedValue(null); // First queue of the day
      mockServicesService.calculateServicePrice.mockResolvedValue({ finalPriceMinor: 55000 });
      mockPrismaService.groomingQueueItem.create.mockResolvedValue(mockQueueItem);
      mockPrismaService.appointment.update.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.CHECKED_IN,
      });

      const result = await service.checkIn(mockTenantId, {
        branchId: mockBranchId,
        customerId: mockCustomerId,
        petId: mockPetId,
        serviceId: mockServiceId,
        appointmentId: mockAppointmentId,
        groomerId: mockGroomerId,
      });

      expect(result).toBeDefined();
      expect(result.queueNumber).toBe(1);
      expect(result.priceMinor).toBe(55000);
      expect(mockPrismaService.appointment.update).toHaveBeenCalledWith({
        where: { id: mockAppointmentId },
        data: {
          status: AppointmentStatus.CHECKED_IN,
          checkedInAt: expect.any(Date),
        },
      });
    });

    it('should increment sequential queue number for subsequent check-ins', async () => {
      mockPrismaService.branch.findUnique.mockResolvedValue(mockBranch);
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.pet.findUnique.mockResolvedValue(mockPet);
      mockPrismaService.service.findUnique.mockResolvedValue(mockServiceRecord);
      mockPrismaService.groomingQueueItem.findFirst.mockResolvedValue({ queueNumber: 5 });
      mockServicesService.calculateServicePrice.mockResolvedValue({ finalPriceMinor: 55000 });
      mockPrismaService.groomingQueueItem.create.mockResolvedValue({
        ...mockQueueItem,
        queueNumber: 6,
      });

      const result = await service.checkIn(mockTenantId, {
        branchId: mockBranchId,
        customerId: mockCustomerId,
        petId: mockPetId,
        serviceId: mockServiceId,
      });

      expect(result.queueNumber).toBe(6);
    });

    it('should throw ForbiddenException if branch belongs to another tenant', async () => {
      mockPrismaService.branch.findUnique.mockResolvedValue({
        ...mockBranch,
        tenantId: mockOtherTenantId,
      });

      await expect(
        service.checkIn(mockTenantId, {
          branchId: mockBranchId,
          customerId: mockCustomerId,
          petId: mockPetId,
          serviceId: mockServiceId,
        })
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('should query queue items and return paginated result', async () => {
      mockPrismaService.groomingQueueItem.findMany.mockResolvedValue([mockQueueItem]);
      mockPrismaService.groomingQueueItem.count.mockResolvedValue(1);

      const result = await service.findAll(mockTenantId, {
        branchId: mockBranchId,
        status: GroomingQueueStatus.WAITING,
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findById', () => {
    it('should return verified queue item by ID', async () => {
      mockPrismaService.groomingQueueItem.findUnique.mockResolvedValue(mockQueueItem);

      const result = await service.findById(mockTenantId, mockQueueItemId);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockQueueItemId);
    });

    it('should throw ForbiddenException if queue item belongs to another tenant', async () => {
      mockPrismaService.groomingQueueItem.findUnique.mockResolvedValue({
        ...mockQueueItem,
        tenantId: mockOtherTenantId,
      });

      await expect(
        service.findById(mockTenantId, mockQueueItemId)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateStatus', () => {
    it('should record stage timestamps when transitioning to BATHING', async () => {
      mockPrismaService.groomingQueueItem.findUnique.mockResolvedValue(mockQueueItem);
      mockPrismaService.groomingQueueItem.update.mockResolvedValue({
        ...mockQueueItem,
        status: GroomingQueueStatus.BATHING,
        startedAt: new Date(),
        bathingStartedAt: new Date(),
      });

      const result = await service.updateStatus(mockTenantId, mockQueueItemId, {
        status: GroomingQueueStatus.BATHING,
      });

      expect(result.status).toBe(GroomingQueueStatus.BATHING);
      expect(mockPrismaService.groomingQueueItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockQueueItemId },
          data: expect.objectContaining({
            status: GroomingQueueStatus.BATHING,
            bathingStartedAt: expect.any(Date),
            startedAt: expect.any(Date),
          }),
        })
      );
    });

    it('should mark linked appointment as COMPLETED when PICKED_UP', async () => {
      mockPrismaService.groomingQueueItem.findUnique.mockResolvedValue(mockQueueItem);
      mockPrismaService.groomingQueueItem.update.mockResolvedValue({
        ...mockQueueItem,
        status: GroomingQueueStatus.PICKED_UP,
        pickedUpAt: new Date(),
      });
      mockPrismaService.appointment.update.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.COMPLETED,
      });

      const result = await service.updateStatus(mockTenantId, mockQueueItemId, {
        status: GroomingQueueStatus.PICKED_UP,
      });

      expect(result.status).toBe(GroomingQueueStatus.PICKED_UP);
      expect(mockPrismaService.appointment.update).toHaveBeenCalledWith({
        where: { id: mockAppointmentId },
        data: {
          status: AppointmentStatus.COMPLETED,
          completedAt: expect.any(Date),
        },
      });
    });
  });

  describe('assignGroomer', () => {
    it('should assign groomer to queue item', async () => {
      mockPrismaService.groomingQueueItem.findUnique.mockResolvedValue(mockQueueItem);
      mockPrismaService.user.findUnique.mockResolvedValue(mockGroomer);
      mockPrismaService.groomingQueueItem.update.mockResolvedValue({
        ...mockQueueItem,
        groomerId: mockGroomerId,
      });

      const result = await service.assignGroomer(mockTenantId, mockQueueItemId, mockGroomerId);

      expect(result.groomerId).toBe(mockGroomerId);
      expect(mockPrismaService.groomingQueueItem.update).toHaveBeenCalledWith({
        where: { id: mockQueueItemId },
        data: { groomerId: mockGroomerId },
        include: expect.any(Object),
      });
    });
  });

  describe('delete', () => {
    it('should delete queue item', async () => {
      mockPrismaService.groomingQueueItem.findUnique.mockResolvedValue(mockQueueItem);
      mockPrismaService.groomingQueueItem.delete.mockResolvedValue(mockQueueItem);

      const result = await service.delete(mockTenantId, mockQueueItemId);

      expect(result.success).toBe(true);
      expect(mockPrismaService.groomingQueueItem.delete).toHaveBeenCalledWith({
        where: { id: mockQueueItemId },
      });
    });
  });
});
