import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsService } from './appointments.service';
import { BookingConflictService } from './booking-conflict.service';
import { ServicesService } from '../services/services.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  AppointmentSource,
  AppointmentStatus,
  PetSpecies,
} from '@prisma/client';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let prisma: PrismaService;
  let conflictService: BookingConflictService;
  let servicesService: ServicesService;

  const mockTenantId = 't1111111-1111-4111-a111-111111111111';
  const mockOtherTenantId = 't2222222-2222-4222-a222-222222222222';
  const mockUserId = 'u1111111-1111-4111-a111-111111111111';

  const mockBranch = {
    id: 'b1111111-1111-4111-a111-111111111111',
    tenantId: mockTenantId,
    name: 'สาขาทองหล่อ',
    isActive: true,
  };

  const mockCustomer = {
    id: 'c1111111-1111-4111-a111-111111111111',
    tenantId: mockTenantId,
    firstName: 'สมชาย',
    lastName: 'รักสัตว์',
    phone: '0812345678',
  };

  const mockPet = {
    id: 'p1111111-1111-4111-a111-111111111111',
    tenantId: mockTenantId,
    customerId: mockCustomer.id,
    name: 'น้องโมจิ',
    species: PetSpecies.DOG,
    weight: 4.5,
  };

  const mockServiceEntity = {
    id: 's1111111-1111-4111-a111-111111111111',
    tenantId: mockTenantId,
    name: 'อาบน้ำตัดขนสุนัขเล็ก',
    durationMinutes: 90,
    basePriceMinor: BigInt(45000),
    isActive: true,
  };

  const mockAppointment = {
    id: 'apt-1111-1111-1111-111111111111',
    tenantId: mockTenantId,
    branchId: mockBranch.id,
    customerId: mockCustomer.id,
    petId: mockPet.id,
    serviceId: mockServiceEntity.id,
    staffId: mockUserId,
    createdById: mockUserId,
    startAt: new Date('2026-09-01T09:00:00.000Z'),
    endAt: new Date('2026-09-01T10:30:00.000Z'),
    status: AppointmentStatus.PENDING,
    source: AppointmentSource.PHONE,
    priceMinor: BigInt(45000),
    notes: 'น้องเรียบร้อยดี',
    customer: mockCustomer,
    pet: mockPet,
    service: mockServiceEntity,
    assignedStaff: {
      id: mockUserId,
      firstName: 'เอกชัย',
      lastName: 'ช่างกรูมมิ่ง',
      role: 'STAFF',
    },
    branch: mockBranch,
  };

  const mockPrismaService: any = {
    customer: {
      findUnique: jest.fn(),
    },
    pet: {
      findUnique: jest.fn(),
    },
    service: {
      findUnique: jest.fn(),
    },
    appointment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockBookingConflictService = {
    validateBooking: jest.fn(),
    findAvailableSlots: jest.fn(),
  };

  const mockServicesService = {
    calculateServicePrice: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: BookingConflictService,
          useValue: mockBookingConflictService,
        },
        {
          provide: ServicesService,
          useValue: mockServicesService,
        },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
    prisma = module.get<PrismaService>(PrismaService);
    conflictService = module.get<BookingConflictService>(BookingConflictService);
    servicesService = module.get<ServicesService>(ServicesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an appointment with automatic endAt and pricing calculation', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.pet.findUnique.mockResolvedValue(mockPet);
      mockPrismaService.service.findUnique.mockResolvedValue(mockServiceEntity);
      mockServicesService.calculateServicePrice.mockResolvedValue({
        finalPriceMinor: 45000,
        appliedRule: null,
      });
      mockBookingConflictService.validateBooking.mockResolvedValue({ isValid: true });
      mockPrismaService.appointment.create.mockResolvedValue(mockAppointment);

      const result = await service.create(mockTenantId, mockUserId, {
        branchId: mockBranch.id,
        customerId: mockCustomer.id,
        petId: mockPet.id,
        serviceId: mockServiceEntity.id,
        startAt: '2026-09-01T09:00:00.000Z',
      });

      expect(result).toBeDefined();
      expect(result.priceMinor).toBe(45000);
      expect(mockBookingConflictService.validateBooking).toHaveBeenCalled();
      expect(mockPrismaService.appointment.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if pet does not belong to customer', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.pet.findUnique.mockResolvedValue({
        ...mockPet,
        customerId: 'different-customer-id',
      });

      await expect(
        service.create(mockTenantId, mockUserId, {
          branchId: mockBranch.id,
          customerId: mockCustomer.id,
          petId: mockPet.id,
          serviceId: mockServiceEntity.id,
          startAt: '2026-09-01T09:00:00.000Z',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if slot conflicts and allowConflict is false', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.pet.findUnique.mockResolvedValue(mockPet);
      mockPrismaService.service.findUnique.mockResolvedValue(mockServiceEntity);
      mockServicesService.calculateServicePrice.mockResolvedValue({
        finalPriceMinor: 45000,
      });
      mockBookingConflictService.validateBooking.mockResolvedValue({
        isValid: false,
        conflictType: 'STAFF_DOUBLE_BOOKED',
        conflictReason: 'พนักงานมีนัดหมายอื่นที่ทับซ้อนในช่วงเวลานี้',
      });

      await expect(
        service.create(mockTenantId, mockUserId, {
          branchId: mockBranch.id,
          customerId: mockCustomer.id,
          petId: mockPet.id,
          serviceId: mockServiceEntity.id,
          startAt: '2026-09-01T09:00:00.000Z',
          allowConflict: false,
        })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated list of appointments', async () => {
      mockPrismaService.appointment.count.mockResolvedValue(1);
      mockPrismaService.appointment.findMany.mockResolvedValue([mockAppointment]);

      const result = await service.findAll(mockTenantId, {
        branchId: mockBranch.id,
        page: 1,
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findById', () => {
    it('should return single appointment by ID', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointment);

      const result = await service.findById(mockAppointment.id, mockTenantId);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockAppointment.id);
    });

    it('should throw ForbiddenException if appointment belongs to another tenant', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue({
        ...mockAppointment,
        tenantId: mockOtherTenantId,
      });

      await expect(
        service.findById(mockAppointment.id, mockTenantId)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateStatus', () => {
    it('should update status to CHECKED_IN and record checkedInAt timestamp', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointment);
      mockPrismaService.appointment.update.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.CHECKED_IN,
        checkedInAt: new Date(),
      });

      const result = await service.updateStatus(mockAppointment.id, mockTenantId, {
        status: AppointmentStatus.CHECKED_IN,
      });

      expect(result.status).toBe(AppointmentStatus.CHECKED_IN);
      expect(mockPrismaService.appointment.update).toHaveBeenCalled();
    });

    it('should update status to CANCELLED and record cancellation reason', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointment);
      mockPrismaService.appointment.update.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.CANCELLED,
        cancellationReason: 'ลูกค้าขอยกเลิก',
        cancelledAt: new Date(),
      });

      const result = await service.updateStatus(mockAppointment.id, mockTenantId, {
        status: AppointmentStatus.CANCELLED,
        cancellationReason: 'ลูกค้าขอยกเลิก',
      });

      expect(result.status).toBe(AppointmentStatus.CANCELLED);
    });
  });

  describe('delete', () => {
    it('should successfully delete a pending appointment', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointment);
      mockPrismaService.appointment.delete.mockResolvedValue(mockAppointment);

      const result = await service.delete(mockAppointment.id, mockTenantId);

      expect(result.success).toBe(true);
      expect(mockPrismaService.appointment.delete).toHaveBeenCalledWith({
        where: { id: mockAppointment.id },
      });
    });

    it('should throw BadRequestException if trying to delete a completed appointment', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.COMPLETED,
      });

      await expect(
        service.delete(mockAppointment.id, mockTenantId)
      ).rejects.toThrow(BadRequestException);
    });
  });
});
