import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  BatchUpsertScheduleDto,
  ScheduleItemDto,
} from './dto/upsert-schedule.dto';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';
import { CreateBlockedTimeDto } from './dto/create-blocked-time.dto';
import { UpdateBlockedTimeDto } from './dto/update-blocked-time.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { DayOfWeek, LeaveStatus, Prisma, UserStatus } from '@prisma/client';

const DAY_OF_WEEK_NAMES: DayOfWeek[] = [
  DayOfWeek.SUNDAY,
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
];

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Helper: Verify User & Branch Tenant Scope
  // ---------------------------------------------------------------------------

  private async verifyUserInTenant(userId: string, tenantId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { staffProfile: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found`);
    }

    if (user.tenantId !== tenantId) {
      throw new ForbiddenException(
        'Access denied: User does not belong to your organization'
      );
    }

    return user;
  }

  private async verifyBranchInTenant(branchId: string, tenantId: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
    });

    if (!branch) {
      throw new NotFoundException(`Branch with ID '${branchId}' not found`);
    }

    if (branch.tenantId !== tenantId) {
      throw new ForbiddenException(
        'Access denied: Branch does not belong to your organization'
      );
    }

    return branch;
  }

  // ---------------------------------------------------------------------------
  // Weekly Staff Schedules
  // ---------------------------------------------------------------------------

  async getStaffSchedule(userId: string, tenantId: string) {
    await this.verifyUserInTenant(userId, tenantId);

    return this.prisma.staffSchedule.findMany({
      where: { userId, tenantId },
      orderBy: { dayOfWeek: 'asc' },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  }

  async upsertStaffSchedule(
    userId: string,
    tenantId: string,
    dto: BatchUpsertScheduleDto
  ) {
    await this.verifyUserInTenant(userId, tenantId);

    // Validate shift times and break times
    for (const item of dto.schedules) {
      if (item.startTime >= item.endTime) {
        throw new BadRequestException(
          `Invalid shift on ${item.dayOfWeek}: startTime (${item.startTime}) must be before endTime (${item.endTime})`
        );
      }

      if (item.breakStartTime && item.breakEndTime) {
        if (item.breakStartTime >= item.breakEndTime) {
          throw new BadRequestException(
            `Invalid break on ${item.dayOfWeek}: breakStartTime (${item.breakStartTime}) must be before breakEndTime (${item.breakEndTime})`
          );
        }
        if (
          item.breakStartTime < item.startTime ||
          item.breakEndTime > item.endTime
        ) {
          throw new BadRequestException(
            `Invalid break on ${item.dayOfWeek}: break must be within shift hours (${item.startTime} - ${item.endTime})`
          );
        }
      }

      if (item.branchId) {
        await this.verifyBranchInTenant(item.branchId, tenantId);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.staffSchedule.deleteMany({
        where: { userId, tenantId },
      });

      if (dto.schedules.length > 0) {
        await tx.staffSchedule.createMany({
          data: dto.schedules.map((item) => ({
            tenantId,
            userId,
            branchId: item.branchId,
            dayOfWeek: item.dayOfWeek,
            startTime: item.startTime,
            endTime: item.endTime,
            breakStartTime: item.breakStartTime,
            breakEndTime: item.breakEndTime,
            isActive: item.isActive !== undefined ? item.isActive : true,
          })),
        });
      }

      return tx.staffSchedule.findMany({
        where: { userId, tenantId },
        orderBy: { dayOfWeek: 'asc' },
        include: {
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Staff Leaves
  // ---------------------------------------------------------------------------

  async createLeave(tenantId: string, dto: CreateLeaveDto) {
    await this.verifyUserInTenant(dto.userId, tenantId);

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate > endDate) {
      throw new BadRequestException('startDate cannot be after endDate');
    }

    return this.prisma.staffLeave.create({
      data: {
        tenantId,
        userId: dto.userId,
        leaveType: dto.leaveType,
        status: dto.status ?? LeaveStatus.APPROVED,
        startDate,
        endDate,
        reason: dto.reason?.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            staffProfile: true,
          },
        },
      },
    });
  }

  async findAllLeaves(
    tenantId: string,
    query?: { userId?: string; status?: LeaveStatus }
  ) {
    const where: Prisma.StaffLeaveWhereInput = {
      tenantId,
    };

    if (query?.userId) {
      where.userId = query.userId;
    }

    if (query?.status) {
      where.status = query.status;
    }

    return this.prisma.staffLeave.findMany({
      where,
      orderBy: { startDate: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            staffProfile: true,
          },
        },
      },
    });
  }

  async findLeaveById(id: string, tenantId: string) {
    const leave = await this.prisma.staffLeave.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            staffProfile: true,
          },
        },
      },
    });

    if (!leave) {
      throw new NotFoundException(`Staff leave with ID '${id}' not found`);
    }

    if (leave.tenantId !== tenantId) {
      throw new ForbiddenException(
        'Access denied: Staff leave does not belong to your organization'
      );
    }

    return leave;
  }

  async updateLeave(id: string, tenantId: string, dto: UpdateLeaveDto) {
    const existing = await this.findLeaveById(id, tenantId);

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (dto.startDate) startDate = new Date(dto.startDate);
    if (dto.endDate) endDate = new Date(dto.endDate);

    const finalStart = startDate || existing.startDate;
    const finalEnd = endDate || existing.endDate;

    if (finalStart > finalEnd) {
      throw new BadRequestException('startDate cannot be after endDate');
    }

    return this.prisma.staffLeave.update({
      where: { id },
      data: {
        leaveType: dto.leaveType,
        status: dto.status,
        startDate,
        endDate,
        reason: dto.reason !== undefined ? dto.reason.trim() : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async deleteLeave(id: string, tenantId: string) {
    await this.findLeaveById(id, tenantId);

    await this.prisma.staffLeave.delete({
      where: { id },
    });

    return { message: 'Staff leave record deleted successfully' };
  }

  // ---------------------------------------------------------------------------
  // Blocked Times
  // ---------------------------------------------------------------------------

  async createBlockedTime(tenantId: string, dto: CreateBlockedTimeDto) {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);

    if (startAt >= endAt) {
      throw new BadRequestException('startAt must be before endAt');
    }

    if (dto.userId) {
      await this.verifyUserInTenant(dto.userId, tenantId);
    }

    if (dto.branchId) {
      await this.verifyBranchInTenant(dto.branchId, tenantId);
    }

    return this.prisma.blockedTime.create({
      data: {
        tenantId,
        branchId: dto.branchId,
        userId: dto.userId,
        title: dto.title.trim(),
        startAt,
        endAt,
        isAllDay: dto.isAllDay ?? false,
        notes: dto.notes?.trim(),
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async findAllBlockedTimes(
    tenantId: string,
    query?: { branchId?: string; userId?: string }
  ) {
    const where: Prisma.BlockedTimeWhereInput = {
      tenantId,
    };

    if (query?.branchId) {
      where.branchId = query.branchId;
    }

    if (query?.userId) {
      where.userId = query.userId;
    }

    return this.prisma.blockedTime.findMany({
      where,
      orderBy: { startAt: 'asc' },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async findBlockedTimeById(id: string, tenantId: string) {
    const item = await this.prisma.blockedTime.findUnique({
      where: { id },
      include: {
        branch: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`Blocked time with ID '${id}' not found`);
    }

    if (item.tenantId !== tenantId) {
      throw new ForbiddenException(
        'Access denied: Blocked time does not belong to your organization'
      );
    }

    return item;
  }

  async updateBlockedTime(
    id: string,
    tenantId: string,
    dto: UpdateBlockedTimeDto
  ) {
    const existing = await this.findBlockedTimeById(id, tenantId);

    const startAt = dto.startAt ? new Date(dto.startAt) : existing.startAt;
    const endAt = dto.endAt ? new Date(dto.endAt) : existing.endAt;

    if (startAt >= endAt) {
      throw new BadRequestException('startAt must be before endAt');
    }

    if (dto.userId) {
      await this.verifyUserInTenant(dto.userId, tenantId);
    }

    if (dto.branchId) {
      await this.verifyBranchInTenant(dto.branchId, tenantId);
    }

    return this.prisma.blockedTime.update({
      where: { id },
      data: {
        title: dto.title !== undefined ? dto.title.trim() : undefined,
        startAt: dto.startAt ? startAt : undefined,
        endAt: dto.endAt ? endAt : undefined,
        isAllDay: dto.isAllDay !== undefined ? dto.isAllDay : undefined,
        branchId: dto.branchId !== undefined ? dto.branchId : undefined,
        userId: dto.userId !== undefined ? dto.userId : undefined,
        notes: dto.notes !== undefined ? dto.notes?.trim() : undefined,
      },
      include: {
        branch: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async deleteBlockedTime(id: string, tenantId: string) {
    await this.findBlockedTimeById(id, tenantId);

    await this.prisma.blockedTime.delete({
      where: { id },
    });

    return { message: 'Blocked time deleted successfully' };
  }

  // ---------------------------------------------------------------------------
  // Staff Availability Engine
  // ---------------------------------------------------------------------------

  async checkStaffAvailability(tenantId: string, dto: CheckAvailabilityDto) {
    const user = await this.verifyUserInTenant(dto.userId, tenantId);

    if (user.status !== UserStatus.ACTIVE) {
      return {
        available: false,
        reason: 'USER_INACTIVE',
        message: 'Staff user is inactive',
      };
    }

    if (user.staffProfile && !user.staffProfile.isBookable) {
      return {
        available: false,
        reason: 'NOT_BOOKABLE',
        message: 'Staff is marked as not bookable',
      };
    }

    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);

    if (startAt >= endAt) {
      throw new BadRequestException('startAt must be before endAt');
    }

    // Convert startAt to Bangkok timezone for day of week & time comparison
    // UTC+7 = 7 * 60 minutes
    const bangkokStart = new Date(startAt.getTime() + 7 * 60 * 60 * 1000);
    const dayOfWeekIndex = bangkokStart.getUTCDay(); // 0 = Sunday, 1 = Monday ...
    const dayOfWeek = DAY_OF_WEEK_NAMES[dayOfWeekIndex];

    const startHours = String(bangkokStart.getUTCHours()).padStart(2, '0');
    const startMins = String(bangkokStart.getUTCMinutes()).padStart(2, '0');
    const startTimeStr = `${startHours}:${startMins}`;

    const bangkokEnd = new Date(endAt.getTime() + 7 * 60 * 60 * 1000);
    const endHours = String(bangkokEnd.getUTCHours()).padStart(2, '0');
    const endMins = String(bangkokEnd.getUTCMinutes()).padStart(2, '0');
    const endTimeStr = `${endHours}:${endMins}`;

    // 1. Check Weekly Schedule
    const schedules = await this.prisma.staffSchedule.findMany({
      where: {
        tenantId,
        userId: dto.userId,
        dayOfWeek,
        isActive: true,
        ...(dto.branchId ? { OR: [{ branchId: dto.branchId }, { branchId: null }] } : {}),
      },
    });

    if (schedules.length === 0) {
      return {
        available: false,
        reason: 'DAY_OFF',
        message: `Staff does not work on ${dayOfWeek}`,
      };
    }

    // Find any schedule matching shift hours
    const coveringSchedule = schedules.find(
      (s) => s.startTime <= startTimeStr && s.endTime >= endTimeStr
    );

    if (!coveringSchedule) {
      return {
        available: false,
        reason: 'OUTSIDE_WORKING_HOURS',
        message: `Requested time (${startTimeStr} - ${endTimeStr}) is outside staff working shift`,
      };
    }

    // Check Break Time Collision
    if (
      coveringSchedule.breakStartTime &&
      coveringSchedule.breakEndTime
    ) {
      const bStart = coveringSchedule.breakStartTime;
      const bEnd = coveringSchedule.breakEndTime;

      // Overlap condition: startTimeStr < bEnd && endTimeStr > bStart
      if (startTimeStr < bEnd && endTimeStr > bStart) {
        return {
          available: false,
          reason: 'ON_BREAK',
          message: `Requested time overlaps with staff break (${bStart} - ${bEnd})`,
        };
      }
    }

    // 2. Check Staff Leaves
    const requestedDateOnly = new Date(
      Date.UTC(
        bangkokStart.getUTCFullYear(),
        bangkokStart.getUTCMonth(),
        bangkokStart.getUTCDate()
      )
    );

    const activeLeaves = await this.prisma.staffLeave.findMany({
      where: {
        tenantId,
        userId: dto.userId,
        status: LeaveStatus.APPROVED,
        startDate: { lte: requestedDateOnly },
        endDate: { gte: requestedDateOnly },
      },
    });

    if (activeLeaves.length > 0) {
      return {
        available: false,
        reason: 'ON_LEAVE',
        message: `Staff is on leave (${activeLeaves[0].leaveType}): ${activeLeaves[0].reason || 'Approved leave'}`,
      };
    }

    // 3. Check Blocked Times (Staff-specific or Branch-specific)
    const blocked = await this.prisma.blockedTime.findMany({
      where: {
        tenantId,
        OR: [
          { userId: dto.userId },
          ...(dto.branchId ? [{ branchId: dto.branchId }] : []),
        ],
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
    });

    if (blocked.length > 0) {
      return {
        available: false,
        reason: 'BLOCKED_TIME',
        message: `Time slot is blocked: ${blocked[0].title}`,
      };
    }

    return {
      available: true,
      message: 'Staff is available for booking',
    };
  }
}
