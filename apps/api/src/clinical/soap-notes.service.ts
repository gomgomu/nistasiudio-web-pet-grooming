import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSoapNoteDto } from './dto/update-soap-note.dto';
import { AddClinicAttachmentDto } from './dto/add-clinic-attachment.dto';
import {
  SoapNoteData,
  ClinicAttachmentItem,
  SoapNoteHistoryEntry,
} from '@petflow/types';

@Injectable()
export class SoapNotesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get structured SOAP note for a clinic visit including attachments & version history
   */
  async getSoapNoteByVisitId(
    tenantId: string,
    visitId: string
  ): Promise<SoapNoteData> {
    const visit = await this.prisma.clinicVisit.findFirst({
      where: {
        id: visitId,
        tenantId,
      },
      include: {
        customer: true,
        pet: true,
        veterinarian: true,
        attachments: {
          orderBy: { uploadedAt: 'desc' },
        },
        medicalRecords: {
          where: { recordType: 'SOAP' },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!visit) {
      throw new NotFoundException('Clinic visit not found');
    }

    const historyEntries: SoapNoteHistoryEntry[] = (visit.medicalRecords || []).map((mr) => {
      let parsed: any = {};
      try {
        parsed = JSON.parse(mr.content);
      } catch {
        parsed = { text: mr.content };
      }

      return {
        id: mr.id,
        recordType: mr.recordType,
        authorName: parsed.authorName || 'สัตวแพทย์ผู้ตรวจ',
        createdAt: mr.createdAt.toISOString(),
        summary: parsed.authorNote || parsed.diagnosis || 'บันทึกประวัติการรักษา SOAP',
        snapshot: parsed,
      };
    });

    return {
      visitId: visit.id,
      visitNumber: visit.visitNumber || null,
      petId: visit.petId,
      petName: visit.pet.name,
      species: visit.pet.species,
      breed: visit.pet.breed || null,
      customerId: visit.customerId,
      customerName: `${visit.customer.firstName} ${visit.customer.lastName}`,
      veterinarianId: visit.veterinarianId || null,
      veterinarianName: visit.veterinarian
        ? `${visit.veterinarian.firstName} ${visit.veterinarian.lastName}`
        : null,
      visitType: visit.visitType,
      status: visit.status,
      visitedAt: visit.visitedAt.toISOString(),
      chiefComplaint: visit.chiefComplaint || null,
      symptoms: visit.symptoms || null,
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
      diagnosis: visit.diagnosis || null,
      differentialDiagnosis: visit.differentialDiagnosis || null,
      treatmentSummary: visit.treatmentSummary || null,
      dischargeNotes: visit.dischargeNotes || null,
      followUpDate: visit.followUpDate ? visit.followUpDate.toISOString() : null,
      followUpReason: visit.followUpReason || null,
      attachments: (visit.attachments || []).map((att) => ({
        id: att.id,
        tenantId: att.tenantId,
        clinicVisitId: att.clinicVisitId,
        attachmentType: att.attachmentType,
        fileUrl: att.fileUrl,
        fileName: att.fileName || null,
        caption: att.caption || null,
        uploadedAt: att.uploadedAt.toISOString(),
      })),
      historyEntries,
    };
  }

  /**
   * Update SOAP note with structured fields and create append-only audit snapshot
   */
  async updateSoapNote(
    tenantId: string,
    visitId: string,
    dto: UpdateSoapNoteDto,
    authorUserId?: string,
    authorName?: string
  ): Promise<SoapNoteData> {
    const existing = await this.prisma.clinicVisit.findFirst({
      where: { id: visitId, tenantId },
      include: { pet: true },
    });

    if (!existing) {
      throw new NotFoundException('Clinic visit not found');
    }

    // 1. Update Pet weight if provided
    if (dto.vitals?.weightKg) {
      await this.prisma.pet.update({
        where: { id: existing.petId },
        data: { weight: dto.vitals.weightKg },
      });
    }

    // 2. Update ClinicVisit record
    const updated = await this.prisma.clinicVisit.update({
      where: { id: visitId },
      data: {
        subjective: dto.subjective !== undefined ? dto.subjective : existing.subjective,
        objective: dto.objective !== undefined ? dto.objective : existing.objective,
        assessment: dto.assessment !== undefined ? dto.assessment : existing.assessment,
        plan: dto.plan !== undefined ? dto.plan : existing.plan,
        chiefComplaint:
          dto.chiefComplaint !== undefined ? dto.chiefComplaint : existing.chiefComplaint,
        symptoms: dto.symptoms !== undefined ? dto.symptoms : existing.symptoms,
        diagnosis: dto.diagnosis !== undefined ? dto.diagnosis : existing.diagnosis,
        differentialDiagnosis:
          dto.differentialDiagnosis !== undefined
            ? dto.differentialDiagnosis
            : existing.differentialDiagnosis,
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
        veterinarianId:
          dto.veterinarianId !== undefined ? dto.veterinarianId : existing.veterinarianId,
        status: dto.status ?? existing.status,
      },
    });

    // 3. Create non-destructive append-only history record (PetMedicalRecord)
    const snapshot = {
      authorUserId: authorUserId || null,
      authorName: authorName || 'สัตวแพทย์',
      authorNote: dto.authorNote || 'บันทึก/ปรับปรุงข้อมูล SOAP Note',
      savedAt: new Date().toISOString(),
      subjective: updated.subjective,
      objective: updated.objective,
      assessment: updated.assessment,
      plan: updated.plan,
      diagnosis: updated.diagnosis,
      vitals: {
        weightKg: updated.weightKg ? Number(updated.weightKg) : null,
        temperatureC: updated.temperatureC ? Number(updated.temperatureC) : null,
        heartRateBpm: updated.heartRateBpm,
        respiratoryRateBpm: updated.respiratoryRateBpm,
      },
    };

    await this.prisma.petMedicalRecord.create({
      data: {
        petId: existing.petId,
        clinicVisitId: visitId,
        recordType: 'SOAP',
        content: JSON.stringify(snapshot),
      },
    });

    return this.getSoapNoteByVisitId(tenantId, visitId);
  }

  /**
   * Get comprehensive chronological medical history for a pet
   */
  async getPetMedicalHistory(tenantId: string, petId: string) {
    const pet = await this.prisma.pet.findFirst({
      where: { id: petId, tenantId },
      include: {
        customer: true,
        clinicVisits: {
          orderBy: { visitedAt: 'desc' },
          include: {
            veterinarian: true,
            prescriptions: true,
            treatments: true,
            attachments: true,
          },
        },
        vaccinations: {
          orderBy: { administeredAt: 'desc' },
        },
        medicalRecords: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!pet) {
      throw new NotFoundException('Pet not found in your organization');
    }

    return {
      pet: {
        id: pet.id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        weight: pet.weight ? Number(pet.weight) : null,
        allergies: pet.allergies,
        customerName: `${pet.customer.firstName} ${pet.customer.lastName}`,
        customerPhone: pet.customer.phone,
      },
      visitsCount: pet.clinicVisits.length,
      visits: pet.clinicVisits.map((v) => ({
        id: v.id,
        visitNumber: v.visitNumber,
        visitType: v.visitType,
        status: v.status,
        visitedAt: v.visitedAt.toISOString(),
        veterinarianName: v.veterinarian
          ? `${v.veterinarian.firstName} ${v.veterinarian.lastName}`
          : null,
        chiefComplaint: v.chiefComplaint,
        diagnosis: v.diagnosis,
        vitals: {
          weightKg: v.weightKg ? Number(v.weightKg) : null,
          temperatureC: v.temperatureC ? Number(v.temperatureC) : null,
        },
        subjective: v.subjective,
        objective: v.objective,
        assessment: v.assessment,
        plan: v.plan,
        prescriptions: v.prescriptions,
        treatments: v.treatments,
        attachmentsCount: v.attachments.length,
      })),
      vaccinations: pet.vaccinations.map((vac) => ({
        id: vac.id,
        vaccineName: vac.vaccineName,
        lotNumber: vac.lotNumber,
        administeredAt: vac.administeredAt.toISOString(),
        nextDueAt: vac.nextDueAt ? vac.nextDueAt.toISOString() : null,
      })),
    };
  }

  /**
   * Add clinical photo / document attachment to a visit
   */
  async addClinicAttachment(
    tenantId: string,
    visitId: string,
    dto: AddClinicAttachmentDto
  ): Promise<ClinicAttachmentItem> {
    const visit = await this.prisma.clinicVisit.findFirst({
      where: { id: visitId, tenantId },
    });

    if (!visit) {
      throw new NotFoundException('Clinic visit not found');
    }

    const attachment = await this.prisma.clinicAttachment.create({
      data: {
        tenantId,
        clinicVisitId: visitId,
        attachmentType: dto.attachmentType,
        fileUrl: dto.fileUrl,
        fileName: dto.fileName || null,
        caption: dto.caption || null,
      },
    });

    return {
      id: attachment.id,
      tenantId: attachment.tenantId,
      clinicVisitId: attachment.clinicVisitId,
      attachmentType: attachment.attachmentType,
      fileUrl: attachment.fileUrl,
      fileName: attachment.fileName,
      caption: attachment.caption,
      uploadedAt: attachment.uploadedAt.toISOString(),
    };
  }

  /**
   * Get all clinical attachments for a visit
   */
  async getClinicAttachments(
    tenantId: string,
    visitId: string
  ): Promise<ClinicAttachmentItem[]> {
    const attachments = await this.prisma.clinicAttachment.findMany({
      where: {
        tenantId,
        clinicVisitId: visitId,
      },
      orderBy: { uploadedAt: 'desc' },
    });

    return attachments.map((a) => ({
      id: a.id,
      tenantId: a.tenantId,
      clinicVisitId: a.clinicVisitId,
      attachmentType: a.attachmentType,
      fileUrl: a.fileUrl,
      fileName: a.fileName,
      caption: a.caption,
      uploadedAt: a.uploadedAt.toISOString(),
    }));
  }

  /**
   * Delete clinical attachment
   */
  async deleteClinicAttachment(
    tenantId: string,
    attachmentId: string
  ): Promise<{ success: boolean }> {
    const attachment = await this.prisma.clinicAttachment.findFirst({
      where: { id: attachmentId, tenantId },
    });

    if (!attachment) {
      throw new NotFoundException('Clinic attachment not found');
    }

    await this.prisma.clinicAttachment.delete({
      where: { id: attachmentId },
    });

    return { success: true };
  }
}
