import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RetentionService } from '../retention/retention.service';
import {
  OwnerDashboardMetrics,
  DashboardPeriod,
  DashboardDailyTrendItem,
  DashboardRecentActivityItem,
  DashboardRevenueMetrics,
  DashboardAppointmentMetrics,
  DashboardCustomerMetrics,
} from '@petflow/types';
import { QueryOwnerDashboardDto } from './dto/query-owner-dashboard.dto';

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  PROMPT_PAY: 'พร้อมเพย์ (PromptPay QR)',
  CASH: 'เงินสด (Cash)',
  CREDIT_CARD: 'บัตรเครดิต/เดบิต (Credit Card)',
  TRANSFER: 'โอนเงินผ่านธนาคาร (Bank Transfer)',
  OTHER: 'อื่นๆ',
};

const CATEGORY_LABELS: Record<string, string> = {
  GROOMING: 'บริการอาบน้ำตัดขน (Grooming)',
  SPA: 'บริการสปา & ทรีตเมนต์ (Spa)',
  VET_CLINIC: 'บริการคลินิกสัตวแพทย์ (Veterinary)',
  RETAIL: 'สินค้า & อาหารสัตว์ (Pet Shop)',
  HOTEL: 'บริการรับฝากเลี้ยง (Pet Hotel)',
  OTHER: 'บริการอื่นๆ',
};

