import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingConflictService } from './booking-conflict.service';
import { ServicesService } from '../services/services.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { QueryAppointmentDto } from './dto/query-appointment.dto';
import { AppointmentStatus, AppointmentSource, Prisma } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bookingConflictService: BookingConflictService,
    private readonly servicesService: ServicesService
  ) {}

  /**
   * Helper: Serializes BigInt priceMinor fields to Numbers for JSON responses
   */
  private serializeAppointment(appointment: any) {
    if (!appointment) return null;
    return {
      ...appointment,
      priceMinor: appointment.priceMinor ? Number(appointment.priceMinor) : null,
      service: appointment.service
        ? {
            ...appointment.service,
            basePriceMinor:
              appointment.service.basePriceMinor !== undefined
                ? Number(appointment.service.basePriceMinor)
                : appointment.service.priceMinor !== undefined
                ? Number(appointment.service.priceMinor)
                : undefined,
          }
        : undefined,
      pet: appointment.pet
        ? {
            ...appointment.pet,
            weight: appointment.pet.weight ? Number(appointment.pet.weight) : null,
          }
        : undefined,
    };
  }

  /**
   * Create a new appointment with conflict detection and automated pricing/duration calculation
   */
  async create(
    tenantId: string,
    currentUserId: string,
    dto: CreateAppointmentDto
  ) {
    // 1. Verify Customer exists and belongs to tenant
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID '${dto.customerId}' not found`);
    }
    if (customer.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied: Customer does not belong to your organization');
    }

    // 2. Verify Pet exists, belongs to tenant, and belongs to customer
    const pet = await this.prisma.pet.findUnique({
      where: { id: dto.petId },
    });
    if (!pet) {
      throw new NotFoundException(`Pet with ID '${dto.petId}' not found`);
    }
    if (pet.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied: Pet does not belong to your organization');
    }
    if (pet.customerId !== dto.customerId) {
      throw new BadRequestException('The selected pet does not belong to this customer');
    }

    // 3. Verify Service exists, belongs to tenant, and is active
    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
    });
    if (!service) {
      throw new NotFoundException(`Service with ID '${dto.serviceId}' not found`);
    }
    if (service.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied: Service does not belong to your organization');
    }
    if (!service.isActive) {
      throw new BadRequestException('Service is currently inactive and cannot be booked');
    }

    const startAt = new Date(dto.startAt);

    // 4. Determine endAt if not explicitly provided
    let endAt: Date;
    if (dto.endAt) {
      endAt = new Date(dto.endAt);
    } else {
      const durationMinutes = service.durationMinutes || 60;
      endAt = new Date(startAt.getTime() + durationMinutes * 60 * 1000);
    }

    // 5. Determine priceMinor if not explicitly provided
    let priceMinor: number;
    if (dto.priceMinor !== undefined) {
      priceMinor = dto.priceMinor;
    } else {
      const calculated = await this.servicesService.calculateServicePrice(
        tenantId,
        {
          serviceId: dto.serviceId,
          species: pet.species,
          weightKg: pet.weight ? Number(pet.weight) : undefined,
        }
      );
      priceMinor = calculated.finalPriceMinor;
    }

    // 6. Run Booking Conflict Engine
    const validation = await this.bookingConflictService.validateBooking(tenantId, {
      branchId: dto.branchId,
      petId: dto.petId,
      serviceId: dto.serviceId,
      staffId: dto.staffId,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
    });

    if (!validation.isValid && !dto.allowConflict) {
      throw new ConflictException(
        validation.conflictReason || 'Booking conflict detected for the selected time slot'
      );
    }

    // 7. Create Appointment Record
    const appointment = await this.prisma.appointment.create({
      data: {
        tenantId,
        branchId: dto.branchId,
        customerId: dto.customerId,
        petId: dto.petId,
        serviceId: dto.serviceId,
        staffId: dto.staffId,
        createdById: currentUserId,
        startAt,
        endAt,
        status: AppointmentStatus.PENDING,
        source: dto.source || AppointmentSource.PHONE,
        priceMinor: BigInt(priceMinor),
        notes: dto.notes,
      },
      include: {
        customer: true,
        pet: true,
        service: true,
        assignedStaff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        branch: true,
      },
    });

    return this.serializeAppointment(appointment);
  }

  /**
   * Find all appointments with multi-criteria filters, search, and pagination
   */
  async findAll(tenantId: string, query: QueryAppointmentDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AppointmentWhereInput = {
      tenantId,
      branchId: query.branchId,
      staffId: query.staffId,
      customerId: query.customerId,
      petId: query.petId,
      status: query.status,
      source: query.source,
    };

    // Date range filtering
    if (query.startDate || query.endDate) {
      where.startAt = {};
      if (query.startDate) {
        where.startAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.startAt.lte = new Date(query.endDate);
      }
    }

    // Search filtering
    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { customer: { firstName: { contains: term, mode: 'insensitive' } } },
        { customer: { lastName: { contains: term, mode: 'insensitive' } } },
        { customer: { phone: { contains: term, mode: 'insensitive' } } },
        { pet: { name: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const [total, appointments] = await Promise.all([
      this.prisma.appointment.count({ where }),
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startAt: 'asc' },
        include: {
          customer: true,
          pet: true,
          service: true,
          assignedStaff: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
          branch: true,
        },
      }),
    ]);

    return {
      success: true,
      data: appointments.map((a) => this.serializeAppointment(a)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find single appointment by ID
   */
  async findById(id: string, tenantId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        customer: true,
        pet: true,
        service: true,
        assignedStaff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        branch: true,
        groomingQueueItem: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID '${id}' not found`);
    }

    if (appointment.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied: Appointment does not belong to your organization');
    }

    return this.serializeAppointment(appointment);
  }

  /**
   * Update appointment details with conflict re-validation
   */
  async update(id: string, tenantId: string, dto: UpdateAppointmentDto) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: { service: true },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID '${id}' not found`);
    }

    if (appointment.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied: Appointment does not belong to your organization');
    }

    if (
      appointment.status === AppointmentStatus.COMPLETED ||
      appointment.status === AppointmentStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot edit an appointment with status '${appointment.status}'`
      );
    }

    const branchId = dto.branchId || appointment.branchId;
    const staffId = dto.staffId !== undefined ? dto.staffId : appointment.staffId;
    const serviceId = dto.serviceId || appointment.serviceId;
    const startAt = dto.startAt ? new Date(dto.startAt) : appointment.startAt;
    const endAt = dto.endAt ? new Date(dto.endAt) : appointment.endAt;

    // Run conflict check if time, branch, service, or staff changed
    if (dto.startAt || dto.endAt || dto.staffId !== undefined || dto.branchId || dto.serviceId) {
      const validation = await this.bookingConflictService.validateBooking(tenantId, {
        branchId,
        staffId: staffId || undefined,
        serviceId,
        petId: appointment.petId,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        excludeAppointmentId: id,
      });

      if (!validation.isValid && !dto.allowConflict) {
        throw new ConflictException(
          validation.conflictReason || 'Booking conflict detected for the updated appointment slot'
        );
      }
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        branchId: dto.branchId,
        serviceId: dto.serviceId,
        staffId: dto.staffId,
        startAt: dto.startAt ? startAt : undefined,
        endAt: dto.endAt ? endAt : undefined,
        source: dto.source,
        priceMinor: dto.priceMinor !== undefined ? BigInt(dto.priceMinor) : undefined,
        notes: dto.notes,
      },
      include: {
        customer: true,
        pet: true,
        service: true,
        assignedStaff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        branch: true,
      },
    });

    return this.serializeAppointment(updated);
  }

  /**
   * Update appointment status with lifecycle timestamps
   */
  async updateStatus(
    id: string,
    tenantId: string,
    dto: UpdateAppointmentStatusDto
  ) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID '${id}' not found`);
    }

    if (appointment.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied: Appointment does not belong to your organization');
    }

    const now = new Date();
    const data: Prisma.AppointmentUpdateInput = {
      status: dto.status,
    };

    if (dto.status === AppointmentStatus.CHECKED_IN && !appointment.checkedInAt) {
      data.checkedInAt = now;
    } else if (dto.status === AppointmentStatus.COMPLETED && !appointment.completedAt) {
      data.completedAt = now;
    } else if (dto.status === AppointmentStatus.CANCELLED) {
      data.cancelledAt = now;
      if (dto.cancellationReason) {
        data.cancellationReason = dto.cancellationReason;
      }
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data,
      include: {
        customer: true,
        pet: true,
        service: true,
        assignedStaff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        branch: true,
      },
    });

    return this.serializeAppointment(updated);
  }

  /**
   * Delete an appointment (or prevent deletion if already completed)
   */
  async delete(id: string, tenantId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID '${id}' not found`);
    }

    if (appointment.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied: Appointment does not belong to your organization');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException(
        'Cannot delete a completed appointment. Please record an adjustment instead.'
      );
    }

    await this.prisma.appointment.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Appointment deleted successfully',
    };
  }
}
