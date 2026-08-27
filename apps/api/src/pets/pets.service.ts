import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { QueryPetDto } from './dto/query-pet.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PetsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreatePetDto) {
    // Verify customer exists and belongs to the same tenant
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID '${dto.customerId}' not found`);
    }

    if (customer.tenantId !== tenantId) {
      throw new ForbiddenException(
        'Access denied: Customer does not belong to your organization'
      );
    }

    return this.prisma.pet.create({
      data: {
        tenantId,
        customerId: dto.customerId,
        name: dto.name,
        species: dto.species,
        breed: dto.breed,
        sex: dto.sex,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        weight: dto.weight ? new Prisma.Decimal(dto.weight) : undefined,
        microchipNumber: dto.microchipNumber,
        allergies: dto.allergies,
        behavioralNotes: dto.behavioralNotes,
        specialRequirements: dto.specialRequirements,
        photoUrl: dto.photoUrl,
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            lineUserId: true,
          },
        },
      },
    });
  }

  async findAll(tenantId: string, query: QueryPetDto) {
    const { customerId, species, q, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PetWhereInput = {
      tenantId,
      isActive: true,
    };

    if (customerId) {
      where.customerId = customerId;
    }

    if (species) {
      where.species = species;
    }

    if (q && q.trim().length > 0) {
      const searchTerm = q.trim();
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { breed: { contains: searchTerm, mode: 'insensitive' } },
        { microchipNumber: { contains: searchTerm } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.pet.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
      }),
      this.prisma.pet.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, tenantId: string) {
    const pet = await this.prisma.pet.findUnique({
      where: { id },
      include: {
        customer: true,
        appointments: {
          take: 5,
          orderBy: { startAt: 'desc' },
        },
        medicalRecords: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        vaccinations: {
          take: 5,
          orderBy: { administeredAt: 'desc' },
        },
      },
    });

    if (!pet) {
      throw new NotFoundException(`Pet with ID '${id}' not found`);
    }

    if (pet.tenantId !== tenantId) {
      throw new ForbiddenException(
        'Access denied: Pet does not belong to your organization'
      );
    }

    return pet;
  }

  async update(id: string, tenantId: string, dto: UpdatePetDto) {
    await this.findById(id, tenantId);

    if (dto.customerId) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: dto.customerId },
      });

      if (!customer || customer.tenantId !== tenantId) {
        throw new ForbiddenException(
          'Target customer does not exist in your organization'
        );
      }
    }

    const data: Prisma.PetUpdateInput = {
      ...(dto.name && { name: dto.name }),
      ...(dto.species && { species: dto.species }),
      ...(dto.breed !== undefined && { breed: dto.breed }),
      ...(dto.sex && { sex: dto.sex }),
      ...(dto.birthDate !== undefined && {
        birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
      }),
      ...(dto.weight !== undefined && {
        weight: dto.weight ? new Prisma.Decimal(dto.weight) : null,
      }),
      ...(dto.microchipNumber !== undefined && { microchipNumber: dto.microchipNumber }),
      ...(dto.allergies !== undefined && { allergies: dto.allergies }),
      ...(dto.behavioralNotes !== undefined && { behavioralNotes: dto.behavioralNotes }),
      ...(dto.specialRequirements !== undefined && {
        specialRequirements: dto.specialRequirements,
      }),
      ...(dto.photoUrl !== undefined && { photoUrl: dto.photoUrl }),
    };

    return this.prisma.pet.update({
      where: { id },
      data,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });
  }

  async delete(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    return this.prisma.pet.delete({
      where: { id },
    });
  }

  async getTimeline(id: string, tenantId: string) {
    const pet = await this.findById(id, tenantId);

    const [
      notes,
      appointments,
      clinicVisits,
      medicalRecords,
      vaccinations,
      groomingItems,
      invoices,
    ] = await Promise.all([
      this.prisma.petNote.findMany({
        where: { petId: id },
        include: { creator: { select: { firstName: true, lastName: true } } },
      }),
      this.prisma.appointment.findMany({
        where: { petId: id },
        include: {
          service: { select: { name: true } },
          assignedStaff: { select: { firstName: true, lastName: true } },
        },
      }),
      this.prisma.clinicVisit.findMany({
        where: { petId: id },
        include: {
          veterinarian: { select: { firstName: true, lastName: true } },
          prescriptions: true,
          treatments: true,
        },
      }),
      this.prisma.petMedicalRecord.findMany({
        where: { petId: id },
      }),
      this.prisma.petVaccination.findMany({
        where: { petId: id },
      }),
      this.prisma.groomingQueueItem.findMany({
        where: { petId: id },
        include: {
          service: { select: { name: true } },
          groomer: { select: { firstName: true, lastName: true } },
        },
      }),
      this.prisma.invoice.findMany({
        where: { petId: id },
      }),
    ]);

    const events: any[] = [];

    notes.forEach((n) => {
      events.push({
        id: n.id,
        type: 'NOTE',
        timestamp: n.createdAt,
        title: `บันทึกช่วยจำ (${n.type})`,
        description: n.content,
        actorName: n.creator ? `${n.creator.firstName} ${n.creator.lastName}` : undefined,
      });
    });

    appointments.forEach((a) => {
      events.push({
        id: a.id,
        type: 'APPOINTMENT',
        timestamp: a.startAt,
        title: `นัดหมาย: ${a.service.name}`,
        description: a.notes || undefined,
        status: a.status,
        actorName: a.assignedStaff
          ? `${a.assignedStaff.firstName} ${a.assignedStaff.lastName}`
          : undefined,
      });
    });

    clinicVisits.forEach((cv) => {
      events.push({
        id: cv.id,
        type: 'CLINIC_VISIT',
        timestamp: cv.createdAt,
        title: `เข้ารับการตรวจรักษา (Clinic Visit)`,
        description: cv.treatments.map((t) => t.name).join(', ') || undefined,
        actorName: cv.veterinarian
          ? `สพ. ${cv.veterinarian.firstName} ${cv.veterinarian.lastName}`
          : undefined,
        metadata: {
          prescriptionsCount: cv.prescriptions.length,
          treatmentsCount: cv.treatments.length,
        },
      });
    });

    medicalRecords.forEach((mr) => {
      events.push({
        id: mr.id,
        type: 'MEDICAL_RECORD',
        timestamp: mr.createdAt,
        title: `เวชระเบียน (${mr.recordType})`,
        description: mr.content,
      });
    });

    vaccinations.forEach((v) => {
      events.push({
        id: v.id,
        type: 'VACCINATION',
        timestamp: v.administeredAt,
        title: `ฉีดวัคซีน: ${v.vaccineName}`,
        description: v.lotNumber ? `Lot: ${v.lotNumber}` : undefined,
        metadata: {
          nextDueAt: v.nextDueAt,
        },
      });
    });

    groomingItems.forEach((g) => {
      events.push({
        id: g.id,
        type: 'GROOMING',
        timestamp: g.createdAt,
        title: `บริการตัดขน: ${g.service.name}`,
        description: g.specialCareNotes || undefined,
        status: g.status,
        actorName: g.groomer
          ? `ช่าง ${g.groomer.firstName} ${g.groomer.lastName}`
          : undefined,
      });
    });

    invoices.forEach((inv) => {
      events.push({
        id: inv.id,
        type: 'INVOICE',
        timestamp: inv.createdAt,
        title: `ใบเสร็จ/ใบแจ้งหนี้ #${inv.invoiceNo}`,
        description: `ยอดรวม: ฿${(Number(inv.totalMinor) / 100).toLocaleString('th-TH')}`,
        status: inv.status,
      });
    });

    // Sort descending by timestamp
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      petId: id,
      petName: pet.name,
      totalEvents: events.length,
      timeline: events,
    };
  }
}
