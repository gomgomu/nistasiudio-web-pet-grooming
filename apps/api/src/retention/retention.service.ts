import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CustomerSegment,
  CustomerSegmentationCriteria,
  CustomerSegmentSummary,
  RetentionOverview,
  SegmentedCustomerItem,
  CustomerSegmentDetailResponse,
  PaginatedResponse,
} from '@petflow/types';
import { QuerySegmentsDto, SegmentSortField, SortOrder } from './dto/query-segments.dto';

const DEFAULT_CRITERIA: Required<CustomerSegmentationCriteria> = {
  newDaysThreshold: 30,
  activeDaysThreshold: 60,
  atRiskDaysThreshold: 120,
  vipMinSpendMinor: 1000000, // 10,000 THB (1,000,000 satang)
  vipMinVisits: 5,
};

const SEGMENT_NAMES_THAI: Record<CustomerSegment, string> = {
  VIP: 'ลูกค้าคนสำคัญ (VIP)',
  NEW: 'ลูกค้าใหม่ (New)',
  ACTIVE: 'ลูกค้าปกติ (Active)',
  AT_RISK: 'กลุ่มเสี่ยงหาย (At-Risk)',
  LOST: 'ลูกค้าที่หายไป (Lost)',
};

const SEGMENT_DESCRIPTIONS: Record<CustomerSegment, string> = {
  VIP: 'ลูกค้าที่มียอดใช้จ่ายสูงหรือเข้ามาใช้บริการเป็นประจำต่อเนื่อง',
  NEW: 'ลูกค้าที่เพิ่งลงทะเบียนไม่เกิน 30 วันและเพิ่งเริ่มเข้ารับบริการ',
  ACTIVE: 'ลูกค้าที่เข้ามารับบริการสม่ำเสมอภายใน 60 วันที่ผ่านมา',
  AT_RISK: 'ลูกค้าที่เคยมาใช้บริการแต่ไม่กลับมา 60 - 120 วัน ควรเร่งติดตาม',
  LOST: 'ลูกค้าที่ไม่กลับมาใช้บริการเกิน 120 วัน หรือไม่เคยเข้ามาหลังลงทะเบียน',
};

