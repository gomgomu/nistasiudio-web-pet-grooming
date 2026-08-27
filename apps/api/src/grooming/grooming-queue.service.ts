import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ServicesService } from '../services/services.service';
import { CreateQueueItemDto } from './dto/create-queue-item.dto';
import { UpdateQueueItemDto } from './dto/update-queue-item.dto';
import { UpdateQueueStatusDto } from './dto/update-queue-status.dto';
import { QueryQueueDto } from './dto/query-queue.dto';
import { GroomingQueueStatus, AppointmentStatus } from '@prisma/client';
import { GroomingNotificationService } from './grooming-notification.service';

@Injectable()
export class GroomingQueueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly servicesService: ServicesService,
    private readonly groomingNotificationService: GroomingNotificationService
  ) {}

  /**
   * Serializes BigInt and Decimal fields for JSON output
   */
  private serializeQueueItem(item: any) {
    if (!item) return null;
    return {
      ...item,
      priceMinor:
        item.priceMinor !== null && item.priceMinor !== undefined
          ? Number(item.priceMinor)
          : null,
      weightKg:
        item.weightKg !== null && item.weightKg !== undefined
          ? Number(item.weightKg)
          : null,
    };
  }

  /**
   * Helper: Validates entity existence and tenant ownership
   */
  private async getVerifiedQueueItem(tenantId: string, id: string) {
    const item = await this.prisma.groomingQueueItem.findUnique({
      where: { id },
      include: {
        customer: true,
        pet: {
          include: {
            groomingProfile: {
              include: {
                preferredGroomer: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        service: true,
        groomer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        appointment: true,
        photos: true,
      },
    });

    if (!item) {
      throw new NotFoundException(`Grooming queue item with ID '${id}' not found`);
    }

    if (item.tenantId !== tenantId) {
      throw new ForbiddenException(
        'Access denied: Grooming queue item does not belong to your organization'
      );
    }

    return item;
  }

  /**
   * Check-in / Create queue item
   */
  async checkIn(tenantId: string, dto: CreateQueueItemDto) {
    // 1. Verify branch
    const branch = await this.prisma.branch.findUnique({
      where: { id: dto.branchId },
    });
    if (!branch) {
      throw new NotFoundException(`Branch with ID '${dto.branchId}' not found`);
    }
    if (branch.tenantId !== tenantId) {
      throw new ForbiddenException('Branch does not belong to your organization');
    }

    // 2. Verify customer
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID '${dto.customerId}' not found`);
    }
    if (customer.tenantId !== tenantId) {
      throw new ForbiddenException('Customer does not belong to your organization');
    }

    // 3. Verify pet
    const pet = await this.prisma.pet.findUnique({
      where: { id: dto.petId },
      include: { groomingProfile: true },
    });
    if (!pet) {
      throw new NotFoundException(`Pet with ID '${dto.petId}' not found`);
    }
    if (pet.tenantId !== tenantId) {
      throw new ForbiddenException('Pet does not belong to your organization');
    }

    // 4. Verify service
    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
    });
    if (!service) {
      throw new NotFoundException(`Service with ID '${dto.serviceId}' not found`);
    }
    if (service.tenantId !== tenantId) {
      throw new ForbiddenException('Service does not belong to your organization');
    }

    // 5. Verify groomer if provided
    if (dto.groomerId) {
      const groomer = await this.prisma.user.findUnique({
        where: { id: dto.groomerId },
      });
      if (!groomer) {
        throw new NotFoundException(`Groomer with ID '${dto.groomerId}' not found`);
      }
      if (groomer.tenantId !== tenantId) {
        throw new ForbiddenException('Groomer does not belong to your organization');
      }
    }

    // 6. Verify appointment if provided
    if (dto.appointmentId) {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: dto.appointmentId },
      });
      if (!appointment) {
        throw new NotFoundException(`Appointment with ID '${dto.appointmentId}' not found`);
      }
      if (appointment.tenantId !== tenantId) {
        throw new ForbiddenException('Appointment does not belong to your organization');
      }
    }

    // 7. Calculate daily sequential queueNumber per branch
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const latestQueueItem = await this.prisma.groomingQueueItem.findFirst({
      where: {
        tenantId,
        branchId: dto.branchId,
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      orderBy: { queueNumber: 'desc' },
      select: { queueNumber: true },
    });

    const queueNumber = (latestQueueItem?.queueNumber ?? 0) + 1;

    // 8. Calculate price
    let finalPriceMinor: number = dto.priceMinor ?? 0;
    if (!dto.priceMinor) {
      const measuredWeight = dto.weightKg ?? (pet.weight ? Number(pet.weight) : undefined);
      const calculated = await this.servicesService.calculateServicePrice(tenantId, {
        serviceId: dto.serviceId,
        species: pet.species,
        weightKg: measuredWeight,
      });
      finalPriceMinor = calculated.finalPriceMinor;
    }

    // 9. Create queue item
    const createdItem = await this.prisma.groomingQueueItem.create({
      data: {
        tenantId,
        branchId: dto.branchId,
        customerId: dto.customerId,
        petId: dto.petId,
        serviceId: dto.serviceId,
        appointmentId: dto.appointmentId,
        groomerId: dto.groomerId ?? pet.groomingProfile?.preferredGroomerId ?? null,
        queueNumber,
        status: GroomingQueueStatus.WAITING,
        specialCareNotes:
          dto.specialCareNotes ??
          pet.groomingProfile?.warnings ??
          pet.behavioralNotes ??
          null,
        weightKg: dto.weightKg ?? pet.weight,
        estimatedDurationMinutes: dto.estimatedDurationMinutes ?? service.durationMinutes ?? 60,
        priceMinor: BigInt(finalPriceMinor),
      },
      include: {
        customer: true,
        pet: {
          include: {
            groomingProfile: true,
          },
        },
        service: true,
        groomer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        appointment: true,
      },
    });

    // 10. Update linked appointment status to CHECKED_IN
    if (dto.appointmentId) {
      await this.prisma.appointment.update({
        where: { id: dto.appointmentId },
        data: {
          status: AppointmentStatus.CHECKED_IN,
          checkedInAt: new Date(),
        },
      });
    }

    // 11. Update pet weight if newly measured
    if (dto.weightKg) {
      await this.prisma.pet.update({
        where: { id: dto.petId },
        data: { weight: dto.weightKg },
      });
    }

    return this.serializeQueueItem(createdItem);
  }

  /**
   * Find all queue items matching query parameters
   */
  async findAll(tenantId: string, query: QueryQueueDto) {
    const where: any = { tenantId };

    if (query.branchId) {
      where.branchId = query.branchId;
    }

    if (query.groomerId) {
      where.groomerId = query.groomerId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.date) {
      const targetDate = new Date(query.date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      where.createdAt = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.groomingQueueItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ queueNumber: 'asc' }, { createdAt: 'asc' }],
        include: {
          customer: true,
          pet: {
            include: {
              groomingProfile: true,
            },
          },
          service: true,
          groomer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
          photos: true,
        },
      }),
      this.prisma.groomingQueueItem.count({ where }),
    ]);

    return {
      data: items.map((item) => this.serializeQueueItem(item)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find single queue item by ID
   */
  async findById(tenantId: string, id: string) {
    const item = await this.getVerifiedQueueItem(tenantId, id);
    return this.serializeQueueItem(item);
  }

  /**
   * Update queue item
   */
  async update(tenantId: string, id: string, dto: UpdateQueueItemDto) {
    await this.getVerifiedQueueItem(tenantId, id);

    // Verify service if changed
    if (dto.serviceId) {
      const service = await this.prisma.service.findUnique({
        where: { id: dto.serviceId },
      });
      if (!service || service.tenantId !== tenantId) {
        throw new ForbiddenException('Invalid service');
      }
    }

    // Verify groomer if changed
    if (dto.groomerId) {
      const groomer = await this.prisma.user.findUnique({
        where: { id: dto.groomerId },
      });
      if (!groomer || groomer.tenantId !== tenantId) {
        throw new ForbiddenException('Invalid groomer');
      }
    }

    const updated = await this.prisma.groomingQueueItem.update({
      where: { id },
      data: {
        serviceId: dto.serviceId,
        groomerId: dto.groomerId,
        specialCareNotes: dto.specialCareNotes,
        weightKg: dto.weightKg,
        estimatedDurationMinutes: dto.estimatedDurationMinutes,
        priceMinor: dto.priceMinor ? BigInt(dto.priceMinor) : undefined,
      },
      include: {
        customer: true,
        pet: {
          include: {
            groomingProfile: true,
          },
        },
        service: true,
        groomer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    return this.serializeQueueItem(updated);
  }

  /**
   * Update queue status transition and track stage milestones
   */
  async updateStatus(tenantId: string, id: string, dto: UpdateQueueStatusDto) {
    const item = await this.getVerifiedQueueItem(tenantId, id);

    const now = new Date();
    const dataToUpdate: any = {
      status: dto.status,
    };

    // Automatically set stage timestamps
    switch (dto.status) {
      case GroomingQueueStatus.BATHING:
        dataToUpdate.bathingStartedAt = item.bathingStartedAt ?? now;
        dataToUpdate.startedAt = item.startedAt ?? now;
        break;

      case GroomingQueueStatus.DRYING:
        dataToUpdate.dryingStartedAt = item.dryingStartedAt ?? now;
        dataToUpdate.startedAt = item.startedAt ?? now;
        break;

      case GroomingQueueStatus.GROOMING:
        dataToUpdate.groomingStartedAt = item.groomingStartedAt ?? now;
        dataToUpdate.startedAt = item.startedAt ?? now;
        break;

      case GroomingQueueStatus.FINISHING:
        dataToUpdate.finishingStartedAt = item.finishingStartedAt ?? now;
        break;

      case GroomingQueueStatus.READY:
        dataToUpdate.readyAt = item.readyAt ?? now;
        if (item.startedAt && !dto.actualDurationMinutes) {
          const diffMs = now.getTime() - new Date(item.startedAt).getTime();
          dataToUpdate.actualDurationMinutes = Math.max(1, Math.round(diffMs / 60000));
        } else if (dto.actualDurationMinutes) {
          dataToUpdate.actualDurationMinutes = dto.actualDurationMinutes;
        }

        // Trigger automated idempotent Grooming Ready customer notification
        await this.groomingNotificationService
          .sendGroomingReadyNotification(tenantId, id)
          .catch((err) => {
            // Log without blocking status transition
            console.error('Failed to dispatch grooming ready notification:', err);
          });
        break;

      case GroomingQueueStatus.PICKED_UP:
        dataToUpdate.pickedUpAt = item.pickedUpAt ?? now;
        // Mark appointment as COMPLETED if linked
        if (item.appointmentId) {
          await this.prisma.appointment.update({
            where: { id: item.appointmentId },
            data: {
              status: AppointmentStatus.COMPLETED,
              completedAt: now,
            },
          });
        }
        break;

      case GroomingQueueStatus.CANCELLED:
        dataToUpdate.cancelledAt = now;
        dataToUpdate.cancellationReason = dto.cancellationReason ?? 'Cancelled by staff';
        // Mark appointment as CANCELLED if linked
        if (item.appointmentId) {
          await this.prisma.appointment.update({
            where: { id: item.appointmentId },
            data: {
              status: AppointmentStatus.CANCELLED,
              cancelledAt: now,
              cancellationReason: dto.cancellationReason,
            },
          });
        }
        break;
    }

    if (dto.actualDurationMinutes !== undefined) {
      dataToUpdate.actualDurationMinutes = dto.actualDurationMinutes;
    }

    const updated = await this.prisma.groomingQueueItem.update({
      where: { id },
      data: dataToUpdate,
      include: {
        customer: true,
        pet: {
          include: {
            groomingProfile: true,
          },
        },
        service: true,
        groomer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    return this.serializeQueueItem(updated);
  }

  /**
   * Assign or transfer groomer
   */
  async assignGroomer(tenantId: string, id: string, groomerId: string) {
    await this.getVerifiedQueueItem(tenantId, id);

    const groomer = await this.prisma.user.findUnique({
      where: { id: groomerId },
    });

    if (!groomer) {
      throw new NotFoundException(`Groomer with ID '${groomerId}' not found`);
    }

    if (groomer.tenantId !== tenantId) {
      throw new ForbiddenException('Groomer does not belong to your organization');
    }

    const updated = await this.prisma.groomingQueueItem.update({
      where: { id },
      data: { groomerId },
      include: {
        customer: true,
        pet: true,
        service: true,
        groomer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    return this.serializeQueueItem(updated);
  }

  /**
   * Delete queue item
   */
  async delete(tenantId: string, id: string) {
    const item = await this.getVerifiedQueueItem(tenantId, id);

    await this.prisma.groomingQueueItem.delete({
      where: { id },
    });

    return {
      success: true,
      message: `Grooming queue item #${item.queueNumber} deleted successfully`,
    };
  }
}
