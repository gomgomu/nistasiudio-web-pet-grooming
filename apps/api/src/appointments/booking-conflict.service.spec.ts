import { Test, TestingModule } from '@nestjs/testing';
import { BookingConflictService } from './booking-conflict.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  AppointmentStatus,
  DayOfWeek,
  LeaveStatus,
  LeaveType,
  UserStatus,
} from '@prisma/client';

describe('BookingConflictService', () => {
  let service: BookingConflictService;
  let prisma: PrismaService;

  const mockTenantId = 't1111111-1111-4111-a111-111111111111';
  const mockOtherTenantId = 't2222222-2222-4222-a222-222222222222';

  const mockBranch = {
    id: 'b1111111-1111-4111-a111-111111111111',
    tenantId: mockTenantId,
    name: 'สาขาทองหล่อ',
    code: 'TL01',
    isActive: true,
  };

  const mockPet = {
    id: 'p1111111-1111-4111-a111-111111111111',
    tenantId: mockTenantId,
    name: 'น้องโมจิ',
    species: 'DOG',
  };

  const mockStaff = {
    id: 'u1111111-1111-4111-a111-111111111111',
    tenantId: mockTenantId,
    firstName: 'เอกชัย',
    lastName: 'ช่างกรูมมิ่ง',
    status: UserStatus.ACTIVE,
    staffProfile: {
      isBookable: true,
      nickname: 'ช่างเอก',
    },
    userBranches: [{ branchId: mockBranch.id }],
  };

  const mockSchedule = {
    id: 'sch-1111',
    tenantId: mockTenantId,
    userId: mockStaff.id,
    branchId: mockBranch.id,
    dayOfWeek: DayOfWeek.TUESDAY,
    startTime: '09:00',
    endTime: '18:00',
    breakStartTime: '12:00',
    breakEndTime: '13:00',
    isActive: true,
  };

  const mockExistingAppointment = {
    id: 'apt-1111-1111-1111-111111111111',
    tenantId: mockTenantId,
    branchId: mockBranch.id,
    staffId: mockStaff.id,
    petId: mockPet.id,
    startAt: new Date('2026-08-25T03:00:00.000Z'), // 10:00 Bangkok
    endAt: new Date('2026-08-25T04:00:00.000Z'),   // 11:00 Bangkok
    status: AppointmentStatus.CONFIRMED,
  };

  const mockPrismaService: any = {
    branch: {
      findUnique: jest.fn(),
    },
    pet: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    staffSchedule: {
      findMany: jest.fn(),
    },
    staffLeave: {
      findMany: jest.fn(),
    },
    blockedTime: {
      findFirst: jest.fn(),
    },
    appointment: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingConflictService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BookingConflictService>(BookingConflictService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateBooking', () => {
    it('should validate successfully when slot is conflict-free', async () => {
      mockPrismaService.branch.findUnique.mockResolvedValue(mockBranch);
      mockPrismaService.pet.findUnique.mockResolvedValue(mockPet);
      mockPrismaService.appointment.findFirst.mockResolvedValue(null);
      mockPrismaService.blockedTime.findFirst.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue(mockStaff);
      mockPrismaService.staffSchedule.findMany.mockResolvedValue([mockSchedule]);
      mockPrismaService.staffLeave.findMany.mockResolvedValue([]);

      // Tuesday 14:00 - 15:00 Bangkok (07:00 - 08:00 UTC)
      const result = await service.validateBooking(mockTenantId, {
        branchId: mockBranch.id,
        petId: mockPet.id,
        staffId: mockStaff.id,
        startAt: '2026-08-25T07:00:00.000Z',
        endAt: '2026-08-25T08:00:00.000Z',
      });

      expect(result.isValid).toBe(true);
    });

    it('should return INVALID_TIME if startAt >= endAt', async () => {
      const result = await service.validateBooking(mockTenantId, {
        branchId: mockBranch.id,
        startAt: '2026-08-25T08:00:00.000Z',
        endAt: '2026-08-25T07:00:00.000Z',
      });

      expect(result.isValid).toBe(false);
      expect(result.conflictType).toBe('INVALID_TIME');
    });

    it('should throw ForbiddenException if branch belongs to another tenant', async () => {
      mockPrismaService.branch.findUnique.mockResolvedValue({
        ...mockBranch,
        tenantId: mockOtherTenantId,
      });

      await expect(
        service.validateBooking(mockTenantId, {
          branchId: mockBranch.id,
          startAt: '2026-08-25T07:00:00.000Z',
          endAt: '2026-08-25T08:00:00.000Z',
        })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return PET_DOUBLE_BOOKED if pet already has an active overlapping appointment', async () => {
      mockPrismaService.branch.findUnique.mockResolvedValue(mockBranch);
      mockPrismaService.pet.findUnique.mockResolvedValue(mockPet);
      mockPrismaService.appointment.findFirst.mockResolvedValue(mockExistingAppointment);

      const result = await service.validateBooking(mockTenantId, {
        branchId: mockBranch.id,
        petId: mockPet.id,
        startAt: '2026-08-25T03:30:00.000Z',
        endAt: '2026-08-25T04:30:00.000Z',
      });

      expect(result.isValid).toBe(false);
      expect(result.conflictType).toBe('PET_DOUBLE_BOOKED');
      expect(result.conflictingEntityId).toBe(mockExistingAppointment.id);
    });

    it('should return BLOCKED_SLOT if slot overlaps with a blocked time', async () => {
      mockPrismaService.branch.findUnique.mockResolvedValue(mockBranch);
      mockPrismaService.appointment.findFirst.mockResolvedValue(null);
      mockPrismaService.blockedTime.findFirst.mockResolvedValue({
        id: 'blk-1',
        title: 'ทำความสะอาดสปาประจำสัปดาห์',
      });

      const result = await service.validateBooking(mockTenantId, {
        branchId: mockBranch.id,
        startAt: '2026-08-25T07:00:00.000Z',
        endAt: '2026-08-25T08:00:00.000Z',
      });

      expect(result.isValid).toBe(false);
      expect(result.conflictType).toBe('BLOCKED_SLOT');
    });

    it('should return STAFF_UNAVAILABLE if staff has day off on requested day', async () => {
      mockPrismaService.branch.findUnique.mockResolvedValue(mockBranch);
      mockPrismaService.blockedTime.findFirst.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue(mockStaff);
      mockPrismaService.staffSchedule.findMany.mockResolvedValue([]); // No schedule on this day

      const result = await service.validateBooking(mockTenantId, {
        branchId: mockBranch.id,
        staffId: mockStaff.id,
        startAt: '2026-08-25T07:00:00.000Z',
        endAt: '2026-08-25T08:00:00.000Z',
      });

      expect(result.isValid).toBe(false);
      expect(result.conflictType).toBe('STAFF_UNAVAILABLE');
    });

    it('should return STAFF_ON_BREAK if requested time overlaps with staff break', async () => {
      mockPrismaService.branch.findUnique.mockResolvedValue(mockBranch);
      mockPrismaService.blockedTime.findFirst.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue(mockStaff);
      mockPrismaService.staffSchedule.findMany.mockResolvedValue([mockSchedule]);

      // Tuesday 12:30 - 13:30 Bangkok (05:30 - 06:30 UTC) -> Overlaps 12:00-13:00 Break!
      const result = await service.validateBooking(mockTenantId, {
        branchId: mockBranch.id,
        staffId: mockStaff.id,
        startAt: '2026-08-25T05:30:00.000Z',
        endAt: '2026-08-25T06:30:00.000Z',
      });

      expect(result.isValid).toBe(false);
      expect(result.conflictType).toBe('STAFF_ON_BREAK');
    });

    it('should return STAFF_ON_LEAVE if staff is on approved leave', async () => {
      mockPrismaService.branch.findUnique.mockResolvedValue(mockBranch);
      mockPrismaService.blockedTime.findFirst.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue(mockStaff);
      mockPrismaService.staffSchedule.findMany.mockResolvedValue([mockSchedule]);
      mockPrismaService.staffLeave.findMany.mockResolvedValue([
        {
          id: 'lev-1',
          leaveType: LeaveType.VACATION,
          status: LeaveStatus.APPROVED,
        },
      ]);

      const result = await service.validateBooking(mockTenantId, {
        branchId: mockBranch.id,
        staffId: mockStaff.id,
        startAt: '2026-08-25T07:00:00.000Z',
        endAt: '2026-08-25T08:00:00.000Z',
      });

      expect(result.isValid).toBe(false);
      expect(result.conflictType).toBe('STAFF_ON_LEAVE');
    });

    it('should return STAFF_DOUBLE_BOOKED if staff has another active appointment at the same time', async () => {
      mockPrismaService.branch.findUnique.mockResolvedValue(mockBranch);
      mockPrismaService.blockedTime.findFirst.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue(mockStaff);
      mockPrismaService.staffSchedule.findMany.mockResolvedValue([mockSchedule]);
      mockPrismaService.staffLeave.findMany.mockResolvedValue([]);
      // Mock appointment collision
      mockPrismaService.appointment.findFirst.mockResolvedValue(mockExistingAppointment);

      const result = await service.validateBooking(mockTenantId, {
        branchId: mockBranch.id,
        staffId: mockStaff.id,
        startAt: '2026-08-25T03:30:00.000Z',
        endAt: '2026-08-25T04:30:00.000Z',
      });

      expect(result.isValid).toBe(false);
      expect(result.conflictType).toBe('STAFF_DOUBLE_BOOKED');
    });
  });

  describe('findAvailableSlots', () => {
    it('should find available slots within shift excluding breaks and collisions', async () => {
      mockPrismaService.branch.findUnique.mockResolvedValue(mockBranch);
      mockPrismaService.user.findUnique.mockResolvedValue(mockStaff);
      mockPrismaService.staffSchedule.findMany.mockResolvedValue([mockSchedule]);
      mockPrismaService.blockedTime.findFirst.mockResolvedValue(null);
      mockPrismaService.staffLeave.findMany.mockResolvedValue([]);
      mockPrismaService.appointment.findFirst.mockResolvedValue(null);

      const slots = await service.findAvailableSlots(mockTenantId, {
        branchId: mockBranch.id,
        staffId: mockStaff.id,
        date: '2026-08-25',
        durationMinutes: 60,
      });

      expect(Array.isArray(slots)).toBe(true);
      expect(slots.length).toBeGreaterThan(0);
      expect(slots[0]).toHaveProperty('startAt');
      expect(slots[0]).toHaveProperty('endAt');
      expect(slots[0].staffId).toBe(mockStaff.id);
    });
  });
});
