import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVaccinationDto } from './dto/create-vaccination.dto';
import { UpdateVaccinationDto } from './dto/update-vaccination.dto';
import { QueryVaccinationsDto } from './dto/query-vaccinations.dto';
import {
  VaccinationRecordItem,
  PetVaccinationPassport,
} from '@petflow/types';

@Injectable()
export class VaccinationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Query vaccinations with filters
   */
  async getVaccinations(
    tenantId: string,
    query: QueryVaccinationsDto
  ): Promise<VaccinationRecordItem[]> {
    const where: any = { tenantId };

    if (query.petId) {
      where.petId = query.petId;
    }

    if (query.customerId) {
      where.pet = { customerId: query.customerId };
    }

    if (query.vaccineType) {
      where.vaccineType = query.vaccineType;
    }

    if (query.dueFrom || query.dueTo) {
      where.nextDueAt = {};
      if (query.dueFrom) {
        where.nextDueAt.gte = new Date(query.dueFrom);
      }
      if (query.dueTo) {
        where.nextDueAt.lte = new Date(query.dueTo);
      }
    }

    if (query.search) {
      const s = query.search.trim();
      where.OR = [
        { vaccineName: { contains: s, mode: 'insensitive' } },
        { pet: { name: { contains: s, mode: 'insensitive' } } },
        { pet: { customer: { firstName: { contains: s, mode: 'insensitive' } } } },
        { pet: { customer: { phone: { contains: s } } } },
      ];
    }

    const records = await this.prisma.petVaccination.findMany({
      where,
      include: {
        pet: {
          include: { customer: true },
        },
        clinicVisit: true,
        administeredBy: true,
      },
      orderBy: { administeredAt: 'desc' },
    });

    return records.map((r) => this.mapToVaccinationItem(r));
  }

  /**
   * Get Pet Vaccination Passport (complete immunization history)
   */
  async getPetVaccinationPassport(
    tenantId: string,
    petId: string
  ): Promise<PetVaccinationPassport> {
    const pet = await this.prisma.pet.findFirst({
      where: { id: petId, tenantId },
      include: {
        customer: true,
        vaccinations: {
          where: { tenantId },
          include: {
            clinicVisit: true,
            administeredBy: true,
            pet: { include: { customer: true } },
          },
          orderBy: { administeredAt: 'desc' },
        },
      },
    });

    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    const now = new Date();
    const upcomingDueCount = pet.vaccinations.filter(
      (v) => v.nextDueAt && v.nextDueAt >= now
    ).length;

    return {
      pet: {
        id: pet.id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed || null,
        birthDate: pet.birthDate ? pet.birthDate.toISOString() : null,
        microchipNumber: pet.microchipNumber || null,
        photoUrl: pet.photoUrl || null,
        customerName: `${pet.customer.firstName} ${pet.customer.lastName}`,
        customerPhone: pet.customer.phone,
      },
      vaccinations: pet.vaccinations.map((v) => this.mapToVaccinationItem(v)),
      upcomingDueCount,
    };
  }

  /**
   * Get single vaccination record
   */
  async getVaccinationById(
    tenantId: string,
    id: string
  ): Promise<VaccinationRecordItem> {
    const record = await this.prisma.petVaccination.findFirst({
      where: { id, tenantId },
      include: {
        pet: { include: { customer: true } },
        clinicVisit: true,
        administeredBy: true,
      },
    });

    if (!record) {
      throw new NotFoundException('Vaccination record not found');
    }

    return this.mapToVaccinationItem(record);
  }

  /**
   * Create a new vaccination record
   */
  async createVaccination(
    tenantId: string,
    dto: CreateVaccinationDto
  ): Promise<VaccinationRecordItem> {
    const pet = await this.prisma.pet.findFirst({
      where: { id: dto.petId, tenantId },
      include: { customer: true },
    });

    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    if (dto.clinicVisitId) {
      const visit = await this.prisma.clinicVisit.findFirst({
        where: { id: dto.clinicVisitId, tenantId },
      });
      if (!visit) {
        throw new NotFoundException('Clinic visit not found');
      }
    }

    if (dto.productId) {
      const product = await this.prisma.product.findFirst({
        where: { id: dto.productId, tenantId },
      });
      if (!product) {
        throw new NotFoundException('Linked product not found in your organization');
      }
    }

    const administeredAt = dto.administeredAt ? new Date(dto.administeredAt) : new Date();

    // Default next due date to +1 year if not specified
    let nextDueAt: Date | null = null;
    if (dto.nextDueAt) {
      nextDueAt = new Date(dto.nextDueAt);
    } else {
      nextDueAt = new Date(administeredAt);
      nextDueAt.setFullYear(nextDueAt.getFullYear() + 1);
    }

    const record = await this.prisma.petVaccination.create({
      data: {
        tenantId,
        petId: dto.petId,
        clinicVisitId: dto.clinicVisitId || null,
        productId: dto.productId || null,
        administeredById: dto.administeredById || null,
        vaccineType: dto.vaccineType || 'OTHER',
        vaccineName: dto.vaccineName,
        manufacturer: dto.manufacturer || null,
        lotNumber: dto.lotNumber || null,
        administeredAt,
        nextDueAt,
        weightKg: dto.weightKg ?? null,
        temperatureC: dto.temperatureC ?? null,
        siteOfInjection: dto.siteOfInjection || null,
        certificateNumber: dto.certificateNumber || null,
        isCompleted: true,
        notes: dto.notes || null,
      },
      include: {
        pet: { include: { customer: true } },
        clinicVisit: true,
        administeredBy: true,
      },
    });

    // Append history snapshot to PetMedicalRecord
    await this.prisma.petMedicalRecord.create({
      data: {
        petId: dto.petId,
        clinicVisitId: dto.clinicVisitId || null,
        recordType: 'VACCINATION',
        content: `ฉีดวัคซีน ${dto.vaccineName} (Lot: ${dto.lotNumber || '-'}) นัดฉีดซ้ำ: ${nextDueAt.toLocaleDateString('th-TH')}`,
      },
    });

    return this.mapToVaccinationItem(record);
  }

  /**
   * Update vaccination record
   */
  async updateVaccination(
    tenantId: string,
    id: string,
    dto: UpdateVaccinationDto
  ): Promise<VaccinationRecordItem> {
    const existing = await this.prisma.petVaccination.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Vaccination record not found');
    }

    const updated = await this.prisma.petVaccination.update({
      where: { id },
      data: {
        administeredById:
          dto.administeredById !== undefined
            ? dto.administeredById
            : existing.administeredById,
        vaccineType:
          dto.vaccineType !== undefined ? dto.vaccineType : existing.vaccineType,
        vaccineName:
          dto.vaccineName !== undefined ? dto.vaccineName : existing.vaccineName,
        manufacturer:
          dto.manufacturer !== undefined ? dto.manufacturer : existing.manufacturer,
        lotNumber:
          dto.lotNumber !== undefined ? dto.lotNumber : existing.lotNumber,
        administeredAt: dto.administeredAt
          ? new Date(dto.administeredAt)
          : existing.administeredAt,
        nextDueAt:
          dto.nextDueAt !== undefined
            ? dto.nextDueAt
              ? new Date(dto.nextDueAt)
              : null
            : existing.nextDueAt,
        weightKg:
          dto.weightKg !== undefined ? dto.weightKg : existing.weightKg,
        temperatureC:
          dto.temperatureC !== undefined ? dto.temperatureC : existing.temperatureC,
        siteOfInjection:
          dto.siteOfInjection !== undefined
            ? dto.siteOfInjection
            : existing.siteOfInjection,
        certificateNumber:
          dto.certificateNumber !== undefined
            ? dto.certificateNumber
            : existing.certificateNumber,
        notes: dto.notes !== undefined ? dto.notes : existing.notes,
      },
      include: {
        pet: { include: { customer: true } },
        clinicVisit: true,
        administeredBy: true,
      },
    });

    return this.mapToVaccinationItem(updated);
  }

  /**
   * Delete vaccination record
   */
  async deleteVaccination(
    tenantId: string,
    id: string
  ): Promise<{ success: boolean }> {
    const existing = await this.prisma.petVaccination.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Vaccination record not found');
    }

    await this.prisma.petVaccination.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Map Prisma entity to VaccinationRecordItem
   */
  private mapToVaccinationItem(v: any): VaccinationRecordItem {
    return {
      id: v.id,
      tenantId: v.tenantId,
      petId: v.petId,
      petName: v.pet?.name || '',
      species: v.pet?.species || 'DOG',
      breed: v.pet?.breed || null,
      customerId: v.pet?.customer?.id || '',
      customerName: v.pet?.customer
        ? `${v.pet.customer.firstName} ${v.pet.customer.lastName}`
        : '',
      customerPhone: v.pet?.customer?.phone || '',
      clinicVisitId: v.clinicVisitId || null,
      visitNumber: v.clinicVisit?.visitNumber || null,
      productId: v.productId || null,
      administeredById: v.administeredById || null,
      administeredByName: v.administeredBy
        ? `${v.administeredBy.firstName} ${v.administeredBy.lastName}`
        : null,
      vaccineType: v.vaccineType,
      vaccineName: v.vaccineName,
      manufacturer: v.manufacturer || null,
      lotNumber: v.lotNumber || null,
      administeredAt: v.administeredAt.toISOString(),
      nextDueAt: v.nextDueAt ? v.nextDueAt.toISOString().split('T')[0] : null,
      weightKg: v.weightKg ? Number(v.weightKg) : null,
      temperatureC: v.temperatureC ? Number(v.temperatureC) : null,
      siteOfInjection: v.siteOfInjection || null,
      certificateNumber: v.certificateNumber || null,
      isCompleted: v.isCompleted,
      reminderSent: v.reminderSent,
      reminderSentAt: v.reminderSentAt ? v.reminderSentAt.toISOString() : null,
      notes: v.notes || null,
      createdAt: v.createdAt.toISOString(),
    };
  }
}
