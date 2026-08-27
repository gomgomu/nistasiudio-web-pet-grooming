import { Test, TestingModule } from '@nestjs/testing';
import { SchedulesService } from './schedules.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DayOfWeek, LeaveStatus, LeaveType, UserStatus } from '@prisma/client';

describe('SchedulesService', () => {
  let service: SchedulesService;
  let prisma: PrismaService;

  const mockTenantId = 't1111111-1111-4111-a111-111111111111';
  const mockOtherTenantId = 't2222222-2222-4222-a222-222222222222';

  const mockBranch = {
    id: 'b1111111-1111-4111-a111-111111111111',
    tenantId: mockTenantId,
    name: 'สาขาทองหล่อ',
    code: 'TL01',
  };

  const mockUser = {
    id: 'u1111111-1111-4111-a111-111111111111',
    tenantId: mockTenantId,
    email: 'vet.somchai@petflow.test',
    firstName: 'สมชาย',
    lastName: 'สัตวแพทย์',
    status: UserStatus.ACTIVE,
    staffProfile: {
      isBookable: true,
      nickname: 'หมอสมชาย',
    },
  };

  const mockScheduleItem = {
    id: 'sch-1111-1111-1111-111111111111',
    tenantId: mockTenantId,
    userId: mockUser.id,
    branchId: mockBranch.id,
    dayOfWeek: DayOfWeek.TUESDAY,
    startTime: '09:00',
    endTime: '18:00',
    breakStartTime: '12:00',
    breakEndTime: '13:00',
    isActive: true,
    branch: mockBranch,
  };

  const mockLeave = {
    id: 'lev-1111-1111-1111-111111111111',
    tenantId: mockTenantId,
    userId: mockUser.id,
    leaveType: LeaveType.VACATION,
    status: LeaveStatus.APPROVED,
    startDate: new Date('2026-09-01'),
    endDate: new Date('2026-09-03'),
    reason: 'พักร้อนประจำปี',
    user: mockUser,
  };

  const mockBlockedTime = {
    id: 'blk-1111-1111-1111-111111111111',
    tenantId: mockTenantId,
    branchId: mockBranch.id,
    userId: mockUser.id,
    title: 'อบรมมาตรฐานความปลอดภัยคลินิก',
    startAt: new Date('2026-09-01T14:00:00.000Z'),
    endAt: new Date('2026-09-01T16:00:00.000Z'),
    isAllDay: false,
    notes: null,
  };

  const mockPrismaService: any = {
    user: {
      findUnique: jest.fn(),
    },
    branch: {
      findUnique: jest.fn(),
    },
    staffSchedule: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    staffLeave: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    blockedTime: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn((callbackOrArray: any): Promise<any> => {
      if (typeof callbackOrArray === 'function') {
        return callbackOrArray(mockPrismaService);
      }
      return Promise.all(callbackOrArray);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SchedulesService>(SchedulesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Weekly Schedules Tests
  // ---------------------------------------------------------------------------

  describe('getStaffSchedule', () => {
    it('should return staff weekly schedule list', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.staffSchedule.findMany.mockResolvedValue([mockScheduleItem]);

      const result = await service.getStaffSchedule(mockUser.id, mockTenantId);
      expect(result).toEqual([mockScheduleItem]);
    });

    it('should throw ForbiddenException if user belongs to another tenant', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        tenantId: mockOtherTenantId,
      });

      await expect(
        service.getStaffSchedule(mockUser.id, mockTenantId)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('upsertStaffSchedule', () => {
    it('should upsert weekly schedule and break items successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.branch.findUnique.mockResolvedValue(mockBranch);
      mockPrismaService.staffSchedule.findMany.mockResolvedValue([mockScheduleItem]);

      const result = await service.upsertStaffSchedule(mockUser.id, mockTenantId, {
        schedules: [
          {
            dayOfWeek: DayOfWeek.TUESDAY,
            startTime: '09:00',
            endTime: '18:00',
            breakStartTime: '12:00',
            breakEndTime: '13:00',
            branchId: mockBranch.id,
            isActive: true,
          },
        ],
      });

      expect(result).toEqual([mockScheduleItem]);
      expect(mockPrismaService.staffSchedule.deleteMany).toHaveBeenCalled();
      expect(mockPrismaService.staffSchedule.createMany).toHaveBeenCalled();
    });

    it('should throw BadRequestException if startTime is after or equal to endTime', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.upsertStaffSchedule(mockUser.id, mockTenantId, {
          schedules: [
            {
              dayOfWeek: DayOfWeek.MONDAY,
              startTime: '18:00',
              endTime: '09:00',
            },
          ],
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if break is outside shift hours', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.upsertStaffSchedule(mockUser.id, mockTenantId, {
          schedules: [
            {
              dayOfWeek: DayOfWeek.MONDAY,
              startTime: '09:00',
              endTime: '17:00',
              breakStartTime: '18:00',
              breakEndTime: '19:00',
            },
          ],
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ---------------------------------------------------------------------------
  // Staff Leaves Tests
  // ---------------------------------------------------------------------------

  describe('createLeave', () => {
    it('should create leave successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.staffLeave.create.mockResolvedValue(mockLeave);

      const result = await service.createLeave(mockTenantId, {
        userId: mockUser.id,
        leaveType: LeaveType.VACATION,
        startDate: '2026-09-01',
        endDate: '2026-09-03',
        reason: 'พักร้อนประจำปี',
      });

      expect(result).toEqual(mockLeave);
      expect(mockPrismaService.staffLeave.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if startDate is after endDate', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.createLeave(mockTenantId, {
          userId: mockUser.id,
          leaveType: LeaveType.VACATION,
          startDate: '2026-09-05',
          endDate: '2026-09-01',
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAllLeaves', () => {
    it('should list all leaves for tenant', async () => {
      mockPrismaService.staffLeave.findMany.mockResolvedValue([mockLeave]);

      const result = await service.findAllLeaves(mockTenantId, {
        userId: mockUser.id,
        status: LeaveStatus.APPROVED,
      });

      expect(result).toEqual([mockLeave]);
    });
  });

  describe('deleteLeave', () => {
    it('should delete leave record successfully', async () => {
      mockPrismaService.staffLeave.findUnique.mockResolvedValue(mockLeave);
      mockPrismaService.staffLeave.delete.mockResolvedValue(mockLeave);

      const result = await service.deleteLeave(mockLeave.id, mockTenantId);
      expect(result).toEqual({ message: 'Staff leave record deleted successfully' });
    });
  });

  // ---------------------------------------------------------------------------
  // Blocked Time Tests
  // ---------------------------------------------------------------------------

  describe('createBlockedTime', () => {
    it('should create blocked time successfully', async () => {
      mockPrismaService.branch.findUnique.mockResolvedValue(mockBranch);
      mockPrismaService.blockedTime.create.mockResolvedValue(mockBlockedTime);

      const result = await service.createBlockedTime(mockTenantId, {
        title: 'อบรมมาตรฐานความปลอดภัยคลินิก',
        startAt: '2026-09-01T14:00:00.000Z',
        endAt: '2026-09-01T16:00:00.000Z',
        branchId: mockBranch.id,
      });

      expect(result).toEqual(mockBlockedTime);
    });

    it('should throw BadRequestException if startAt >= endAt', async () => {
      await expect(
        service.createBlockedTime(mockTenantId, {
          title: 'Invalid times',
          startAt: '2026-09-01T16:00:00.000Z',
          endAt: '2026-09-01T14:00:00.000Z',
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ---------------------------------------------------------------------------
  // Availability Engine Tests
  // ---------------------------------------------------------------------------

  describe('checkStaffAvailability', () => {
    it('should return available: true when within working hours and no collisions', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      // Tuesday 10:00 to 11:00 UTC (17:00 to 18:00 Bangkok)
      mockPrismaService.staffSchedule.findMany.mockResolvedValue([
        {
          ...mockScheduleItem,
          startTime: '09:00',
          endTime: '19:00',
          breakStartTime: '12:00',
          breakEndTime: '13:00',
        },
      ]);
      mockPrismaService.staffLeave.findMany.mockResolvedValue([]);
      mockPrismaService.blockedTime.findMany.mockResolvedValue([]);

      const result = await service.checkStaffAvailability(mockTenantId, {
        userId: mockUser.id,
        branchId: mockBranch.id,
        startAt: '2026-08-25T03:00:00.000Z', // 10:00 Bangkok (Tuesday)
        endAt: '2026-08-25T04:00:00.000Z',   // 11:00 Bangkok (Tuesday)
      });

      expect(result.available).toBe(true);
    });

    it('should return DAY_OFF if staff has no schedule on requested day', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.staffSchedule.findMany.mockResolvedValue([]);

      const result = await service.checkStaffAvailability(mockTenantId, {
        userId: mockUser.id,
        startAt: '2026-08-25T03:00:00.000Z',
        endAt: '2026-08-25T04:00:00.000Z',
      });

      expect(result.available).toBe(false);
      expect(result.reason).toBe('DAY_OFF');
    });

    it('should return ON_BREAK if requested time overlaps with staff break', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.staffSchedule.findMany.mockResolvedValue([
        {
          ...mockScheduleItem,
          startTime: '09:00',
          endTime: '18:00',
          breakStartTime: '12:00',
          breakEndTime: '13:00',
        },
      ]);

      const result = await service.checkStaffAvailability(mockTenantId, {
        userId: mockUser.id,
        startAt: '2026-08-25T05:30:00.000Z', // 12:30 Bangkok (Break!)
        endAt: '2026-08-25T06:30:00.000Z',   // 13:30 Bangkok
      });

      expect(result.available).toBe(false);
      expect(result.reason).toBe('ON_BREAK');
    });

    it('should return ON_LEAVE if staff is on leave', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.staffSchedule.findMany.mockResolvedValue([mockScheduleItem]);
      mockPrismaService.staffLeave.findMany.mockResolvedValue([mockLeave]);

      const result = await service.checkStaffAvailability(mockTenantId, {
        userId: mockUser.id,
        startAt: '2026-08-25T03:00:00.000Z',
        endAt: '2026-08-25T04:00:00.000Z',
      });

      expect(result.available).toBe(false);
      expect(result.reason).toBe('ON_LEAVE');
    });

    it('should return BLOCKED_TIME if slot is blocked', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.staffSchedule.findMany.mockResolvedValue([mockScheduleItem]);
      mockPrismaService.staffLeave.findMany.mockResolvedValue([]);
      mockPrismaService.blockedTime.findMany.mockResolvedValue([mockBlockedTime]);

      const result = await service.checkStaffAvailability(mockTenantId, {
        userId: mockUser.id,
        startAt: '2026-08-25T03:00:00.000Z',
        endAt: '2026-08-25T04:00:00.000Z',
      });

      expect(result.available).toBe(false);
      expect(result.reason).toBe('BLOCKED_TIME');
    });
  });
});
