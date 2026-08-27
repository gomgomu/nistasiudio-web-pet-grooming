import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  NoShowReportSummary,
  NoShowByCustomerItem,
  NoShowByServiceItem,
  NoShowByDayOfWeekItem,
  NoShowAppointmentItem,
  PaginatedResponse,
  PetSpecies,
} from '@petflow/types';
import { QueryNoShowReportDto } from './dto/query-no-show-report.dto';

const THAI_DAY_NAMES = [
  'วันอาทิตย์',
  'วันจันทร์',
  'วันอังคาร',
  'วันพุธ',
  'วันพฤหัสบดี',
  'วันศุกร์',
  'วันเสาร์',
];

@Injectable()
export class NoShowReportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get high-level summary of no-shows and lost revenue
   */
  async getNoShowSummary(
    tenantId: string,
    query: QueryNoShowReportDto
  ): Promise<NoShowReportSummary> {
    const { startDate, endDate } = this.resolveDateRange(query.startDate, query.endDate);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        ...(query.branchId ? { branchId: query.branchId } : {}),
        ...(query.serviceId ? { serviceId: query.serviceId } : {}),
        ...(query.staffId ? { staffId: query.staffId } : {}),
        startAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        service: true,
      },
    });

    const totalAppointments = appointments.length;
    let completedAppointments = 0;
    let noShowCount = 0;
    let cancelledCount = 0;
    let totalLostRevenueMinor = 0;
    let lostCapacityMinutes = 0;

    const customerNoShowCounts = new Map<string, number>();

    for (const apt of appointments) {
      const price = Number(apt.priceMinor || apt.service.basePriceMinor || 0);

      if (
        apt.status === 'COMPLETED' ||
        apt.status === 'CHECKED_IN' ||
        apt.status === 'IN_PROGRESS'
      ) {
        completedAppointments++;
      } else if (apt.status === 'NO_SHOW') {
        noShowCount++;
        totalLostRevenueMinor += price;
        lostCapacityMinutes += apt.service.durationMinutes;

        const currentCount = customerNoShowCounts.get(apt.customerId) || 0;
        customerNoShowCounts.set(apt.customerId, currentCount + 1);
      } else if (apt.status === 'CANCELLED') {
        cancelledCount++;
      }
    }

    const noShowRate =
      totalAppointments > 0
        ? Math.round((noShowCount / totalAppointments) * 1000) / 10
        : 0;

    const cancellationRate =
      totalAppointments > 0
        ? Math.round((cancelledCount / totalAppointments) * 1000) / 10
        : 0;

    const averageLostPerNoShowMinor =
      noShowCount > 0 ? Math.round(totalLostRevenueMinor / noShowCount) : 0;

    let repeatOffendersCount = 0;
    for (const count of customerNoShowCounts.values()) {
      if (count >= 2) {
        repeatOffendersCount++;
      }
    }

    return {
      totalAppointments,
      completedAppointments,
      noShowCount,
      cancelledCount,
      noShowRate,
      cancellationRate,
      totalLostRevenueMinor,
      lostCapacityMinutes,
      averageLostPerNoShowMinor,
      repeatOffendersCount,
      periodStart: startDate.toISOString(),
      periodEnd: endDate.toISOString(),
    };
  }

  /**
   * Get customers with highest no-show frequency and risk rating
   */
  async getNoShowByCustomers(
    tenantId: string,
    query: QueryNoShowReportDto
  ): Promise<NoShowByCustomerItem[]> {
    const { startDate, endDate } = this.resolveDateRange(query.startDate, query.endDate);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        ...(query.branchId ? { branchId: query.branchId } : {}),
        startAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        customer: true,
        service: true,
      },
      orderBy: { startAt: 'desc' },
    });

    const customerMap = new Map<
      string,
      {
        customer: (typeof appointments)[0]['customer'];
        totalBookings: number;
        noShowCount: number;
        totalLostRevenueMinor: number;
        lastNoShowAt: Date;
      }
    >();

    for (const apt of appointments) {
      const existing = customerMap.get(apt.customerId);
      const isNoShow = apt.status === 'NO_SHOW';
      const price = Number(apt.priceMinor || apt.service.basePriceMinor || 0);

      if (!existing) {
        customerMap.set(apt.customerId, {
          customer: apt.customer,
          totalBookings: 1,
          noShowCount: isNoShow ? 1 : 0,
          totalLostRevenueMinor: isNoShow ? price : 0,
          lastNoShowAt: apt.startAt,
        });
      } else {
        existing.totalBookings++;
        if (isNoShow) {
          existing.noShowCount++;
          existing.totalLostRevenueMinor += price;
          if (apt.startAt > existing.lastNoShowAt) {
            existing.lastNoShowAt = apt.startAt;
          }
        }
      }
    }

    const items: NoShowByCustomerItem[] = [];

    for (const data of customerMap.values()) {
      if (data.noShowCount > 0) {
        const noShowRate =
          data.totalBookings > 0
            ? Math.round((data.noShowCount / data.totalBookings) * 1000) / 10
            : 0;

        let riskBadge: 'HIGH_RISK' | 'MODERATE_RISK' | 'LOW_RISK' = 'LOW_RISK';
        let requireDeposit = false;

        if (data.noShowCount >= 3 || (data.noShowCount >= 2 && noShowRate >= 40)) {
          riskBadge = 'HIGH_RISK';
          requireDeposit = true;
        } else if (data.noShowCount >= 2 || noShowRate >= 25) {
          riskBadge = 'MODERATE_RISK';
          requireDeposit = true;
        }

        items.push({
          customerId: data.customer.id,
          customerName: `${data.customer.firstName} ${data.customer.lastName}`.trim(),
          customerPhone: data.customer.phone,
          lineUserId: data.customer.lineUserId,
          marketingStatus: (data.customer.marketingStatus as any) || 'OPTED_IN',
          totalBookings: data.totalBookings,
          noShowCount: data.noShowCount,
          noShowRate,
          totalLostRevenueMinor: data.totalLostRevenueMinor,
          lastNoShowAt: data.lastNoShowAt.toISOString(),
          riskBadge,
          requireDeposit,
        });
      }
    }

    // Sort by noShowCount desc, then lost revenue desc
    items.sort((a, b) => b.noShowCount - a.noShowCount || b.totalLostRevenueMinor - a.totalLostRevenueMinor);

    return items;
  }

  /**
   * Get no-show breakdown by service
   */
  async getNoShowByServices(
    tenantId: string,
    query: QueryNoShowReportDto
  ): Promise<NoShowByServiceItem[]> {
    const { startDate, endDate } = this.resolveDateRange(query.startDate, query.endDate);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        ...(query.branchId ? { branchId: query.branchId } : {}),
        startAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        service: true,
      },
    });

    const serviceMap = new Map<
      string,
      {
        serviceId: string;
        serviceName: string;
        totalBookings: number;
        noShowCount: number;
        lostRevenueMinor: number;
        lostMinutes: number;
      }
    >();

    for (const apt of appointments) {
      const isNoShow = apt.status === 'NO_SHOW';
      const price = Number(apt.priceMinor || apt.service.basePriceMinor || 0);
      const existing = serviceMap.get(apt.serviceId);

      if (!existing) {
        serviceMap.set(apt.serviceId, {
          serviceId: apt.serviceId,
          serviceName: apt.service.name,
          totalBookings: 1,
          noShowCount: isNoShow ? 1 : 0,
          lostRevenueMinor: isNoShow ? price : 0,
          lostMinutes: isNoShow ? apt.service.durationMinutes : 0,
        });
      } else {
        existing.totalBookings++;
        if (isNoShow) {
          existing.noShowCount++;
          existing.lostRevenueMinor += price;
          existing.lostMinutes += apt.service.durationMinutes;
        }
      }
    }

    const items: NoShowByServiceItem[] = [];

    for (const data of serviceMap.values()) {
      const noShowRate =
        data.totalBookings > 0
          ? Math.round((data.noShowCount / data.totalBookings) * 1000) / 10
          : 0;

      items.push({
        ...data,
        noShowRate,
      });
    }

    items.sort((a, b) => b.noShowCount - a.noShowCount || b.lostRevenueMinor - a.lostRevenueMinor);

    return items;
  }

  /**
   * Get no-show breakdown by day of week
   */
  async getNoShowByDayOfWeek(
    tenantId: string,
    query: QueryNoShowReportDto
  ): Promise<NoShowByDayOfWeekItem[]> {
    const { startDate, endDate } = this.resolveDateRange(query.startDate, query.endDate);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        ...(query.branchId ? { branchId: query.branchId } : {}),
        startAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        service: true,
      },
    });

    const days: NoShowByDayOfWeekItem[] = THAI_DAY_NAMES.map((dayName, dayOfWeek) => ({
      dayOfWeek,
      dayName,
      totalBookings: 0,
      noShowCount: 0,
      noShowRate: 0,
      lostRevenueMinor: 0,
    }));

    for (const apt of appointments) {
      const day = new Date(apt.startAt).getDay();
      const price = Number(apt.priceMinor || apt.service.basePriceMinor || 0);
      days[day].totalBookings++;

      if (apt.status === 'NO_SHOW') {
        days[day].noShowCount++;
        days[day].lostRevenueMinor += price;
      }
    }

    for (const d of days) {
      d.noShowRate =
        d.totalBookings > 0
          ? Math.round((d.noShowCount / d.totalBookings) * 1000) / 10
          : 0;
    }

    return days;
  }

  /**
   * Get detailed paginated list of no-show appointments
   */
  async getNoShowAppointments(
    tenantId: string,
    query: QueryNoShowReportDto
  ): Promise<PaginatedResponse<NoShowAppointmentItem>> {
    const { startDate, endDate } = this.resolveDateRange(query.startDate, query.endDate);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        status: 'NO_SHOW',
        ...(query.branchId ? { branchId: query.branchId } : {}),
        ...(query.serviceId ? { serviceId: query.serviceId } : {}),
        ...(query.staffId ? { staffId: query.staffId } : {}),
        startAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        branch: true,
        customer: true,
        pet: true,
        service: true,
        assignedStaff: true,
      },
      orderBy: { startAt: 'desc' },
    });

    let items: NoShowAppointmentItem[] = appointments.map((apt) => {
      const price = Number(apt.priceMinor || apt.service.basePriceMinor || 0);

      return {
        id: apt.id,
        branchId: apt.branchId,
        branchName: apt.branch.name,
        startAt: apt.startAt.toISOString(),
        endAt: apt.endAt.toISOString(),
        customerId: apt.customerId,
        customerName: `${apt.customer.firstName} ${apt.customer.lastName}`.trim(),
        customerPhone: apt.customer.phone,
        lineUserId: apt.customer.lineUserId,
        petId: apt.petId,
        petName: apt.pet.name,
        species: apt.pet.species as PetSpecies,
        breed: apt.pet.breed,
        serviceId: apt.serviceId,
        serviceName: apt.service.name,
        servicePriceMinor: price,
        durationMinutes: apt.service.durationMinutes,
        staffId: apt.staffId,
        staffName: apt.assignedStaff
          ? `${apt.assignedStaff.firstName} ${apt.assignedStaff.lastName}`.trim()
          : null,
        noShowReason: apt.cancellationReason || apt.notes || 'ไม่มาตามเวลานัดหมาย และไม่สามารถติดต่อได้',
        notes: apt.notes,
        hasSubsequentBooking: false,
      };
    });

    if (query.search && query.search.trim()) {
      const s = query.search.toLowerCase().trim();
      items = items.filter((apt) => {
        const matchCustomer = apt.customerName.toLowerCase().includes(s);
        const matchPhone = apt.customerPhone.includes(s);
        const matchPet = apt.petName.toLowerCase().includes(s);
        const matchService = apt.serviceName.toLowerCase().includes(s);
        return matchCustomer || matchPhone || matchPet || matchService;
      });
    }

    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const total = items.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedItems = items.slice(startIndex, startIndex + limit);

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
  // Internal Helpers
  // ---------------------------------------------------------------------------

  private resolveDateRange(startDateStr?: string, endDateStr?: string) {
    const end = endDateStr ? new Date(endDateStr) : new Date();
    const start = startDateStr
      ? new Date(startDateStr)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    return { startDate: start, endDate: end };
  }
}
