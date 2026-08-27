import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  GroomingDueStatus,
  GroomingDueRules,
  GroomingDueSummary,
  GroomingDuePetItem,
  PaginatedResponse,
  PetSpecies,
} from '@petflow/types';
import { QueryGroomingDueDto, GroomingDueSortField } from './dto/query-grooming-due.dto';

const DEFAULT_GROOMING_RULES: Required<GroomingDueRules> = {
  defaultIntervalDays: 30,
  dogIntervalDays: 28,
  catIntervalDays: 45,
  otherIntervalDays: 35,
  upcomingDaysThreshold: 7,
  overdueDaysThreshold: 7,
  criticalOverdueDaysThreshold: 30,
  usePersonalizedInterval: true,
};

const DUE_STATUS_TEXT: Record<GroomingDueStatus, string> = {
  UPCOMING: 'ใกล้ถึงกำหนด (ภายใน 7 วัน)',
  DUE_NOW: 'ถึงกำหนดกรูมมิ่งแล้ว',
  OVERDUE: 'เกินกำหนด (8-30 วัน)',
  CRITICAL_OVERDUE: 'เกินกำหนดมาก (>30 วัน)',
  ON_TRACK: 'ยังไม่ถึงกำหนด',
};

@Injectable()
export class GroomingDueService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get summary overview of all grooming due metrics for a tenant
   */
  async getGroomingDueSummary(
    tenantId: string,
    customRules?: Partial<GroomingDueRules>
  ): Promise<GroomingDueSummary> {
    const rules = this.resolveRules(customRules);
    const pets = await this.calculateAllPetDueStatuses(tenantId, rules);

    let upcomingCount = 0;
    let dueNowCount = 0;
    let overdueCount = 0;
    let criticalOverdueCount = 0;
    let onTrackCount = 0;
    let estimatedPotentialRevenueMinor = 0;

    for (const pet of pets) {
      if (pet.dueStatus === 'UPCOMING') upcomingCount++;
      else if (pet.dueStatus === 'DUE_NOW') dueNowCount++;
      else if (pet.dueStatus === 'OVERDUE') overdueCount++;
      else if (pet.dueStatus === 'CRITICAL_OVERDUE') criticalOverdueCount++;
      else if (pet.dueStatus === 'ON_TRACK') onTrackCount++;

      if (pet.dueStatus !== 'ON_TRACK') {
        estimatedPotentialRevenueMinor += pet.estimatedPriceMinor;
      }
    }

    const totalDueOrOverdue = upcomingCount + dueNowCount + overdueCount + criticalOverdueCount;

    return {
      totalGroomedPets: pets.length,
      upcomingCount,
      dueNowCount,
      overdueCount,
      criticalOverdueCount,
      onTrackCount,
      totalDueOrOverdue,
      estimatedPotentialRevenueMinor,
      rules,
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get paginated and filtered list of grooming due pets
   */
  async getGroomingDuePets(
    tenantId: string,
    query: QueryGroomingDueDto
  ): Promise<PaginatedResponse<GroomingDuePetItem>> {
    const rules = this.resolveRules({
      defaultIntervalDays: query.defaultIntervalDays,
      dogIntervalDays: query.dogIntervalDays,
      catIntervalDays: query.catIntervalDays,
      upcomingDaysThreshold: query.upcomingDaysThreshold,
      overdueDaysThreshold: query.overdueDaysThreshold,
      criticalOverdueDaysThreshold: query.criticalOverdueDaysThreshold,
      usePersonalizedInterval: query.usePersonalizedInterval,
    });

    let pets = await this.calculateAllPetDueStatuses(tenantId, rules);

    // Filter by due status
    if (query.status) {
      pets = pets.filter((p) => p.dueStatus === query.status);
    }

    // Filter by species
    if (query.species) {
      pets = pets.filter((p) => p.species === query.species);
    }

    // Filter by future booking presence
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
        return matchPet || matchBreed || matchCustomer || matchPhone;
      });
    }

    // Sort
    const sortBy = query.sortBy || GroomingDueSortField.DAYS_DIFFERENCE;
    const sortOrder = query.sortOrder || 'desc';
    const orderMultiplier = sortOrder === 'asc' ? 1 : -1;

    pets.sort((a, b) => {
      if (sortBy === GroomingDueSortField.DAYS_DIFFERENCE) {
        return (a.daysDifference - b.daysDifference) * orderMultiplier;
      }
      if (sortBy === GroomingDueSortField.LAST_GROOMED_AT) {
        const timeA = a.lastGroomedAt ? new Date(a.lastGroomedAt).getTime() : 0;
        const timeB = b.lastGroomedAt ? new Date(b.lastGroomedAt).getTime() : 0;
        return (timeA - timeB) * orderMultiplier;
      }
      if (sortBy === GroomingDueSortField.NEXT_DUE_AT) {
        const timeA = a.nextGroomingDueAt ? new Date(a.nextGroomingDueAt).getTime() : 0;
        const timeB = b.nextGroomingDueAt ? new Date(b.nextGroomingDueAt).getTime() : 0;
        return (timeA - timeB) * orderMultiplier;
      }
      if (sortBy === GroomingDueSortField.PET_NAME) {
        return a.petName.localeCompare(b.petName, 'th') * orderMultiplier;
      }
      if (sortBy === GroomingDueSortField.CUSTOMER_NAME) {
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

  // ---------------------------------------------------------------------------
  // Internal Grooming Due Engine Logic
  // ---------------------------------------------------------------------------

  private async calculateAllPetDueStatuses(
    tenantId: string,
    rules: Required<GroomingDueRules>
  ): Promise<GroomingDuePetItem[]> {
    const now = new Date();

    // Fetch all active pets with their customer, appointments, and queue items
    const pets = await this.prisma.pet.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      include: {
        customer: true,
        groomingProfile: true,
        appointments: {
          where: {
            status: { in: ['COMPLETED', 'CHECKED_IN', 'IN_PROGRESS', 'CONFIRMED', 'PENDING'] },
          },
          include: { service: true },
          orderBy: { startAt: 'desc' },
        },
        groomingQueueItems: {
          where: {
            status: { notIn: ['CANCELLED'] },
          },
          include: { service: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return pets.map((pet) => {
      const pastVisits: Array<{ date: Date; serviceName: string; priceMinor: number }> = [];
      let futureBookingAt: string | null = null;

      // Extract past and future appointments
      for (const apt of pet.appointments) {
        const aptDate = new Date(apt.startAt);
        if (aptDate.getTime() > now.getTime() && ['CONFIRMED', 'PENDING'].includes(apt.status)) {
          if (!futureBookingAt || aptDate.getTime() < new Date(futureBookingAt).getTime()) {
            futureBookingAt = aptDate.toISOString();
          }
        } else if (['COMPLETED', 'CHECKED_IN', 'IN_PROGRESS'].includes(apt.status)) {
          pastVisits.push({
            date: aptDate,
            serviceName: apt.service?.name || 'กรูมมิ่ง/อาบน้ำตัดขน',
            priceMinor: Number(apt.priceMinor || apt.service?.basePriceMinor || 50000),
          });
        }
      }

      // Extract past grooming queue items
      for (const q of pet.groomingQueueItems) {
        const qDate = q.pickedUpAt ? new Date(q.pickedUpAt) : (q.readyAt ? new Date(q.readyAt) : new Date(q.createdAt));
        if (qDate.getTime() <= now.getTime()) {
          pastVisits.push({
            date: qDate,
            serviceName: q.service?.name || 'กรูมมิ่ง/อาบน้ำตัดขน',
            priceMinor: Number(q.priceMinor || q.service?.basePriceMinor || 50000),
          });
        }
      }

      // Sort past visits descending
      pastVisits.sort((a, b) => b.date.getTime() - a.date.getTime());

      const lastVisit = pastVisits.length > 0 ? pastVisits[0] : null;
      const lastGroomedAt = lastVisit ? lastVisit.date.toISOString() : null;
      const lastServiceName = lastVisit ? lastVisit.serviceName : null;
      const estimatedPriceMinor = lastVisit ? lastVisit.priceMinor : 50000;

      const daysSinceLastGrooming = lastVisit
        ? Math.max(0, Math.floor((now.getTime() - lastVisit.date.getTime()) / (1000 * 60 * 60 * 24)))
        : null;

      // Calculate Cycle Days
      let cycleDays: number;
      let isPersonalizedCycle = false;

      // Check for personalized interval if pet has >= 2 past visits
      if (rules.usePersonalizedInterval && pastVisits.length >= 2) {
        let totalGaps = 0;
        let gapCount = 0;
        for (let i = 0; i < Math.min(pastVisits.length - 1, 4); i++) {
          const gap = Math.floor((pastVisits[i].date.getTime() - pastVisits[i + 1].date.getTime()) / (1000 * 60 * 60 * 24));
          if (gap >= 7 && gap <= 120) {
            totalGaps += gap;
            gapCount++;
          }
        }
        if (gapCount > 0) {
          cycleDays = Math.round(totalGaps / gapCount);
          isPersonalizedCycle = true;
        } else {
          cycleDays = this.getSpeciesDefaultInterval(pet.species as PetSpecies, rules);
        }
      } else {
        cycleDays = this.getSpeciesDefaultInterval(pet.species as PetSpecies, rules);
      }

      // Calculate Next Due Date and Days Difference
      let nextGroomingDueAt: string | null = null;
      let daysDifference: number;
      let dueStatus: GroomingDueStatus;

      if (lastVisit) {
        const dueDate = new Date(lastVisit.date.getTime() + cycleDays * 24 * 60 * 60 * 1000);
        nextGroomingDueAt = dueDate.toISOString();
        daysDifference = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDifference > rules.criticalOverdueDaysThreshold) {
          dueStatus = 'CRITICAL_OVERDUE';
        } else if (daysDifference > rules.overdueDaysThreshold) {
          dueStatus = 'OVERDUE';
        } else if (daysDifference >= 0) {
          dueStatus = 'DUE_NOW';
        } else if (daysDifference >= -rules.upcomingDaysThreshold) {
          dueStatus = 'UPCOMING';
        } else {
          dueStatus = 'ON_TRACK';
        }
      } else {
        // Never groomed before: use pet registration/creation date
        const regDays = Math.max(0, Math.floor((now.getTime() - new Date(pet.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
        const dueDate = new Date(new Date(pet.createdAt).getTime() + cycleDays * 24 * 60 * 60 * 1000);
        nextGroomingDueAt = dueDate.toISOString();
        daysDifference = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        if (regDays <= rules.upcomingDaysThreshold) {
          dueStatus = 'ON_TRACK';
        } else if (daysDifference > rules.criticalOverdueDaysThreshold) {
          dueStatus = 'CRITICAL_OVERDUE';
        } else if (daysDifference > rules.overdueDaysThreshold) {
          dueStatus = 'OVERDUE';
        } else if (daysDifference >= 0) {
          dueStatus = 'DUE_NOW';
        } else {
          dueStatus = 'UPCOMING';
        }
      }

      // Format recommended LINE / SMS notification message in Thai
      const recommendedMessage = this.generateRecommendedMessage({
        customerFirstName: pet.customer.firstName,
        petName: pet.name,
        dueStatus,
        daysDifference,
        lastGroomedAt,
        hasFutureBooking: !!futureBookingAt,
      });

      return {
        petId: pet.id,
        petName: pet.name,
        species: pet.species as PetSpecies,
        breed: pet.breed,
        photoUrl: pet.photoUrl,
        specialRequirements: pet.specialRequirements || pet.groomingProfile?.warnings,
        customerId: pet.customer.id,
        customerName: `${pet.customer.firstName} ${pet.customer.lastName}`.trim(),
        customerPhone: pet.customer.phone,
        lineUserId: pet.customer.lineUserId,
        marketingStatus: (pet.customer.marketingStatus as any) || 'OPTED_IN',
        lastGroomedAt,
        lastServiceName,
        daysSinceLastGrooming,
        cycleDays,
        isPersonalizedCycle,
        totalGroomingVisits: pastVisits.length,
        nextGroomingDueAt,
        daysDifference,
        dueStatus,
        dueStatusText: DUE_STATUS_TEXT[dueStatus],
        hasFutureBooking: !!futureBookingAt,
        futureBookingAt,
        estimatedPriceMinor,
        recommendedMessage,
      };
    });
  }

  private getSpeciesDefaultInterval(species: PetSpecies, rules: Required<GroomingDueRules>): number {
    switch (species) {
      case 'DOG':
        return rules.dogIntervalDays;
      case 'CAT':
        return rules.catIntervalDays;
      default:
        return rules.otherIntervalDays;
    }
  }

  private generateRecommendedMessage(params: {
    customerFirstName: string;
    petName: string;
    dueStatus: GroomingDueStatus;
    daysDifference: number;
    lastGroomedAt: string | null;
    hasFutureBooking: boolean;
  }): string {
    if (params.hasFutureBooking) {
      return `สวัสดีครับคุณ ${params.customerFirstName} น้อง ${params.petName} มีนัดหมายกรูมมิ่งล่วงหน้าเรียบร้อยแล้ว แล้วพบกันนะครับ 🐾`;
    }

    if (params.dueStatus === 'UPCOMING') {
      const remainingDays = Math.abs(params.daysDifference);
      return `สวัสดีครับคุณ ${params.customerFirstName} อีก ${remainingDays} วันจะครบกำหนดกรูมมิ่งน้อง ${params.petName} แล้วนะครับ จองคิวล่วงหน้าเพื่อเลือกเวลากับช่างประจำได้เลยครับ ✨`;
    }

    if (params.dueStatus === 'DUE_NOW') {
      return `สวัสดีครับคุณ ${params.customerFirstName} น้อง ${params.petName} ถึงรอบกรูมมิ่งและอาบน้ำดูแลขนแล้วนะครับ สะดวกพามาวันไหนสามารถนัดหมายเวลาได้เลยครับ 🐶🛁`;
    }

    if (params.dueStatus === 'OVERDUE') {
      return `สวัสดีครับคุณ ${params.customerFirstName} น้อง ${params.petName} เลยรอบกรูมมิ่งมา ${params.daysDifference} วันแล้วครับ เพื่อสุขภาพขนและผิวหนังที่ดี จองคิวรับบริการสัปดาห์นี้รับบริการตัดเล็บฟรีครับ ✂️`;
    }

    if (params.dueStatus === 'CRITICAL_OVERDUE') {
      return `สวัสดีครับคุณ ${params.customerFirstName} ทาง PetFlow คิดถึงน้อง ${params.petName} มากเลยครับ! มอบส่วนลดพิเศษ 100 บาทสำหรับการนัดหมายกรูมมิ่งรอบนี้ครับ 💖`;
    }

    return `สวัสดีครับคุณ ${params.customerFirstName} ทางร้านยินดีให้บริการดูแลน้อง ${params.petName} เสมอนะครับ 🐾`;
  }

  private resolveRules(custom?: Partial<GroomingDueRules>): Required<GroomingDueRules> {
    return {
      defaultIntervalDays: custom?.defaultIntervalDays ?? DEFAULT_GROOMING_RULES.defaultIntervalDays,
      dogIntervalDays: custom?.dogIntervalDays ?? DEFAULT_GROOMING_RULES.dogIntervalDays,
      catIntervalDays: custom?.catIntervalDays ?? DEFAULT_GROOMING_RULES.catIntervalDays,
      otherIntervalDays: custom?.otherIntervalDays ?? DEFAULT_GROOMING_RULES.otherIntervalDays,
      upcomingDaysThreshold: custom?.upcomingDaysThreshold ?? DEFAULT_GROOMING_RULES.upcomingDaysThreshold,
      overdueDaysThreshold: custom?.overdueDaysThreshold ?? DEFAULT_GROOMING_RULES.overdueDaysThreshold,
      criticalOverdueDaysThreshold: custom?.criticalOverdueDaysThreshold ?? DEFAULT_GROOMING_RULES.criticalOverdueDaysThreshold,
      usePersonalizedInterval: custom?.usePersonalizedInterval ?? DEFAULT_GROOMING_RULES.usePersonalizedInterval,
    };
  }
}
