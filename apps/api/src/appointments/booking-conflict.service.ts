import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ValidateBookingDto } from './dto/validate-booking.dto';
import { FindAvailableSlotsDto } from './dto/find-available-slots.dto';
import {
  AppointmentStatus,
  DayOfWeek,
  LeaveStatus,
  UserStatus,
} from '@prisma/client';
import {
  BookingValidationResult,
  AvailableSlot,
} from '@petflow/types';

@Injectable()
export class BookingConflictService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper: Maps a JS Date in Bangkok timezone (UTC+7) to Prisma DayOfWeek enum
   */
  private getDayOfWeek(date: Date): DayOfWeek {
    const bangkokTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    const days: DayOfWeek[] = [
      DayOfWeek.SUNDAY,
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ];
    return days[bangkokTime.getUTCDay()];
  }

  /**
   * Helper: Formats a JS Date to "HH:mm" string in Bangkok timezone (UTC+7)
   */
  private getTimeString(date: Date): string {
    const bangkokTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    const hours = String(bangkokTime.getUTCHours()).padStart(2, '0');
    const minutes = String(bangkokTime.getUTCMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Helper: Parses "YYYY-MM-DD" and "HH:mm" in Bangkok timezone (UTC+7) to a UTC Date object
   */
  private parseBangkokDateTime(dateStr: string, timeStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    // UTC time = Bangkok time - 7 hours
    return new Date(Date.UTC(year, month - 1, day, hours - 7, minutes, 0, 0));
  }

  /**
   * Core Engine: Validates whether an appointment slot is valid and collision-free
   */
  async validateBooking(
    tenantId: string,
    dto: ValidateBookingDto
  ): Promise<BookingValidationResult> {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);

    // 1. Time boundary check
    if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) {
      return {
        isValid: false,
        conflictType: 'INVALID_TIME',
        conflictReason: 'รูปแบบวันเวลาไม่ถูกต้อง',
      };
    }

    if (startAt.getTime() >= endAt.getTime()) {
      return {
        isValid: false,
        conflictType: 'INVALID_TIME',
        conflictReason: 'เวลาเริ่มต้นต้องมาก่อนเวลาสิ้นสุด',
      };
    }

    // 2. Branch validity check
    const branch = await this.prisma.branch.findUnique({
      where: { id: dto.branchId },
    });

    if (!branch) {
      throw new NotFoundException(`Branch with ID '${dto.branchId}' not found`);
    }

    if (branch.tenantId !== tenantId) {
      throw new ForbiddenException(
        'Access denied: Branch does not belong to your organization'
      );
    }

    if (!branch.isActive) {
      return {
        isValid: false,
        conflictType: 'BRANCH_UNAVAILABLE',
        conflictReason: 'สาขาถูกปิดใช้งานชั่วคราว',
      };
    }

    // 3. Pet collision check (Double booking prevention for the same pet)
    if (dto.petId) {
      const pet = await this.prisma.pet.findUnique({
        where: { id: dto.petId },
      });

      if (!pet) {
        throw new NotFoundException(`Pet with ID '${dto.petId}' not found`);
      }

      if (pet.tenantId !== tenantId) {
        throw new ForbiddenException(
          'Access denied: Pet does not belong to your organization'
        );
      }

      const overlappingPetAppointment =
        await this.prisma.appointment.findFirst({
          where: {
            tenantId,
            petId: dto.petId,
            id: dto.excludeAppointmentId ? { not: dto.excludeAppointmentId } : undefined,
            status: {
              notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
            },
            startAt: { lt: endAt },
            endAt: { gt: startAt },
          },
        });

      if (overlappingPetAppointment) {
        return {
          isValid: false,
          conflictType: 'PET_DOUBLE_BOOKED',
          conflictReason: 'สัตว์เลี้ยงมีนัดหมายอื่นในช่วงเวลานี้อยู่แล้ว',
          conflictingEntityId: overlappingPetAppointment.id,
        };
      }
    }

    // 4. Blocked Time Collision (Branch-wide or Staff-specific)
    const overlappingBlockedTime = await this.prisma.blockedTime.findFirst({
      where: {
        tenantId,
        OR: [
          { branchId: dto.branchId },
          { branchId: null },
        ],
        AND: [
          dto.staffId
            ? {
                OR: [
                  { userId: dto.staffId },
                  { userId: null },
                ],
              }
            : { userId: null },
        ],
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
    });

    if (overlappingBlockedTime) {
      return {
        isValid: false,
        conflictType: 'BLOCKED_SLOT',
        conflictReason: `ช่วงเวลาถูกปิดกั้น: ${overlappingBlockedTime.title}`,
        conflictingEntityId: overlappingBlockedTime.id,
      };
    }

    // 5. Staff Availability & Conflict Check
    if (dto.staffId) {
      const staff = await this.prisma.user.findUnique({
        where: { id: dto.staffId },
        include: {
          staffProfile: true,
          userBranches: true,
        },
      });

      if (!staff) {
        throw new NotFoundException(`Staff with ID '${dto.staffId}' not found`);
      }

      if (staff.tenantId !== tenantId) {
        throw new ForbiddenException(
          'Access denied: Staff does not belong to your organization'
        );
      }

      if (
        staff.status !== UserStatus.ACTIVE ||
        (staff.staffProfile && !staff.staffProfile.isBookable)
      ) {
        return {
          isValid: false,
          conflictType: 'STAFF_UNAVAILABLE',
          conflictReason: 'พนักงานไม่พร้อมรับนัดหมาย หรือถูกปิดการจอง',
        };
      }

      // Check if staff is assigned to this branch
      const isAssignedToBranch = staff.userBranches.some(
        (ub) => ub.branchId === dto.branchId
      );
      if (!isAssignedToBranch && staff.userBranches.length > 0) {
        return {
          isValid: false,
          conflictType: 'STAFF_UNAVAILABLE',
          conflictReason: 'พนักงานไม่ได้ประจำอยู่ที่สาขานี้',
        };
      }

      // Check working hours and shift schedule
      const dayOfWeek = this.getDayOfWeek(startAt);
      const startTimeStr = this.getTimeString(startAt);
      const endTimeStr = this.getTimeString(endAt);

      const schedules = await this.prisma.staffSchedule.findMany({
        where: {
          tenantId,
          userId: dto.staffId,
          dayOfWeek,
          isActive: true,
          OR: [
            { branchId: dto.branchId },
            { branchId: null },
          ],
        },
      });

      if (schedules.length === 0) {
        return {
          isValid: false,
          conflictType: 'STAFF_UNAVAILABLE',
          conflictReason: 'พนักงานไม่มีกะทำงานในวันที่ระบุ (วันหยุดประจำสัปดาห์)',
        };
      }

      const activeSchedule = schedules[0];

      // Outside shift working hours
      if (
        startTimeStr < activeSchedule.startTime ||
        endTimeStr > activeSchedule.endTime
      ) {
        return {
          isValid: false,
          conflictType: 'STAFF_UNAVAILABLE',
          conflictReason: `อยู่นอกเวลาทำงานของพนักงาน (${activeSchedule.startTime} - ${activeSchedule.endTime})`,
        };
      }

      // Break overlap check
      if (activeSchedule.breakStartTime && activeSchedule.breakEndTime) {
        const hasBreakOverlap =
          startTimeStr < activeSchedule.breakEndTime &&
          endTimeStr > activeSchedule.breakStartTime;

        if (hasBreakOverlap) {
          return {
            isValid: false,
            conflictType: 'STAFF_ON_BREAK',
            conflictReason: `ตรงกับเวลาพักของพนักงาน (${activeSchedule.breakStartTime} - ${activeSchedule.breakEndTime})`,
          };
        }
      }

      // Staff Leave Check
      const staffLeaves = await this.prisma.staffLeave.findMany({
        where: {
          tenantId,
          userId: dto.staffId,
          status: {
            in: [LeaveStatus.APPROVED, LeaveStatus.PENDING],
          },
          startDate: { lte: endAt },
          endDate: { gte: startAt },
        },
      });

      if (staffLeaves.length > 0) {
        const leave = staffLeaves[0];
        return {
          isValid: false,
          conflictType: 'STAFF_ON_LEAVE',
          conflictReason: `พนักงานอยู่ในช่วงลางาน (${leave.leaveType})`,
          conflictingEntityId: leave.id,
        };
      }

      // Existing Appointments Collision Check (+ buffer time)
      const bufferMinutes = dto.bufferMinutes ?? 0;
      const bufferMs = bufferMinutes * 60 * 1000;
      const effectiveStart = new Date(startAt.getTime() - bufferMs);
      const effectiveEnd = new Date(endAt.getTime() + bufferMs);

      const overlappingStaffAppointment =
        await this.prisma.appointment.findFirst({
          where: {
            tenantId,
            staffId: dto.staffId,
            id: dto.excludeAppointmentId
              ? { not: dto.excludeAppointmentId }
              : undefined,
            status: {
              notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
            },
            startAt: { lt: effectiveEnd },
            endAt: { gt: effectiveStart },
          },
        });

      if (overlappingStaffAppointment) {
        return {
          isValid: false,
          conflictType: 'STAFF_DOUBLE_BOOKED',
          conflictReason: 'พนักงานมีนัดหมายอื่นที่ทับซ้อนในช่วงเวลานี้',
          conflictingEntityId: overlappingStaffAppointment.id,
        };
      }
    }

    return {
      isValid: true,
    };
  }

  /**
   * Slot Finder: Computes all available, conflict-free booking slots for a branch & date
   */
  async findAvailableSlots(
    tenantId: string,
    dto: FindAvailableSlotsDto
  ): Promise<AvailableSlot[]> {
    const branch = await this.prisma.branch.findUnique({
      where: { id: dto.branchId },
    });

    if (!branch || branch.tenantId !== tenantId) {
      throw new ForbiddenException(
        'Access denied: Branch does not belong to your organization'
      );
    }

    const durationMinutes = dto.durationMinutes ?? 60;
    const bufferMinutes = dto.bufferMinutes ?? 0;

    // 1. Resolve staff to check
    let targetStaffIds: { id: string; name: string }[] = [];

    if (dto.staffId) {
      const staff = await this.prisma.user.findUnique({
        where: { id: dto.staffId },
        include: { staffProfile: true },
      });
      if (staff && staff.tenantId === tenantId && staff.status === UserStatus.ACTIVE) {
        targetStaffIds = [
          {
            id: staff.id,
            name: `${staff.firstName} ${staff.lastName}`.trim(),
          },
        ];
      }
    } else {
      // Find all bookable active staff in this branch
      const staffInBranch = await this.prisma.user.findMany({
        where: {
          tenantId,
          status: UserStatus.ACTIVE,
          staffProfile: {
            is: {
              isBookable: true,
            },
          },
          userBranches: {
            some: {
              branchId: dto.branchId,
            },
          },
        },
      });

      targetStaffIds = staffInBranch.map((s) => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`.trim(),
      }));
    }

    const availableSlots: AvailableSlot[] = [];

    // 2. Iterate for each staff member on this date
    for (const staff of targetStaffIds) {
      // Find staff schedule for the day
      const sampleDate = this.parseBangkokDateTime(dto.date, '09:00');
      const dayOfWeek = this.getDayOfWeek(sampleDate);

      const schedules = await this.prisma.staffSchedule.findMany({
        where: {
          tenantId,
          userId: staff.id,
          dayOfWeek,
          isActive: true,
          OR: [
            { branchId: dto.branchId },
            { branchId: null },
          ],
        },
      });

      if (schedules.length === 0) continue;

      const schedule = schedules[0];
      const [startHour, startMin] = schedule.startTime.split(':').map(Number);
      const [endHour, endMin] = schedule.endTime.split(':').map(Number);

      const shiftStartMinutes = startHour * 60 + startMin;
      const shiftEndMinutes = endHour * 60 + endMin;

      // Scan in 30-minute intervals
      const stepMinutes = 30;

      for (
        let currentMin = shiftStartMinutes;
        currentMin + durationMinutes <= shiftEndMinutes;
        currentMin += stepMinutes
      ) {
        const slotStartHours = Math.floor(currentMin / 60);
        const slotStartMins = currentMin % 60;
        const slotEndMinutesTotal = currentMin + durationMinutes;
        const slotEndHours = Math.floor(slotEndMinutesTotal / 60);
        const slotEndMins = slotEndMinutesTotal % 60;

        const slotStartTimeStr = `${String(slotStartHours).padStart(2, '0')}:${String(slotStartMins).padStart(2, '0')}`;
        const slotEndTimeStr = `${String(slotEndHours).padStart(2, '0')}:${String(slotEndMins).padStart(2, '0')}`;

        const slotStartAt = this.parseBangkokDateTime(dto.date, slotStartTimeStr);
        const slotEndAt = this.parseBangkokDateTime(dto.date, slotEndTimeStr);

        const validation = await this.validateBooking(tenantId, {
          branchId: dto.branchId,
          staffId: staff.id,
          serviceId: dto.serviceId,
          startAt: slotStartAt.toISOString(),
          endAt: slotEndAt.toISOString(),
          bufferMinutes,
        });

        if (validation.isValid) {
          availableSlots.push({
            startAt: slotStartAt.toISOString(),
            endAt: slotEndAt.toISOString(),
            staffId: staff.id,
            staffName: staff.name,
          });
        }
      }
    }

    return availableSlots;
  }
}
