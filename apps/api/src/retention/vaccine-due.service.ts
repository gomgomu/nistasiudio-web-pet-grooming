import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  VaccineDueStatus,
  VaccineDueRules,
  VaccineDueSummary,
  VaccineDuePetItem,
  PaginatedResponse,
  PetSpecies,
} from '@petflow/types';
import { QueryVaccineDueDto, VaccineDueSortField } from './dto/query-vaccine-due.dto';
import { CreatePetVaccinationDto } from './dto/record-vaccination.dto';

const DEFAULT_VACCINE_RULES: Required<VaccineDueRules> = {
  annualIntervalDays: 365,
  puppyIntervalDays: 28,
  upcomingDaysThreshold: 30,
  dueNowDaysThreshold: 14,
  overdueDaysThreshold: 15,
  criticalOverdueDaysThreshold: 60,
};

const DUE_STATUS_TEXT: Record<VaccineDueStatus, string> = {
  UPCOMING: 'ใกล้ถึงกำหนด (ใน 30 วัน)',
  DUE_NOW: 'ถึงกำหนดฉีดวัคซีนแล้ว',
  OVERDUE: 'เกินกำหนดฉีด (15-60 วัน)',
  CRITICAL_OVERDUE: 'เกินกำหนดมาก (>60 วัน)',
  UP_TO_DATE: 'ได้รับวัคซีนครบตามกำหนด',
};

const DEFAULT_VACCINES: Record<PetSpecies, string> = {
  DOG: 'วัคซีนรวมสุนัข 5 โรค (DHPPi) & พิษสุนัขบ้า',
  CAT: 'วัคซีนรวมไข้หัด-หวัดแมว (FVRCP) & พิษสุนัขบ้า',
  BIRD: 'ตรวจสุขภาพ & โปรแกรมถ่ายพยาธิ',
  RABBIT: 'ตรวจสุขภาพ & วัคซีนกระต่าย',
  OTHER: 'ตรวจสุขภาพประจำปี',
};

