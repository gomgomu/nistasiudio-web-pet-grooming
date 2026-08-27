import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { QuerySaaSTenantsDto } from './dto/query-saas-tenants.dto';
import { UpdateTenantStatusDto } from './dto/update-tenant-status.dto';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import {
  SaaSMetricsOverview,
  SaaSTenantListItem,
  SystemAuditLogItem,
} from '@petflow/types';

@Injectable()
export class SaaSAdminService {
  private readonly logger = new Logger(SaaSAdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionsService: SubscriptionsService
  ) {}

  /**
   * Aggregate platform-wide SaaS Metrics & Revenue Overview
   */
  async getMetricsOverview(): Promise<SaaSMetricsOverview> {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [
      totalTenants,
      activeTenants,
      inactiveTenants,
      totalPetsCount,
      totalAppointmentsThisMonth,
      totalRevenueInvoices,
      subscriptions,
      tenantsByBusinessType,
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { isActive: true } }),
      this.prisma.tenant.count({ where: { isActive: false } }),
      this.prisma.pet.count(),
      this.prisma.appointment.count({ where: { startAt: { gte: startOfMonth } } }),
      this.prisma.invoice.findMany({
        where: {
          status: 'PAID',
          createdAt: { gte: startOfMonth },
        },
        select: { totalMinor: true },
      }),
      this.prisma.subscription.findMany({
        where: { status: 'ACTIVE' },
        include: { plan: true },
      }),
      this.prisma.tenant.groupBy({
        by: ['businessType'],
        _count: { _all: true },
      }),
    ]);

    // Calculate MRR and ARR from active subscriptions
    let mrrMinor = 0;
    let arrMinor = 0;
    const planCounts: Record<string, number> = {};

    for (const sub of subscriptions) {
      const pCode = sub.planCode || 'STARTER';
      planCounts[pCode] = (planCounts[pCode] || 0) + 1;

      const price = Number(sub.priceMinor);
      if (sub.billingCycle === 'YEARLY') {
        mrrMinor += Math.round(price / 12);
        arrMinor += price;
      } else {
        mrrMinor += price;
        arrMinor += price * 12;
      }
    }

    const totalRevenueThisMonthMinor = totalRevenueInvoices.reduce(
      (sum, inv) => sum + Number(inv.totalMinor),
      0
    );

    const planDistribution = Object.entries(planCounts).map(([planCode, count]) => ({
      planCode,
      count,
    }));

    const businessTypeDistribution = tenantsByBusinessType.map((g) => ({
      businessType: g.businessType,
      count: g._count._all,
    }));

    return {
      totalTenants,
      activeTenants,
      trialingTenants: subscriptions.filter((s) => s.status === 'TRIALING').length,
      pastDueTenants: subscriptions.filter((s) => s.status === 'PAST_DUE').length,
      suspendedTenants: inactiveTenants,
      mrrMinor,
      arrMinor,
      totalPetsCount,
      totalAppointmentsThisMonth,
      totalRevenueThisMonthMinor,
      planDistribution,
      businessTypeDistribution,
    };
  }

  /**
   * List all tenants across the platform with live quotas and active subscription
   */
  async listTenants(
    query: QuerySaaSTenantsDto
  ): Promise<{ tenants: SaaSTenantListItem[]; total: number; page: number; limit: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status === 'ACTIVE') {
      where.isActive = true;
    } else if (query.status === 'SUSPENDED') {
      where.isActive = false;
    }

    if (query.businessType) {
      where.businessType = query.businessType;
    }

    if (query.planCode) {
      where.subscriptions = {
        some: {
          planCode: query.planCode.toUpperCase(),
        },
      };
    }

    if (query.search) {
      const s = query.search.trim();
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { slug: { contains: s, mode: 'insensitive' } },
        { phone: { contains: s } },
        { email: { contains: s, mode: 'insensitive' } },
      ];
    }

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          subscriptions: {
            include: { plan: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: {
            select: {
              branches: true,
              users: true,
              customers: true,
              pets: true,
            },
          },
        },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    const items: SaaSTenantListItem[] = [];

    for (const t of tenants) {
      const sub = t.subscriptions[0];
      const monthlyAppointmentCount = await this.prisma.appointment.count({
        where: {
          tenantId: t.id,
          startAt: { gte: startOfMonth },
        },
      });

      items.push({
        id: t.id,
        name: t.name,
        slug: t.slug,
        businessType: t.businessType,
        phone: t.phone || null,
        email: t.email || null,
        isActive: t.isActive,
        planCode: sub ? sub.planCode : 'STARTER',
        planName: sub?.plan ? sub.plan.name : (sub?.planCode || 'Starter Plan'),
        subscriptionStatus: sub ? sub.status : 'ACTIVE',
        billingCycle: sub ? sub.billingCycle : 'MONTHLY',
        priceMinor: sub ? Number(sub.priceMinor) : 129000,
        branchCount: t._count.branches,
        userCount: t._count.users,
        customerCount: t._count.customers,
        petCount: t._count.pets,
        monthlyAppointmentCount,
        createdAt: t.createdAt.toISOString(),
      });
    }

    return {
      tenants: items,
      total,
      page,
      limit,
    };
  }

  /**
   * Get complete details of a specific tenant
   */
  async getTenantDetails(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        branches: true,
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            status: true,
            createdAt: true,
          },
        },
        subscriptions: {
          include: { plan: true, invoices: true },
          orderBy: { createdAt: 'desc' },
        },
        featureOverrides: {
          include: { featureFlag: true },
        },
        _count: {
          select: {
            customers: true,
            pets: true,
            appointments: true,
            invoices: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const quotaDetails = await this.subscriptionsService.getTenantSubscription(tenantId);

    return {
      tenant,
      quotaDetails,
    };
  }

  /**
   * Update tenant active status (Suspend / Activate)
   */
  async updateTenantStatus(
    tenantId: string,
    dto: UpdateTenantStatusDto,
    adminUserId?: string
  ): Promise<{ success: boolean; tenantId: string; isActive: boolean }> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { isActive: dto.isActive },
    });

    // Record system audit log
    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: adminUserId || null,
        action: dto.isActive ? 'ACTIVATE_TENANT' : 'SUSPEND_TENANT',
        entity: 'TENANT',
        entityId: tenantId,
        oldData: { isActive: tenant.isActive },
        newData: { isActive: updated.isActive, reason: dto.reason || null },
      },
    });

    return {
      success: true,
      tenantId: updated.id,
      isActive: updated.isActive,
    };
  }

  /**
   * Get Platform System Audit Logs
   */
  async getSystemAuditLogs(
    query: QueryAuditLogsDto
  ): Promise<{ logs: SystemAuditLogItem[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 30;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.tenantId) where.tenantId = query.tenantId;
    if (query.entity) where.entity = query.entity;
    if (query.action) where.action = query.action;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tenant: true,
          user: true,
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs: logs.map((l) => ({
        id: l.id,
        tenantId: l.tenantId,
        tenantName: l.tenant?.name || 'Unknown Tenant',
        userId: l.userId || null,
        userName: l.user ? `${l.user.firstName} ${l.user.lastName}` : null,
        action: l.action,
        entity: l.entity,
        entityId: l.entityId || null,
        ip: l.ip || null,
        createdAt: l.createdAt.toISOString(),
      })),
      total,
    };
  }
}
