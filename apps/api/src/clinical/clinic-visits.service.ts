import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClinicVisitDto } from './dto/create-clinic-visit.dto';
import { UpdateClinicVisitDto } from './dto/update-clinic-visit.dto';
import { QueryClinicVisitsDto } from './dto/query-clinic-visits.dto';
import {
  ClinicVisitItem,
  ClinicVisitStatus,
  PaginatedResponse,
} from '@petflow/types';

@Injectable()
export class ClinicVisitsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new clinic visit record
   */
  async createClinicVisit(
    tenantId: string,
    dto: CreateClinicVisitDto
  ): Promise<ClinicVisitItem> {
    // 1. Verify customer and pet belong to tenant
    const pet = await this.prisma.pet.findFirst({
      where: {
        id: dto.petId,
        tenantId,
        customerId: dto.customerId,
      },
      include: {
        customer: true,
      },
    });

    if (!pet) {
      throw new NotFoundException(
        'Pet or customer not found or does not belong to your organization'
      );
    }

    // 2. Verify branch belongs to tenant
    const branch = await this.prisma.branch.findFirst({
      where: { id: dto.branchId, tenantId },
    });
    if (!branch) {
      throw new NotFoundException('Branch not found in your organization');
    }

    // 3. Generate sequential visit number
    const currentYear = new Date().getFullYear();
    const countThisYear = await this.prisma.clinicVisit.count({
      where: {
        tenantId,
        createdAt: {
          gte: new Date(`${currentYear}-01-01T00:00:00Z`),
        },
      },
    });
    const visitNumber = `VN-${currentYear}-${String(countThisYear + 1).padStart(4, '0')}`;

    // 4. Update pet weight if provided in vitals
    if (dto.vitals?.weightKg) {
      await this.prisma.pet.update({
        where: { id: pet.id },
        data: { weight: dto.vitals.weightKg },
      });
    }

    // 5. Create ClinicVisit
    const visit = await this.prisma.clinicVisit.create({
      data: {
        tenantId,
        branchId: dto.branchId,
        customerId: dto.customerId,
        petId: dto.petId,
        appointmentId: dto.appointmentId || null,
        veterinarianId: dto.veterinarianId || null,
        visitNumber,
        status: 'WAITING',
        visitType: dto.visitType || 'GENERAL_CHECKUP',
        chiefComplaint: dto.chiefComplaint || null,
        symptoms: dto.symptoms || null,
        diagnosis: dto.diagnosis || null,
        differentialDiagnosis: dto.differentialDiagnosis || null,
        weightKg: dto.vitals?.weightKg ?? null,
        temperatureC: dto.vitals?.temperatureC ?? null,
        heartRateBpm: dto.vitals?.heartRateBpm ?? null,
        respiratoryRateBpm: dto.vitals?.respiratoryRateBpm ?? null,
        capillaryRefillTime: dto.vitals?.capillaryRefillTime ?? null,
        mucousMembrane: dto.vitals?.mucousMembrane ?? null,
        bodyConditionScore: dto.vitals?.bodyConditionScore ?? null,
        subjective: dto.subjective || null,
        objective: dto.objective || null,
        assessment: dto.assessment || null,
        plan: dto.plan || null,
        treatmentSummary: dto.treatmentSummary || null,
        dischargeNotes: dto.dischargeNotes || null,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : null,
        followUpReason: dto.followUpReason || null,
        visitedAt: dto.visitedAt ? new Date(dto.visitedAt) : new Date(),
      },
      include: {
        branch: true,
        customer: true,
        pet: true,
        veterinarian: true,
        _count: {
          select: {
            prescriptions: true,
            treatments: true,
          },
        },
      },
    });

    return this.mapToClinicVisitItem(visit);
  }

  /**
   * Get paginated clinic visits with search & filters
   */
  async getClinicVisits(
    tenantId: string,
    query: QueryClinicVisitsDto
  ): Promise<PaginatedResponse<ClinicVisitItem>> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
    };

    if (query.branchId) where.branchId = query.branchId;
    if (query.petId) where.petId = query.petId;
    if (query.customerId) where.customerId = query.customerId;
    if (query.veterinarianId) where.veterinarianId = query.veterinarianId;
    if (query.status) where.status = query.status;
    if (query.visitType) where.visitType = query.visitType;

    if (query.startDate || query.endDate) {
      where.visitedAt = {};
      if (query.startDate) where.visitedAt.gte = new Date(query.startDate);
      if (query.endDate) where.visitedAt.lte = new Date(query.endDate);
    }

    if (query.search) {
      const s = query.search.trim();
      where.OR = [
        { customer: { firstName: { contains: s, mode: 'insensitive' } } },
        { customer: { lastName: { contains: s, mode: 'insensitive' } } },
        { customer: { phone: { contains: s } } },
        { pet: { name: { contains: s, mode: 'insensitive' } } },
        { chiefComplaint: { contains: s, mode: 'insensitive' } },
        { diagnosis: { contains: s, mode: 'insensitive' } },
        { visitNumber: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [total, visits] = await Promise.all([
      this.prisma.clinicVisit.count({ where }),
      this.prisma.clinicVisit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { visitedAt: 'desc' },
        include: {
          branch: true,
          customer: true,
          pet: true,
          veterinarian: true,
          _count: {
            select: {
              prescriptions: true,
              treatments: true,
            },
          },
        },
      }),
    ]);

    return {
      success: true,
      data: visits.map((v) => this.mapToClinicVisitItem(v)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get single clinic visit by ID
   */
  async getClinicVisitById(tenantId: string, visitId: string): Promise<ClinicVisitItem> {
    const visit = await this.prisma.clinicVisit.findFirst({
      where: {
        id: visitId,
        tenantId,
      },
      include: {
        branch: true,
        customer: true,
        pet: true,
        veterinarian: true,
        prescriptions: true,
        treatments: true,
        vaccinations: true,
        medicalRecords: true,
        invoices: true,
        _count: {
          select: {
            prescriptions: true,
            treatments: true,
          },
        },
      },
    });

    if (!visit) {
      throw new NotFoundException('Clinic visit not found');
    }

    return this.mapToClinicVisitItem(visit);
  }

  /**
   * Update clinic visit details, vitals, or SOAP notes
   */
  async updateClinicVisit(
    tenantId: string,
    visitId: string,
    dto: UpdateClinicVisitDto
  ): Promise<ClinicVisitItem> {
    const existing = await this.prisma.clinicVisit.findFirst({
      where: { id: visitId, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Clinic visit not found');
    }

    // Update pet weight if provided in vitals
    if (dto.vitals?.weightKg) {
      await this.prisma.pet.update({
        where: { id: existing.petId },
        data: { weight: dto.vitals.weightKg },
      });
    }

    let completedAt = existing.completedAt;
    if (dto.status === 'COMPLETED' && !completedAt) {
      completedAt = dto.completedAt ? new Date(dto.completedAt) : new Date();
    }

    const updated = await this.prisma.clinicVisit.update({
      where: { id: visitId },
      data: {
        status: dto.status ?? existing.status,
        visitType: dto.visitType ?? existing.visitType,
        veterinarianId:
          dto.veterinarianId !== undefined ? dto.veterinarianId : existing.veterinarianId,
        chiefComplaint:
          dto.chiefComplaint !== undefined ? dto.chiefComplaint : existing.chiefComplaint,
        symptoms: dto.symptoms !== undefined ? dto.symptoms : existing.symptoms,
        diagnosis: dto.diagnosis !== undefined ? dto.diagnosis : existing.diagnosis,
        differentialDiagnosis:
          dto.differentialDiagnosis !== undefined
            ? dto.differentialDiagnosis
            : existing.differentialDiagnosis,
        weightKg: dto.vitals?.weightKg !== undefined ? dto.vitals.weightKg : existing.weightKg,
        temperatureC:
          dto.vitals?.temperatureC !== undefined
            ? dto.vitals.temperatureC
            : existing.temperatureC,
        heartRateBpm:
          dto.vitals?.heartRateBpm !== undefined
            ? dto.vitals.heartRateBpm
            : existing.heartRateBpm,
        respiratoryRateBpm:
          dto.vitals?.respiratoryRateBpm !== undefined
            ? dto.vitals.respiratoryRateBpm
            : existing.respiratoryRateBpm,
        capillaryRefillTime:
          dto.vitals?.capillaryRefillTime !== undefined
            ? dto.vitals.capillaryRefillTime
            : existing.capillaryRefillTime,
        mucousMembrane:
          dto.vitals?.mucousMembrane !== undefined
            ? dto.vitals.mucousMembrane
            : existing.mucousMembrane,
        bodyConditionScore:
          dto.vitals?.bodyConditionScore !== undefined
            ? dto.vitals.bodyConditionScore
            : existing.bodyConditionScore,
        subjective: dto.subjective !== undefined ? dto.subjective : existing.subjective,
        objective: dto.objective !== undefined ? dto.objective : existing.objective,
        assessment: dto.assessment !== undefined ? dto.assessment : existing.assessment,
        plan: dto.plan !== undefined ? dto.plan : existing.plan,
        treatmentSummary:
          dto.treatmentSummary !== undefined ? dto.treatmentSummary : existing.treatmentSummary,
        dischargeNotes:
          dto.dischargeNotes !== undefined ? dto.dischargeNotes : existing.dischargeNotes,
        followUpDate:
          dto.followUpDate !== undefined
            ? dto.followUpDate
              ? new Date(dto.followUpDate)
              : null
            : existing.followUpDate,
        followUpReason:
          dto.followUpReason !== undefined ? dto.followUpReason : existing.followUpReason,
        completedAt,
      },
      include: {
        branch: true,
        customer: true,
        pet: true,
        veterinarian: true,
        _count: {
          select: {
            prescriptions: true,
            treatments: true,
          },
        },
      },
    });

    return this.mapToClinicVisitItem(updated);
  }

  /**
   * Update status of clinic visit
   */
  async updateClinicVisitStatus(
    tenantId: string,
    visitId: string,
    status: ClinicVisitStatus
  ): Promise<ClinicVisitItem> {
    return this.updateClinicVisit(tenantId, visitId, { status });
  }

  /**
   * Delete clinic visit
   */
  async deleteClinicVisit(tenantId: string, visitId: string): Promise<{ success: boolean }> {
    const existing = await this.prisma.clinicVisit.findFirst({
      where: { id: visitId, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Clinic visit not found');
    }

    await this.prisma.clinicVisit.delete({
      where: { id: visitId },
    });

    return { success: true };
  }

  /**
   * Map Prisma ClinicVisit entity to ClinicVisitItem type
   */
  private mapToClinicVisitItem(visit: any): ClinicVisitItem {
    return {
      id: visit.id,
      tenantId: visit.tenantId,
      branchId: visit.branchId,
      branchName: visit.branch?.name,
      appointmentId: visit.appointmentId || null,
      customerId: visit.customerId,
      customerName: visit.customer ? `${visit.customer.firstName} ${visit.customer.lastName}` : '',
      customerPhone: visit.customer?.phone || '',
      lineUserId: visit.customer?.lineUserId || null,
      petId: visit.petId,
      petName: visit.pet?.name || '',
      species: visit.pet?.species || 'DOG',
      breed: visit.pet?.breed || null,
      photoUrl: visit.pet?.photoUrl || null,
      allergies: visit.pet?.allergies || null,
      veterinarianId: visit.veterinarianId || null,
      veterinarianName: visit.veterinarian
        ? `${visit.veterinarian.firstName} ${visit.veterinarian.lastName}`
        : null,
      visitNumber: visit.visitNumber || null,
      status: visit.status,
      visitType: visit.visitType,
      chiefComplaint: visit.chiefComplaint || null,
      symptoms: visit.symptoms || null,
      diagnosis: visit.diagnosis || null,
      differentialDiagnosis: visit.differentialDiagnosis || null,
      vitals: {
        weightKg: visit.weightKg ? Number(visit.weightKg) : null,
        temperatureC: visit.temperatureC ? Number(visit.temperatureC) : null,
        heartRateBpm: visit.heartRateBpm ?? null,
        respiratoryRateBpm: visit.respiratoryRateBpm ?? null,
        capillaryRefillTime: visit.capillaryRefillTime || null,
        mucousMembrane: visit.mucousMembrane || null,
        bodyConditionScore: visit.bodyConditionScore ?? null,
      },
      subjective: visit.subjective || null,
      objective: visit.objective || null,
      assessment: visit.assessment || null,
      plan: visit.plan || null,
      treatmentSummary: visit.treatmentSummary || null,
      dischargeNotes: visit.dischargeNotes || null,
      followUpDate: visit.followUpDate ? visit.followUpDate.toISOString() : null,
      followUpReason: visit.followUpReason || null,
      visitedAt: visit.visitedAt.toISOString(),
      completedAt: visit.completedAt ? visit.completedAt.toISOString() : null,
      createdAt: visit.createdAt.toISOString(),
      prescriptionsCount: visit._count?.prescriptions || 0,
      treatmentsCount: visit._count?.treatments || 0,
    };
  }
}