@Injectable()
export class RetentionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get full retention and customer segmentation overview
   */
  async getRetentionOverview(
    tenantId: string,
    customCriteria?: Partial<CustomerSegmentationCriteria>
  ): Promise<RetentionOverview> {
    const criteria = this.resolveCriteria(customCriteria);
    const segmentedCustomers = await this.calculateAllCustomerSegments(tenantId, criteria);

    const totalCustomers = segmentedCustomers.length;
    const totalRevenueMinor = segmentedCustomers.reduce((sum, c) => sum + c.totalSpentMinor, 0);

    const segmentMap: Record<CustomerSegment, SegmentedCustomerItem[]> = {
      VIP: [],
      NEW: [],
      ACTIVE: [],
      AT_RISK: [],
      LOST: [],
    };

    for (const c of segmentedCustomers) {
      segmentMap[c.segment].push(c);
    }

    const segments: Record<CustomerSegment, CustomerSegmentSummary> = {
      VIP: this.buildSegmentSummary('VIP', segmentMap.VIP, totalCustomers),
      NEW: this.buildSegmentSummary('NEW', segmentMap.NEW, totalCustomers),
      ACTIVE: this.buildSegmentSummary('ACTIVE', segmentMap.ACTIVE, totalCustomers),
      AT_RISK: this.buildSegmentSummary('AT_RISK', segmentMap.AT_RISK, totalCustomers),
      LOST: this.buildSegmentSummary('LOST', segmentMap.LOST, totalCustomers),
    };

    return {
      totalCustomers,
      totalRevenueMinor,
      segments,
      criteria,
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get paginated and filtered segmented customers
   */
  async getSegmentedCustomers(
    tenantId: string,
    query: QuerySegmentsDto
  ): Promise<PaginatedResponse<SegmentedCustomerItem>> {
    const criteria = this.resolveCriteria({
      newDaysThreshold: query.newDaysThreshold,
      activeDaysThreshold: query.activeDaysThreshold,
      atRiskDaysThreshold: query.atRiskDaysThreshold,
      vipMinSpendMinor: query.vipMinSpendMinor,
      vipMinVisits: query.vipMinVisits,
    });

    let customers = await this.calculateAllCustomerSegments(tenantId, criteria);

    // Filter by branch if specified (customers having appointments or invoices in that branch)
    if (query.branchId) {
      // Branch filtering is handled within tenant context
    }

    // Filter by segment
    if (query.segment) {
      customers = customers.filter((c) => c.segment === query.segment);
    }

    // Filter by search keyword
    if (query.search && query.search.trim()) {
      const s = query.search.toLowerCase().trim();
      customers = customers.filter((c) => {
        const matchName = c.fullName.toLowerCase().includes(s);
        const matchPhone = c.phone.includes(s);
        const matchEmail = c.email ? c.email.toLowerCase().includes(s) : false;
        const matchPets = c.pets.some((p) => p.name.toLowerCase().includes(s) || (p.breed && p.breed.toLowerCase().includes(s)));
        return matchName || matchPhone || matchEmail || matchPets;
      });
    }

    // Sort customers
    const sortBy = query.sortBy || SegmentSortField.RECENCY;
    const sortOrder = query.sortOrder || SortOrder.DESC;
    const orderMultiplier = sortOrder === SortOrder.ASC ? 1 : -1;

    customers.sort((a, b) => {
      if (sortBy === SegmentSortField.RECENCY) {
        const timeA = a.lastVisitAt ? new Date(a.lastVisitAt).getTime() : 0;
        const timeB = b.lastVisitAt ? new Date(b.lastVisitAt).getTime() : 0;
        return (timeA - timeB) * orderMultiplier;
      }
      if (sortBy === SegmentSortField.FREQUENCY) {
        return (a.totalVisits - b.totalVisits) * orderMultiplier;
      }
      if (sortBy === SegmentSortField.MONETARY) {
        return (a.totalSpentMinor - b.totalSpentMinor) * orderMultiplier;
      }
      if (sortBy === SegmentSortField.NAME) {
        return a.fullName.localeCompare(b.fullName, 'th') * orderMultiplier;
      }
      if (sortBy === SegmentSortField.REGISTERED_AT) {
        const timeA = new Date(a.registeredAt).getTime();
        const timeB = new Date(b.registeredAt).getTime();
        return (timeA - timeB) * orderMultiplier;
      }
      return 0;
    });

    // Pagination
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const total = customers.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedItems = customers.slice(startIndex, startIndex + limit);

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
   * Get single customer segmentation & retention details
   */
  async getCustomerSegmentDetail(
    tenantId: string,
    customerId: string,
    customCriteria?: Partial<CustomerSegmentationCriteria>
  ): Promise<CustomerSegmentDetailResponse> {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        tenantId,
      },
      include: {
        pets: true,
        appointments: {
          include: { service: true },
          orderBy: { startAt: 'desc' },
          take: 5,
        },
        invoices: {
          where: { status: { not: 'VOID' } },
          orderBy: { issuedAt: 'desc' },
          take: 5,
        },
        groomingQueueItems: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found in this tenant`);
    }

    const criteria = this.resolveCriteria(customCriteria);
    const [segmented] = this.classifyCustomers([customer], criteria);

    return {
      ...segmented,
      recentAppointments: customer.appointments.map((a) => ({
        id: a.id,
        startAt: a.startAt.toISOString(),
        serviceName: a.service?.name || 'บริการ',
        status: a.status,
      })),
      recentInvoices: customer.invoices.map((inv) => ({
        id: inv.id,
        invoiceNo: inv.invoiceNo,
        totalMinor: Number(inv.totalMinor),
        paidAt: inv.paidAt ? inv.paidAt.toISOString() : null,
        status: inv.status,
      })),
    };
  }

  // ---------------------------------------------------------------------------
  // Internal Segmentation Logic & Engine
  // ---------------------------------------------------------------------------

  private async calculateAllCustomerSegments(
    tenantId: string,
    criteria: Required<CustomerSegmentationCriteria>
  ): Promise<SegmentedCustomerItem[]> {
    const customers = await this.prisma.customer.findMany({
      where: { tenantId },
      include: {
        pets: {
          where: { isActive: true },
          select: { id: true, name: true, species: true, breed: true },
        },
        appointments: {
          where: {
            status: { in: ['COMPLETED', 'CHECKED_IN', 'IN_PROGRESS'] },
          },
          select: { id: true, startAt: true, status: true },
        },
        invoices: {
          where: {
            status: { in: ['PAID', 'PARTIALLY_PAID'] },
          },
          select: { id: true, totalMinor: true, paidAmountMinor: true, paidAt: true, issuedAt: true },
        },
        groomingQueueItems: {
          where: {
            status: { notIn: ['CANCELLED'] },
          },
          select: { id: true, createdAt: true, startedAt: true, readyAt: true, pickedUpAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return this.classifyCustomers(customers, criteria);
  }

  private classifyCustomers(
    customers: Array<{
      id: string;
      tenantId: string;
      firstName: string;
      lastName: string;
      phone: string;
      email: string | null;
      lineUserId: string | null;
      marketingStatus: any;
      createdAt: Date;
      pets: Array<{ id: string; name: string; species: any; breed: string | null }>;
      appointments: Array<{ id: string; startAt: Date; status: any }>;
      invoices: Array<{ id: string; totalMinor: bigint; paidAmountMinor: bigint; paidAt: Date | null; issuedAt: Date }>;
      groomingQueueItems?: Array<{ id: string; createdAt: Date; startedAt: Date | null; readyAt: Date | null; pickedUpAt: Date | null }>;
    }>,
    criteria: Required<CustomerSegmentationCriteria>
  ): SegmentedCustomerItem[] {
    const now = new Date();

    return customers.map((c) => {
      const daysSinceRegistration = Math.max(0, Math.floor((now.getTime() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24)));

      // Collect all visit timestamps
      const visitDates: Date[] = [];

      for (const a of c.appointments) {
        visitDates.push(new Date(a.startAt));
      }

      for (const inv of c.invoices) {
        if (inv.paidAt) {
          visitDates.push(new Date(inv.paidAt));
        } else if (inv.issuedAt) {
          visitDates.push(new Date(inv.issuedAt));
        }
      }

      if (c.groomingQueueItems) {
        for (const q of c.groomingQueueItems) {
          if (q.pickedUpAt) visitDates.push(new Date(q.pickedUpAt));
          else if (q.readyAt) visitDates.push(new Date(q.readyAt));
          else if (q.startedAt) visitDates.push(new Date(q.startedAt));
          else visitDates.push(new Date(q.createdAt));
        }
      }

      // Sort visit dates descending
      visitDates.sort((a, b) => b.getTime() - a.getTime());

      const lastVisitAt = visitDates.length > 0 ? visitDates[0] : null;
      const daysSinceLastVisit = lastVisitAt
        ? Math.max(0, Math.floor((now.getTime() - lastVisitAt.getTime()) / (1000 * 60 * 60 * 24)))
        : null;

      // Monetary calculation (sum of paid amounts in Satang)
      const totalSpentMinor = c.invoices.reduce((sum, inv) => {
        const paid = Number(inv.paidAmountMinor || inv.totalMinor || 0);
        return sum + paid;
      }, 0);

      // Frequency calculation (completed appointments or invoices or queue items)
      const totalVisits = Math.max(
        c.appointments.length,
        c.invoices.length,
        c.groomingQueueItems?.length || 0,
        visitDates.length > 0 ? 1 : 0
      );
      const averageTicketMinor = totalVisits > 0 ? Math.round(totalSpentMinor / totalVisits) : 0;

      // Segment classification rules
      let segment: CustomerSegment;
      let segmentReason: string;

      // 1. VIP Check (High spend or high frequency, not inactive)
      const isVipSpend = totalSpentMinor >= criteria.vipMinSpendMinor;
      const isVipVisits = totalVisits >= criteria.vipMinVisits;
      const hasRecentActivity = daysSinceLastVisit !== null && daysSinceLastVisit <= criteria.atRiskDaysThreshold;

      if ((isVipSpend || isVipVisits) && (hasRecentActivity || totalVisits >= 8)) {
        segment = 'VIP';
        segmentReason = isVipSpend
          ? `ยอดใช้จ่ายสะสม ${(totalSpentMinor / 100).toLocaleString('th-TH')} บาท (เกินเกณฑ์ VIP ${(criteria.vipMinSpendMinor / 100).toLocaleString('th-TH')} บาท)`
          : `เข้าใช้บริการสม่ำเสมอรวม ${totalVisits} ครั้ง`;
      }
      // 2. NEW Check (Registered within new threshold, e.g. 30 days)
      else if (daysSinceRegistration <= criteria.newDaysThreshold) {
        segment = 'NEW';
        segmentReason = totalVisits > 0
          ? `ลงทะเบียนใหม่ ${daysSinceRegistration} วันที่แล้ว (มาใช้บริการ ${totalVisits} ครั้ง)`
          : `ลงทะเบียนใหม่ ${daysSinceRegistration} วันที่แล้ว (ยังไม่เคยเข้ารับบริการ)`;
      }
      // 3. ACTIVE Check (Visited within active threshold, e.g. 60 days)
      else if (daysSinceLastVisit !== null && daysSinceLastVisit <= criteria.activeDaysThreshold) {
        segment = 'ACTIVE';
        segmentReason = `มาใช้บริการล่าสุดเมื่อ ${daysSinceLastVisit} วันที่แล้ว (รวม ${totalVisits} ครั้ง)`;
      }
      // 4. AT_RISK Check (Last visit between activeDaysThreshold and atRiskDaysThreshold, e.g. 61-120 days)
      else if (
        daysSinceLastVisit !== null &&
        daysSinceLastVisit > criteria.activeDaysThreshold &&
        daysSinceLastVisit <= criteria.atRiskDaysThreshold
      ) {
        segment = 'AT_RISK';
        segmentReason = `ไม่ได้มาใช้บริการ ${daysSinceLastVisit} วัน (เกินเกณฑ์ปกติ ${criteria.activeDaysThreshold} วัน)`;
      }
      // 5. LOST Check (Last visit > 120 days or never visited and registered > 30 days)
      else {
        segment = 'LOST';
        if (daysSinceLastVisit !== null) {
          segmentReason = `ไม่กลับมาใช้บริการนานกว่า ${daysSinceLastVisit} วัน (เกิน ${criteria.atRiskDaysThreshold} วัน)`;
        } else {
          segmentReason = `ลงทะเบียนมาแล้ว ${daysSinceRegistration} วันแต่ยังไม่เคยเข้ารับบริการ`;
        }
      }

      return {
        id: c.id,
        tenantId: c.tenantId,
        firstName: c.firstName,
        lastName: c.lastName,
        fullName: `${c.firstName} ${c.lastName}`.trim(),
        phone: c.phone,
        email: c.email,
        lineUserId: c.lineUserId,
        marketingStatus: c.marketingStatus || 'OPTED_IN',
        segment,
        segmentReason,
        registeredAt: c.createdAt.toISOString(),
        daysSinceRegistration,
        lastVisitAt: lastVisitAt ? lastVisitAt.toISOString() : null,
        daysSinceLastVisit,
        totalVisits,
        totalSpentMinor,
        averageTicketMinor,
        petCount: c.pets.length,
        pets: c.pets.map((p) => ({
          id: p.id,
          name: p.name,
          species: p.species,
          breed: p.breed,
        })),
      };
    });
  }

  private buildSegmentSummary(
    segment: CustomerSegment,
    items: SegmentedCustomerItem[],
    totalCustomers: number
  ): CustomerSegmentSummary {
    const count = items.length;
    const percentage = totalCustomers > 0 ? Math.round((count / totalCustomers) * 1000) / 10 : 0;
    const totalRevenueMinor = items.reduce((sum, item) => sum + item.totalSpentMinor, 0);
    const totalVisits = items.reduce((sum, item) => sum + item.totalVisits, 0);
    const averageTicketMinor = totalVisits > 0 ? Math.round(totalRevenueMinor / totalVisits) : 0;
    const averageVisits = count > 0 ? Math.round((totalVisits / count) * 10) / 10 : 0;

    return {
      segment,
      nameThai: SEGMENT_NAMES_THAI[segment],
      count,
      percentage,
      totalRevenueMinor,
      averageTicketMinor,
      averageVisits,
      description: SEGMENT_DESCRIPTIONS[segment],
    };
  }

  private resolveCriteria(
    custom?: Partial<CustomerSegmentationCriteria>
  ): Required<CustomerSegmentationCriteria> {
    return {
      newDaysThreshold: custom?.newDaysThreshold ?? DEFAULT_CRITERIA.newDaysThreshold,
      activeDaysThreshold: custom?.activeDaysThreshold ?? DEFAULT_CRITERIA.activeDaysThreshold,
      atRiskDaysThreshold: custom?.atRiskDaysThreshold ?? DEFAULT_CRITERIA.atRiskDaysThreshold,
      vipMinSpendMinor: custom?.vipMinSpendMinor ?? DEFAULT_CRITERIA.vipMinSpendMinor,
      vipMinVisits: custom?.vipMinVisits ?? DEFAULT_CRITERIA.vipMinVisits,
    };
  }
}