@Injectable()
export class VaccineDueService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get summary overview of all vaccine due metrics for a tenant
   */
  async getVaccineDueSummary(
    tenantId: string,
    customRules?: Partial<VaccineDueRules>
  ): Promise<VaccineDueSummary> {
    const rules = this.resolveRules(customRules);
    const pets = await this.calculateAllPetVaccineDueStatuses(tenantId, rules);

    let upcomingCount = 0;
    let dueNowCount = 0;
    let overdueCount = 0;
    let criticalOverdueCount = 0;
    let upToDateCount = 0;
    let estimatedPotentialRevenueMinor = 0;

    for (const pet of pets) {
      if (pet.dueStatus === 'UPCOMING') upcomingCount++;
      else if (pet.dueStatus === 'DUE_NOW') dueNowCount++;
      else if (pet.dueStatus === 'OVERDUE') overdueCount++;
      else if (pet.dueStatus === 'CRITICAL_OVERDUE') criticalOverdueCount++;
      else if (pet.dueStatus === 'UP_TO_DATE') upToDateCount++;

      if (pet.dueStatus !== 'UP_TO_DATE') {
        estimatedPotentialRevenueMinor += pet.estimatedPriceMinor;
      }
    }

    const totalDueOrOverdue = upcomingCount + dueNowCount + overdueCount + criticalOverdueCount;

    return {
      totalVaccinatedPets: pets.length,
      upcomingCount,
      dueNowCount,
      overdueCount,
      criticalOverdueCount,
      upToDateCount,
      totalDueOrOverdue,
      estimatedPotentialRevenueMinor,
      rules,
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get paginated and filtered list of vaccine due pets
   */
  async getVaccineDuePets(
    tenantId: string,
    query: QueryVaccineDueDto
  ): Promise<PaginatedResponse<VaccineDuePetItem>> {
    const rules = this.resolveRules({
      annualIntervalDays: query.annualIntervalDays,
      upcomingDaysThreshold: query.upcomingDaysThreshold,
      dueNowDaysThreshold: query.dueNowDaysThreshold,
      criticalOverdueDaysThreshold: query.criticalOverdueDaysThreshold,
    });

    let pets = await this.calculateAllPetVaccineDueStatuses(tenantId, rules);

    // Filter by status
    if (query.status) {
      pets = pets.filter((p) => p.dueStatus === query.status);
    }

    // Filter by species
    if (query.species) {
      pets = pets.filter((p) => p.species === query.species);
    }

    // Filter by vaccine name / type
    if (query.vaccineType && query.vaccineType.trim()) {
      const v = query.vaccineType.toLowerCase().trim();
      pets = pets.filter((p) => p.vaccineName.toLowerCase().includes(v));
    }

    // Filter by future booking status
    if (query.hasFutureBooking !== undefined) {
      pets = pets.filter((p) => p.hasFutureBooking === query.hasFutureBooking);
    }

    // Filter by search keyword
    if (query.search && query.search.trim()) {
      const s = query.search.toLowerCase().trim();
      pets = pets.filter((p) => {
        const matchPet = p.petName.toLowerCase().includes(s);
        const matchBreed = p.breed ? p.breed.toLowerCase().includes(s) : false;
        const matchCustomer = p.customerName.toLowerCase().includes(s);
        const matchPhone = p.customerPhone.includes(s);
        const matchVaccine = p.vaccineName.toLowerCase().includes(s);
        return matchPet || matchBreed || matchCustomer || matchPhone || matchVaccine;
      });
    }

    // Sort
    const sortBy = query.sortBy || VaccineDueSortField.DAYS_DIFFERENCE;
    const sortOrder = query.sortOrder || 'desc';
    const orderMultiplier = sortOrder === 'asc' ? 1 : -1;

    pets.sort((a, b) => {
      if (sortBy === VaccineDueSortField.DAYS_DIFFERENCE) {
        return (a.daysDifference - b.daysDifference) * orderMultiplier;
      }
      if (sortBy === VaccineDueSortField.NEXT_DUE_AT) {
        const timeA = a.nextDueAt ? new Date(a.nextDueAt).getTime() : 0;
        const timeB = b.nextDueAt ? new Date(b.nextDueAt).getTime() : 0;
        return (timeA - timeB) * orderMultiplier;
      }
      if (sortBy === VaccineDueSortField.LAST_ADMINISTERED_AT) {
        const timeA = a.administeredAt ? new Date(a.administeredAt).getTime() : 0;
        const timeB = b.administeredAt ? new Date(b.administeredAt).getTime() : 0;
        return (timeA - timeB) * orderMultiplier;
      }
      if (sortBy === VaccineDueSortField.PET_NAME) {
        return a.petName.localeCompare(b.petName, 'th') * orderMultiplier;
      }
      if (sortBy === VaccineDueSortField.CUSTOMER_NAME) {
        return a.customerName.localeCompare(b.customerName, 'th') * orderMultiplier;
      }
      return 0;
    });

    // Pagination
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const total = pets.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedItems = pets.slice(startIndex, startIndex + limit);

    return {
      success: true,
      data: paginatedItems,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Record a new pet vaccination (Veterinary preparation)
   */
  async recordVaccination(
    tenantId: string,
    dto: CreatePetVaccinationDto
  ) {
    const pet = await this.prisma.pet.findFirst({
      where: {
        id: dto.petId,
        tenantId,
      },
    });

    if (!pet) {
      throw new NotFoundException(`Pet with ID ${dto.petId} not found in this tenant`);
    }

    const administeredDate = dto.administeredAt ? new Date(dto.administeredAt) : new Date();
    const nextDueDate = dto.nextDueAt
      ? new Date(dto.nextDueAt)
      : new Date(administeredDate.getTime() + 365 * 24 * 60 * 60 * 1000);

    return this.prisma.petVaccination.create({
      data: {
        tenantId,
        petId: pet.id,
        vaccineName: dto.vaccineName,
        lotNumber: dto.lotNumber,
        administeredAt: administeredDate,
        nextDueAt: nextDueDate,
        clinicVisitId: dto.clinicVisitId,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Internal Calculation Engine
  // ---------------------------------------------------------------------------

  private async calculateAllPetVaccineDueStatuses(
    tenantId: string,
    rules: Required<VaccineDueRules>
  ): Promise<VaccineDuePetItem[]> {
    const now = new Date();

    // Fetch active pets with vaccinations, customer, and appointments
    const pets = await this.prisma.pet.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      include: {
        customer: true,
        vaccinations: {
          orderBy: { administeredAt: 'desc' },
        },
        appointments: {
          where: {
            status: { in: ['CONFIRMED', 'PENDING'] },
            startAt: { gte: now },
          },
          orderBy: { startAt: 'asc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const items: VaccineDuePetItem[] = [];

    for (const pet of pets) {
      const species = pet.species as PetSpecies;
      const futureBookingAt = pet.appointments.length > 0 ? pet.appointments[0].startAt.toISOString() : null;
      const hasFutureBooking = !!futureBookingAt;

      if (pet.vaccinations.length > 0) {
        // Group by vaccine name or take the latest administered records
        const latestVaccine = pet.vaccinations[0];

        const administeredAt = latestVaccine.administeredAt ? latestVaccine.administeredAt.toISOString() : null;
        let nextDueAtDate: Date;

        if (latestVaccine.nextDueAt) {
          nextDueAtDate = new Date(latestVaccine.nextDueAt);
        } else if (latestVaccine.administeredAt) {
          nextDueAtDate = new Date(new Date(latestVaccine.administeredAt).getTime() + rules.annualIntervalDays * 24 * 60 * 60 * 1000);
        } else {
          nextDueAtDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        }

        const nextDueAt = nextDueAtDate.toISOString();
        const daysDifference = Math.floor((now.getTime() - nextDueAtDate.getTime()) / (1000 * 60 * 60 * 24));

        let dueStatus: VaccineDueStatus;
        let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        let riskDescription: string;

        if (daysDifference > rules.criticalOverdueDaysThreshold) {
          dueStatus = 'CRITICAL_OVERDUE';
          riskLevel = 'CRITICAL';
          riskDescription = `ขาดวัคซีนเกิน ${daysDifference} วัน ภูมิคุ้มกันตก อาจต้องเริ่มโปรแกรมใหม่`;
        } else if (daysDifference > rules.dueNowDaysThreshold) {
          dueStatus = 'OVERDUE';
          riskLevel = 'HIGH';
          riskDescription = `เลยกำหนดฉีดกระตุ้นมา ${daysDifference} วัน ควรพามารับวัคซีนโดยเร็ว`;
        } else if (daysDifference >= 0) {
          dueStatus = 'DUE_NOW';
          riskLevel = 'MEDIUM';
          riskDescription = `ถึงรอบฉีดวัคซีนกระตุ้นประจำปี (เลยมา ${daysDifference} วัน)`;
        } else if (daysDifference >= -rules.upcomingDaysThreshold) {
          dueStatus = 'UPCOMING';
          riskLevel = 'LOW';
          riskDescription = `ใกล้ถึงรอบฉีดวัคซีนประจำปีในอีก ${Math.abs(daysDifference)} วัน`;
        } else {
          dueStatus = 'UP_TO_DATE';
          riskLevel = 'LOW';
          riskDescription = `ได้รับวัคซีนครบถ้วน (เหลืออีก ${Math.abs(daysDifference)} วัน)`;
        }

        const recommendedMessage = this.generateVaccineReminderMessage({
          customerFirstName: pet.customer.firstName,
          petName: pet.name,
          vaccineName: latestVaccine.vaccineName,
          dueStatus,
          daysDifference,
          hasFutureBooking,
        });

        items.push({
          vaccinationId: latestVaccine.id,
          petId: pet.id,
          petName: pet.name,
          species,
          breed: pet.breed,
          birthDate: pet.birthDate ? pet.birthDate.toISOString() : null,
          photoUrl: pet.photoUrl,
          customerId: pet.customer.id,
          customerName: `${pet.customer.firstName} ${pet.customer.lastName}`.trim(),
          customerPhone: pet.customer.phone,
          lineUserId: pet.customer.lineUserId,
          marketingStatus: (pet.customer.marketingStatus as any) || 'OPTED_IN',
          vaccineName: latestVaccine.vaccineName,
          lotNumber: latestVaccine.lotNumber,
          administeredAt,
          nextDueAt,
          daysDifference,
          dueStatus,
          dueStatusText: DUE_STATUS_TEXT[dueStatus],
          riskLevel,
          riskDescription,
          hasFutureBooking,
          futureBookingAt,
          estimatedPriceMinor: 45000, // standard vaccine price ~ 450 THB
          recommendedMessage,
        });
      } else {
        // Pet has no vaccine record: recommend core vaccine based on species
        const defaultVaccineName = DEFAULT_VACCINES[species] || 'วัคซีนและตรวจสุขภาพประจำปี';
        const regDays = Math.max(0, Math.floor((now.getTime() - new Date(pet.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
        const dueDate = new Date(new Date(pet.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000);
        const daysDifference = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        let dueStatus: VaccineDueStatus;
        let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        let riskDescription: string;

        if (regDays > 90) {
          dueStatus = 'OVERDUE';
          riskLevel = 'HIGH';
          riskDescription = 'ยังไม่มีประวัติการฉีดวัคซีนในระบบ ควรตรวจสุขภาพและรับวัคซีนป้องกันโรค';
        } else if (regDays > 30) {
          dueStatus = 'DUE_NOW';
          riskLevel = 'MEDIUM';
          riskDescription = 'ยังไม่มีบันทึกวัคซีน ควรเริ่มต้นโปรแกรมวัคซีนพื้นฐาน';
        } else {
          dueStatus = 'UPCOMING';
          riskLevel = 'LOW';
          riskDescription = 'สัตว์เลี้ยงลงทะเบียนใหม่ แนะนำนัดหมายรับวัคซีนเข็มแรก';
        }

        const recommendedMessage = this.generateVaccineReminderMessage({
          customerFirstName: pet.customer.firstName,
          petName: pet.name,
          vaccineName: defaultVaccineName,
          dueStatus,
          daysDifference,
          hasFutureBooking,
        });

        items.push({
          vaccinationId: null,
          petId: pet.id,
          petName: pet.name,
          species,
          breed: pet.breed,
          birthDate: pet.birthDate ? pet.birthDate.toISOString() : null,
          photoUrl: pet.photoUrl,
          customerId: pet.customer.id,
          customerName: `${pet.customer.firstName} ${pet.customer.lastName}`.trim(),
          customerPhone: pet.customer.phone,
          lineUserId: pet.customer.lineUserId,
          marketingStatus: (pet.customer.marketingStatus as any) || 'OPTED_IN',
          vaccineName: defaultVaccineName,
          lotNumber: null,
          administeredAt: null,
          nextDueAt: dueDate.toISOString(),
          daysDifference,
          dueStatus,
          dueStatusText: DUE_STATUS_TEXT[dueStatus],
          riskLevel,
          riskDescription,
          hasFutureBooking,
          futureBookingAt,
          estimatedPriceMinor: 45000,
          recommendedMessage,
        });
      }
    }

    return items;
  }

  private generateVaccineReminderMessage(params: {
    customerFirstName: string;
    petName: string;
    vaccineName: string;
    dueStatus: VaccineDueStatus;
    daysDifference: number;
    hasFutureBooking: boolean;
  }): string {
    if (params.hasFutureBooking) {
      return `สวัสดีครับคุณ ${params.customerFirstName} น้อง ${params.petName} มีนัดหมายตรวจสุขภาพ/วัคซีนล่วงหน้าเรียบร้อยแล้ว แล้วพบกันที่คลินิกนะครับ 🏥🐾`;
    }

    if (params.dueStatus === 'UPCOMING') {
      const days = Math.abs(params.daysDifference);
      return `สวัสดีครับคุณ ${params.customerFirstName} อีก ${days} วันจะถึงกำหนดฉีดกระตุ้น ${params.vaccineName} ของน้อง ${params.petName} แล้วนะครับ นัดหมายเวลาล่วงหน้าได้เลยครับ 💉`;
    }

    if (params.dueStatus === 'DUE_NOW') {
      return `สวัสดีครับคุณ ${params.customerFirstName} น้อง ${params.petName} ถึงรอบฉีด ${params.vaccineName} แล้วนะครับ เพื่อภูมิคุ้มกันที่ต่อเนื่อง สามารถนัดคิวตรวจสุขภาพและรับวัคซีนได้เลยครับ 🩺🐶`;
    }

    if (params.dueStatus === 'OVERDUE' || params.dueStatus === 'CRITICAL_OVERDUE') {
      return `สวัสดีครับคุณ ${params.customerFirstName} น้อง ${params.petName} เลยกำหนดฉีด ${params.vaccineName} มาแล้วครับ เพื่อความปลอดภัยจากโรคติดต่อ แนะนำพาน้องมาพบสัตวแพทย์เพื่อฉีดกระตุ้นภูมิคุ้มกันนะครับ 💖`;
    }

    return `สวัสดีครับคุณ ${params.customerFirstName} วัคซีนของน้อง ${params.petName} อยู่ในเกณฑ์ครบถ้วนสมบูรณ์ครับ 🐾`;
  }

  private resolveRules(custom?: Partial<VaccineDueRules>): Required<VaccineDueRules> {
    return {
      annualIntervalDays: custom?.annualIntervalDays ?? DEFAULT_VACCINE_RULES.annualIntervalDays,
      puppyIntervalDays: custom?.puppyIntervalDays ?? DEFAULT_VACCINE_RULES.puppyIntervalDays,
      upcomingDaysThreshold: custom?.upcomingDaysThreshold ?? DEFAULT_VACCINE_RULES.upcomingDaysThreshold,
      dueNowDaysThreshold: custom?.dueNowDaysThreshold ?? DEFAULT_VACCINE_RULES.dueNowDaysThreshold,
      overdueDaysThreshold: custom?.overdueDaysThreshold ?? DEFAULT_VACCINE_RULES.overdueDaysThreshold,
      criticalOverdueDaysThreshold: custom?.criticalOverdueDaysThreshold ?? DEFAULT_VACCINE_RULES.criticalOverdueDaysThreshold,
    };
  }
}