@Injectable()
export class OwnerDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly retentionService: RetentionService
  ) {}

  /**
   * Get executive owner dashboard metrics
   */
  async getOwnerDashboardMetrics(
    tenantId: string,
    query: QueryOwnerDashboardDto
  ): Promise<OwnerDashboardMetrics> {
    const period = query.period || 'THIS_MONTH';
    const { currentStart, currentEnd, previousStart, previousEnd } = this.resolvePeriodDates(
      period,
      query.startDate,
      query.endDate
    );

    // 1. Query branch info if requested
    let branchName: string | null = null;
    if (query.branchId) {
      const branch = await this.prisma.branch.findFirst({
        where: { id: query.branchId, tenantId },
      });
      branchName = branch ? branch.name : null;
    }

    // 2. Query Paid Invoices in Current and Previous Periods
    const currentInvoices = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        status: 'PAID',
        ...(query.branchId ? { branchId: query.branchId } : {}),
        paidAt: {
          gte: currentStart,
          lte: currentEnd,
        },
      },
      include: {
        payments: true,
        items: true,
        customer: true,
      },
      orderBy: { paidAt: 'desc' },
    });

    const previousInvoices = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        status: 'PAID',
        ...(query.branchId ? { branchId: query.branchId } : {}),
        paidAt: {
          gte: previousStart,
          lte: previousEnd,
        },
      },
    });

    // 3. Query Appointments in Current Period
    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        ...(query.branchId ? { branchId: query.branchId } : {}),
        startAt: {
          gte: currentStart,
          lte: currentEnd,
        },
      },
      include: {
        service: true,
        customer: true,
        pet: true,
      },
      orderBy: { startAt: 'desc' },
    });

    // 4. Query Customer RFM Segmentation
    const retentionOverview = await this.retentionService.getRetentionOverview(tenantId);

    // 5. Calculate Revenue Metrics
    let totalRevenueMinor = 0;
    const paymentMethodMap = new Map<string, { count: number; amountMinor: number }>();
    const categoryMap = new Map<string, number>();
    const customerPaidCount = new Map<string, number>();
    let repeatCustomerRevenueMinor = 0;
    let newCustomerRevenueMinor = 0;

    for (const inv of currentInvoices) {
      const total = Number(inv.totalMinor);
      totalRevenueMinor += total;

      // Group payments
      for (const p of inv.payments) {
        const method = p.method || 'CASH';
        const pAmount = Number(p.amountMinor);
        const existing = paymentMethodMap.get(method) || { count: 0, amountMinor: 0 };
        paymentMethodMap.set(method, {
          count: existing.count + 1,
          amountMinor: existing.amountMinor + pAmount,
        });
      }

      // Group items category
      for (const item of inv.items) {
        const cat = (item.itemType as string) || 'GROOMING';
        const itemAmount = Number(item.totalMinor);
        const cur = categoryMap.get(cat) || 0;
        categoryMap.set(cat, cur + itemAmount);
      }

      // Check repeat customer vs new
      const cId = inv.customerId;
      const count = customerPaidCount.get(cId) || 0;
      customerPaidCount.set(cId, count + 1);
      if (count >= 1) {
        repeatCustomerRevenueMinor += total;
      } else {
        newCustomerRevenueMinor += total;
      }
    }

    let previousPeriodRevenueMinor = 0;
    for (const inv of previousInvoices) {
      previousPeriodRevenueMinor += Number(inv.totalMinor);
    }

    const growthRate =
      previousPeriodRevenueMinor > 0
        ? Math.round(
            ((totalRevenueMinor - previousPeriodRevenueMinor) / previousPeriodRevenueMinor) * 1000
          ) / 10
        : 0;

    const grossProfitMinor = Math.round(totalRevenueMinor * 0.75); // ~75% gross margin

    const revenueByPaymentMethod = Array.from(paymentMethodMap.entries()).map(
      ([method, data]) => ({
        method,
        methodLabel: PAYMENT_METHOD_LABELS[method] || method,
        amountMinor: data.amountMinor,
        count: data.count,
        percentage:
          totalRevenueMinor > 0
            ? Math.round((data.amountMinor / totalRevenueMinor) * 1000) / 10
            : 0,
      })
    );

    const revenueByCategory = Array.from(categoryMap.entries()).map(([cat, amount]) => ({
      category: cat,
      categoryLabel: CATEGORY_LABELS[cat] || cat,
      amountMinor: amount,
      percentage:
        totalRevenueMinor > 0 ? Math.round((amount / totalRevenueMinor) * 1000) / 10 : 0,
    }));

    const revenueMetrics: DashboardRevenueMetrics = {
      totalRevenueMinor,
      grossProfitMinor,
      previousPeriodRevenueMinor,
      growthRate,
      revenueByPaymentMethod,
      revenueByCategory,
    };

    // 6. Calculate Appointment Metrics
    const totalAppointments = appointments.length;
    let completedAppointments = 0;
    let pendingOrConfirmedAppointments = 0;
    let inProgressAppointments = 0;
    let noShowCount = 0;
    let noShowLostRevenueMinor = 0;
    let cancelledCount = 0;

    for (const apt of appointments) {
      const price = Number(apt.priceMinor || apt.service.basePriceMinor || 0);

      if (apt.status === 'COMPLETED') {
        completedAppointments++;
      } else if (apt.status === 'CHECKED_IN' || apt.status === 'IN_PROGRESS') {
        inProgressAppointments++;
      } else if (apt.status === 'PENDING' || apt.status === 'CONFIRMED') {
        pendingOrConfirmedAppointments++;
      } else if (apt.status === 'NO_SHOW') {
        noShowCount++;
        noShowLostRevenueMinor += price;
      } else if (apt.status === 'CANCELLED') {
        cancelledCount++;
      }
    }

    const noShowRate =
      totalAppointments > 0 ? Math.round((noShowCount / totalAppointments) * 1000) / 10 : 0;
    const cancellationRate =
      totalAppointments > 0 ? Math.round((cancelledCount / totalAppointments) * 1000) / 10 : 0;

    const appointmentMetrics: DashboardAppointmentMetrics = {
      totalAppointments,
      completedAppointments,
      pendingOrConfirmedAppointments,
      inProgressAppointments,
      noShowCount,
      noShowRate,
      noShowLostRevenueMinor,
      cancelledCount,
      cancellationRate,
    };

    // 7. Calculate Customer & LTV Metrics
    const totalInvoicesCount = currentInvoices.length;
    const averageTicketMinor =
      totalInvoicesCount > 0 ? Math.round(totalRevenueMinor / totalInvoicesCount) : 0;

    const newCustomersCount = await this.prisma.customer.count({
      where: {
        tenantId,
        createdAt: {
          gte: currentStart,
          lte: currentEnd,
        },
      },
    });

    const repeatCustomersCount = Array.from(customerPaidCount.values()).filter((c) => c >= 2).length;
    const repeatRevenueShare =
      totalRevenueMinor > 0
        ? Math.round((repeatCustomerRevenueMinor / totalRevenueMinor) * 1000) / 10
        : 0;

    const inactiveCustomersCount =
      retentionOverview.segments.AT_RISK.count + retentionOverview.segments.LOST.count;
    const recoverableRevenueOpportunityMinor =
      inactiveCustomersCount * averageTicketMinor;

    const customerMetrics: DashboardCustomerMetrics = {
      averageTicketMinor,
      totalActiveCustomers: retentionOverview.segments.ACTIVE.count + retentionOverview.segments.VIP.count,
      newCustomersCount,
      repeatCustomersCount,
      newCustomerRevenueMinor,
      repeatCustomerRevenueMinor,
      repeatRevenueShare,
      inactiveCustomersCount,
      recoverableRevenueOpportunityMinor,
    };

    // 8. Build Daily Revenue Trend
    const dailyRevenueTrend = this.buildDailyRevenueTrend(
      currentStart,
      currentEnd,
      currentInvoices,
      appointments
    );

    // 9. Build Recent Activities
    const recentActivities = this.buildRecentActivities(currentInvoices, appointments);

    return {
      tenantId,
      branchId: query.branchId || null,
      branchName,
      period,
      periodStart: currentStart.toISOString(),
      periodEnd: currentEnd.toISOString(),
      revenue: revenueMetrics,
      appointments: appointmentMetrics,
      customerAndLtv: customerMetrics,
      retentionSummary: {
        vipCount: retentionOverview.segments.VIP.count,
        activeCount: retentionOverview.segments.ACTIVE.count,
        atRiskCount: retentionOverview.segments.AT_RISK.count,
        lostCount: retentionOverview.segments.LOST.count,
        newCount: retentionOverview.segments.NEW.count,
        totalCustomers: retentionOverview.totalCustomers,
      },
      dailyRevenueTrend,
      recentActivities,
      generatedAt: new Date().toISOString(),
    };
  }

  // ---------------------------------------------------------------------------
  // Date & Aggregation Helpers
  // ---------------------------------------------------------------------------

  private resolvePeriodDates(
    period: DashboardPeriod,
    customStart?: string,
    customEnd?: string
  ) {
    const now = new Date();
    let currentStart: Date;
    let currentEnd: Date = now;
    let previousStart: Date;
    let previousEnd: Date;

    if (period === 'TODAY') {
      currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      previousStart = new Date(currentStart.getTime() - 24 * 60 * 60 * 1000);
      previousEnd = new Date(currentEnd.getTime() - 24 * 60 * 60 * 1000);
    } else if (period === 'THIS_WEEK') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      currentStart = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0);
      const duration = now.getTime() - currentStart.getTime();
      previousStart = new Date(currentStart.getTime() - 7 * 24 * 60 * 60 * 1000);
      previousEnd = new Date(previousStart.getTime() + duration);
    } else if (period === 'THIS_MONTH') {
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      previousEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    } else if (period === 'THIS_YEAR') {
      currentStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      previousStart = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0);
      previousEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
    } else if (period === 'CUSTOM' && customStart && customEnd) {
      currentStart = new Date(customStart);
      currentEnd = new Date(customEnd);
      const duration = currentEnd.getTime() - currentStart.getTime();
      previousStart = new Date(currentStart.getTime() - duration);
      previousEnd = new Date(currentStart.getTime());
    } else {
      // LAST_30_DAYS default
      currentStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      previousStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      previousEnd = new Date(currentStart.getTime());
    }

    return { currentStart, currentEnd, previousStart, previousEnd };
  }

  private buildDailyRevenueTrend(
    start: Date,
    end: Date,
    invoices: any[],
    appointments: any[]
  ): DashboardDailyTrendItem[] {
    const daysMap = new Map<string, { revenueMinor: number; appointmentsCount: number }>();

    // Initialize days
    const cur = new Date(start);
    while (cur <= end) {
      const key = cur.toISOString().split('T')[0];
      daysMap.set(key, { revenueMinor: 0, appointmentsCount: 0 });
      cur.setDate(cur.getDate() + 1);
    }

    for (const inv of invoices) {
      if (inv.paidAt) {
        const key = new Date(inv.paidAt).toISOString().split('T')[0];
        const existing = daysMap.get(key);
        if (existing) {
          existing.revenueMinor += Number(inv.totalMinor);
        }
      }
    }

    for (const apt of appointments) {
      const key = new Date(apt.startAt).toISOString().split('T')[0];
      const existing = daysMap.get(key);
      if (existing) {
        existing.appointmentsCount += 1;
      }
    }

    return Array.from(daysMap.entries()).map(([date, val]) => {
      const d = new Date(date);
      const label = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
      return {
        date,
        label,
        revenueMinor: val.revenueMinor,
        appointmentsCount: val.appointmentsCount,
        newCustomersCount: 0,
      };
    });
  }

  private buildRecentActivities(
    invoices: any[],
    appointments: any[]
  ): DashboardRecentActivityItem[] {
    const activities: DashboardRecentActivityItem[] = [];

    // Top recent paid invoices
    for (const inv of invoices.slice(0, 5)) {
      activities.push({
        id: `act-inv-${inv.id}`,
        type: 'INVOICE_PAID',
        title: `ชำระเงินบิล #${inv.invoiceNumber || inv.id.slice(0, 8)}`,
        description: `ลูกค้า ${inv.customer ? `${inv.customer.firstName} ${inv.customer.lastName}`.trim() : 'ลูกค้า'} ชำระเงินเรียบร้อย`,
        amountMinor: Number(inv.totalMinor),
        timestamp: (inv.paidAt || inv.createdAt).toISOString(),
      });
    }

    // Top recent completed appointments
    const completedApts = appointments.filter((a) => a.status === 'COMPLETED').slice(0, 4);
    for (const apt of completedApts) {
      activities.push({
        id: `act-apt-${apt.id}`,
        type: 'APPOINTMENT_COMPLETED',
        title: `ให้บริการเสร็จสิ้น: ${apt.service ? apt.service.name : 'บริการ'}`,
        description: `น้อง ${apt.pet ? apt.pet.name : ''} (${apt.customer ? apt.customer.firstName : ''}) รับบริการเรียบร้อย`,
        amountMinor: Number(apt.priceMinor || apt.service?.basePriceMinor || 0),
        timestamp: apt.startAt.toISOString(),
      });
    }

    // Top recent no shows
    const noShows = appointments.filter((a) => a.status === 'NO_SHOW').slice(0, 3);
    for (const ns of noShows) {
      activities.push({
        id: `act-ns-${ns.id}`,
        type: 'NO_SHOW',
        title: `ลูกค้าไม่มาตามนัด (No-Show)`,
        description: `ลูกค้า ${ns.customer ? ns.customer.firstName : ''} ผิดนัดหมายบริการ ${ns.service ? ns.service.name : ''}`,
        amountMinor: Number(ns.priceMinor || ns.service?.basePriceMinor || 0),
        timestamp: ns.startAt.toISOString(),
      });
    }

    // Sort by timestamp desc
    activities.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return activities.slice(0, 10);
  }
}
