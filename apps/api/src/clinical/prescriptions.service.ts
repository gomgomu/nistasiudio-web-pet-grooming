import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { DispensePrescriptionsDto } from './dto/dispense-prescriptions.dto';
import {
  PrescriptionItem,
  PrescriptionLabelData,
} from '@petflow/types';

@Injectable()
export class PrescriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all prescriptions for a clinic visit
   */
  async getPrescriptionsByVisitId(
    tenantId: string,
    visitId: string
  ): Promise<PrescriptionItem[]> {
    const visit = await this.prisma.clinicVisit.findFirst({
      where: { id: visitId, tenantId },
    });

    if (!visit) {
      throw new NotFoundException('Clinic visit not found');
    }

    const prescriptions = await this.prisma.prescription.findMany({
      where: {
        tenantId,
        clinicVisitId: visitId,
      },
      include: {
        product: true,
        dispensedBy: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return prescriptions.map((p) => this.mapToPrescriptionItem(p));
  }

  /**
   * Create a new prescription item under a visit
   */
  async createPrescription(
    tenantId: string,
    visitId: string,
    dto: CreatePrescriptionDto
  ): Promise<PrescriptionItem> {
    const visit = await this.prisma.clinicVisit.findFirst({
      where: { id: visitId, tenantId },
    });

    if (!visit) {
      throw new NotFoundException('Clinic visit not found');
    }

    let priceMinor = BigInt(dto.priceMinor ?? 0);

    if (dto.productId) {
      const product = await this.prisma.product.findFirst({
        where: { id: dto.productId, tenantId },
      });
      if (!product) {
        throw new NotFoundException('Linked product not found in your organization');
      }
      if (dto.priceMinor === undefined) {
        priceMinor = product.salePriceMinor * BigInt(Math.ceil(dto.quantity));
      }
    }

    const prescription = await this.prisma.prescription.create({
      data: {
        tenantId,
        clinicVisitId: visitId,
        productId: dto.productId || null,
        medicationName: dto.medicationName,
        genericName: dto.genericName || null,
        dosageForm: dto.dosageForm || null,
        strength: dto.strength || null,
        dosagePerKg: dto.dosagePerKg ?? null,
        calculatedDose: dto.calculatedDose || null,
        route: dto.route || null,
        frequency: dto.frequency || null,
        duration: dto.duration || null,
        quantity: dto.quantity,
        unit: dto.unit || 'ชิ้น',
        instruction: dto.instruction || null,
        cautionNotes: dto.cautionNotes || null,
        priceMinor,
        isDispensed: false,
      },
      include: {
        product: true,
        dispensedBy: true,
      },
    });

    return this.mapToPrescriptionItem(prescription);
  }

  /**
   * Update prescription details
   */
  async updatePrescription(
    tenantId: string,
    prescriptionId: string,
    dto: UpdatePrescriptionDto
  ): Promise<PrescriptionItem> {
    const existing = await this.prisma.prescription.findFirst({
      where: { id: prescriptionId, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Prescription not found');
    }

    const updated = await this.prisma.prescription.update({
      where: { id: prescriptionId },
      data: {
        productId: dto.productId !== undefined ? dto.productId : existing.productId,
        medicationName:
          dto.medicationName !== undefined ? dto.medicationName : existing.medicationName,
        genericName:
          dto.genericName !== undefined ? dto.genericName : existing.genericName,
        dosageForm: dto.dosageForm !== undefined ? dto.dosageForm : existing.dosageForm,
        strength: dto.strength !== undefined ? dto.strength : existing.strength,
        dosagePerKg: dto.dosagePerKg !== undefined ? dto.dosagePerKg : existing.dosagePerKg,
        calculatedDose:
          dto.calculatedDose !== undefined ? dto.calculatedDose : existing.calculatedDose,
        route: dto.route !== undefined ? dto.route : existing.route,
        frequency: dto.frequency !== undefined ? dto.frequency : existing.frequency,
        duration: dto.duration !== undefined ? dto.duration : existing.duration,
        quantity: dto.quantity !== undefined ? dto.quantity : existing.quantity,
        unit: dto.unit !== undefined ? dto.unit : existing.unit,
        instruction: dto.instruction !== undefined ? dto.instruction : existing.instruction,
        cautionNotes:
          dto.cautionNotes !== undefined ? dto.cautionNotes : existing.cautionNotes,
        priceMinor:
          dto.priceMinor !== undefined ? BigInt(dto.priceMinor) : existing.priceMinor,
      },
      include: {
        product: true,
        dispensedBy: true,
      },
    });

    return this.mapToPrescriptionItem(updated);
  }

  /**
   * Delete a prescription
   */
  async deletePrescription(
    tenantId: string,
    prescriptionId: string
  ): Promise<{ success: boolean }> {
    const existing = await this.prisma.prescription.findFirst({
      where: { id: prescriptionId, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Prescription not found');
    }

    await this.prisma.prescription.delete({
      where: { id: prescriptionId },
    });

    return { success: true };
  }

  /**
   * Dispense prescriptions and optionally deduct inventory stock
   */
  async dispensePrescriptions(
    tenantId: string,
    visitId: string,
    dto: DispensePrescriptionsDto,
    dispensedByUserId?: string
  ): Promise<{ dispensedCount: number; prescriptions: PrescriptionItem[] }> {
    const visit = await this.prisma.clinicVisit.findFirst({
      where: { id: visitId, tenantId },
    });

    if (!visit) {
      throw new NotFoundException('Clinic visit not found');
    }

    const branchId = dto.branchId || visit.branchId;

    const where: any = {
      tenantId,
      clinicVisitId: visitId,
      isDispensed: false,
    };

    if (dto.prescriptionIds && dto.prescriptionIds.length > 0) {
      where.id = { in: dto.prescriptionIds };
    }

    const pending = await this.prisma.prescription.findMany({
      where,
      include: { product: true },
    });

    const now = new Date();
    const updatedPrescriptions: any[] = [];

    // Transaction for atomic dispensing and inventory transaction logging
    await this.prisma.$transaction(async (tx) => {
      for (const p of pending) {
        const updated = await tx.prescription.update({
          where: { id: p.id },
          data: {
            isDispensed: true,
            dispensedAt: now,
            dispensedById: dispensedByUserId || null,
          },
          include: {
            product: true,
            dispensedBy: true,
          },
        });
        updatedPrescriptions.push(updated);

        // Deduct inventory stock if requested and product exists
        if (dto.deductStock !== false && p.productId && branchId) {
          const qty = Number(p.quantity);
          await tx.inventoryTransaction.create({
            data: {
              tenantId,
              branchId,
              productId: p.productId,
              type: 'CONSUMPTION',
              quantity: -Math.abs(qty),
              referenceType: 'CLINIC_VISIT',
              referenceId: visitId,
            },
          });
        }
      }
    });

    return {
      dispensedCount: updatedPrescriptions.length,
      prescriptions: updatedPrescriptions.map((p) => this.mapToPrescriptionItem(p)),
    };
  }

  /**
   * Generate standardized Thai medicine label data for printing
   */
  async generatePrescriptionLabel(
    tenantId: string,
    prescriptionId: string
  ): Promise<PrescriptionLabelData> {
    const prescription = await this.prisma.prescription.findFirst({
      where: { id: prescriptionId, tenantId },
      include: {
        clinicVisit: {
          include: {
            customer: true,
            pet: true,
            branch: true,
            veterinarian: true,
          },
        },
      },
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    const visit = prescription.clinicVisit;

    return {
      clinicName: visit.branch.name || 'PetFlow Clinic & Hospital',
      clinicPhone: visit.branch.phone || '',
      clinicAddress: visit.branch.address || '',
      visitNumber: visit.visitNumber || '',
      date: new Date().toLocaleDateString('th-TH'),
      petName: visit.pet.name,
      species: visit.pet.species,
      breed: visit.pet.breed || '',
      customerName: `${visit.customer.firstName} ${visit.customer.lastName}`,
      veterinarianName: visit.veterinarian
        ? `${visit.veterinarian.firstName} ${visit.veterinarian.lastName}`
        : '',
      medicationName: prescription.medicationName,
      genericName: prescription.genericName || '',
      strength: prescription.strength || '',
      quantity: Number(prescription.quantity),
      unit: prescription.unit || 'ชิ้น',
      route: prescription.route || 'รับประทาน',
      frequency: prescription.frequency || 'ตามแพทย์สั่ง',
      instruction:
        prescription.instruction ||
        `${prescription.route || 'รับประทาน'} ครั้งละ ${prescription.calculatedDose || '1 หน่วย'} ${prescription.frequency || 'วันละ 2 ครั้ง'}`,
      cautionNotes: prescription.cautionNotes || '',
    };
  }

  /**
   * Map Prisma Prescription entity to PrescriptionItem
   */
  private mapToPrescriptionItem(p: any): PrescriptionItem {
    return {
      id: p.id,
      tenantId: p.tenantId,
      clinicVisitId: p.clinicVisitId,
      productId: p.productId || null,
      productSku: p.product?.sku || null,
      medicationName: p.medicationName,
      genericName: p.genericName || null,
      dosageForm: p.dosageForm || null,
      strength: p.strength || null,
      dosagePerKg: p.dosagePerKg ? Number(p.dosagePerKg) : null,
      calculatedDose: p.calculatedDose || null,
      route: p.route || null,
      frequency: p.frequency || null,
      duration: p.duration || null,
      quantity: Number(p.quantity),
      unit: p.unit || 'ชิ้น',
      instruction: p.instruction || null,
      cautionNotes: p.cautionNotes || null,
      priceMinor: Number(p.priceMinor || 0),
      isDispensed: p.isDispensed,
      dispensedAt: p.dispensedAt ? p.dispensedAt.toISOString() : null,
      dispensedById: p.dispensedById || null,
      dispensedByName: p.dispensedBy
        ? `${p.dispensedBy.firstName} ${p.dispensedBy.lastName}`
        : null,
      createdAt: p.createdAt.toISOString(),
    };
  }
}
