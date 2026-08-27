import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { AssignSubscriptionDto } from './dto/assign-subscription.dto';
import {
  SubscriptionPlanItem,
  TenantSubscriptionDetails,
  PlanQuotaCheckResult,
  SubscriptionStatus,
  BillingCycle,
} from '@petflow/types';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Seed default plans if none exist
   */
  async ensureDefaultPlans(): Promise<void> {
    const count = await this.prisma.subscriptionPlan.count();
    if (count > 0) return;

    const defaultPlans = [
      {
        code: 'STARTER',
        name: 'Starter Plan (เริ่มต้น)',
        description: 'เหมาะสำหรับร้านกรูมมิ่งหรือคลินิกเดี่ยวขนาดเล็ก 1 สาขา ทีมงานไม่เกิน 3 คน',
        priceMonthlyMinor: BigInt(129000), // 1,290 THB
        priceYearlyMinor: BigInt(1290000), // 12,900 THB (ประหยัด 2 เดือน)
        currency: 'THB',
        maxBranches: 1,
        maxStaffUsers: 3,
        maxMonthlyAppointments: 300,
        hasLineIntegration: false,
        hasAdvancedInventory: false,
        hasClinicalSoap: true,
        hasVaccinationRegistry: true,
        hasCommissionEngine: false,
        hasMultiBranchCentral: false,
        hasApiAccess: false,
        isActive: true,
        sortOrder: 1,
      },
      {
        code: 'PROFESSIONAL',
        name: 'Professional Plan (ธุรกิจเติบโต & ไฮบริด)',
        description: 'ยอดนิยม! สำหรับคลินิกและร้านกรูมมิ่ง 1-3 สาขา เชื่อมต่อ LINE OA, คลังยาละเอียด, และคิดคอมมิชชั่นช่าง',
        priceMonthlyMinor: BigInt(299000), // 2,990 THB
        priceYearlyMinor: BigInt(2990000), // 29,900 THB
        currency: 'THB',
        maxBranches: 3,
        maxStaffUsers: 10,
        maxMonthlyAppointments: 1500,
        hasLineIntegration: true,
        hasAdvancedInventory: true,
        hasClinicalSoap: true,
        hasVaccinationRegistry: true,
        hasCommissionEngine: true,
        hasMultiBranchCentral: false,
        hasApiAccess: false,
        isActive: true,
        sortOrder: 2,
      },
      {
        code: 'ENTERPRISE',
        name: 'Enterprise Plan (องค์กร & เชนสาขา)',
        description: 'สำหรับโรงพยาบาลสัตว์ขนาดใหญ่และเชนสาขา ไม่จำกัดสาขา ไม่จำกัดผู้ใช้ พร้อมศูนย์ควบคุมส่วนกลาง HQ และ API',
        priceMonthlyMinor: BigInt(599000), // 5,990 THB
        priceYearlyMinor: BigInt(5990000), // 59,900 THB
        currency: 'THB',
        maxBranches: 99,
        maxStaffUsers: 999,
        maxMonthlyAppointments: 999999,
        hasLineIntegration: true,
        hasAdvancedInventory: true,
        hasClinicalSoap: true,
        hasVaccinationRegistry: true,
        hasCommissionEngine: true,
        hasMultiBranchCentral: true,
        hasApiAccess: true,
        isActive: true,
        sortOrder: 3,
      },
    ];

    for (const plan of defaultPlans) {
      await this.prisma.subscriptionPlan.create({ data: plan });
    }
  }

  /**
   * Get all active plans (for public pricing / tenant upgrade)
   */
  async getPublicPlans(): Promise<SubscriptionPlanItem[]> {
    await this.ensureDefaultPlans();

    const plans = await this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return plans.map((p) => this.mapPlanItem(p));
  }

  /**
   * Get all plans (admin console)
   */
  async getAllPlans(): Promise<SubscriptionPlanItem[]> {
    await this.ensureDefaultPlans();

    const plans = await this.prisma.subscriptionPlan.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    return plans.map((p) => this.mapPlanItem(p));
  }

  /**
   * Get plan by code
   */
  async getPlanByCode(code: string): Promise<SubscriptionPlanItem> {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!plan) {
      throw new NotFoundException(`Subscription plan ${code} not found`);
    }

    return this.mapPlanItem(plan);
  }

  /**
   * Create new plan (admin)
   */
  async createPlan(dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlanItem> {
    const code = dto.code.toUpperCase().trim();

    const existing = await this.prisma.subscriptionPlan.findUnique({
      where: { code },
    });

    if (existing) {
      throw new ConflictException(`Plan with code ${code} already exists`);
    }

    const plan = await this.prisma.subscriptionPlan.create({
      data: {
        code,
        name: dto.name,
        description: dto.description || null,
        priceMonthlyMinor: BigInt(dto.priceMonthlyMinor),
        priceYearlyMinor: BigInt(dto.priceYearlyMinor),
        currency: dto.currency || 'THB',
        maxBranches: dto.maxBranches ?? 1,
        maxStaffUsers: dto.maxStaffUsers ?? 3,
        maxMonthlyAppointments: dto.maxMonthlyAppointments ?? 300,
        hasLineIntegration: dto.hasLineIntegration ?? false,
        hasAdvancedInventory: dto.hasAdvancedInventory ?? false,
        hasClinicalSoap: dto.hasClinicalSoap ?? false,
        hasVaccinationRegistry: dto.hasVaccinationRegistry ?? false,
        hasCommissionEngine: dto.hasCommissionEngine ?? false,
        hasMultiBranchCentral: dto.hasMultiBranchCentral ?? false,
        hasApiAccess: dto.hasApiAccess ?? false,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });

    return this.mapPlanItem(plan);
  }

  /**
   * Update plan (admin)
   */
  async updatePlan(id: string, dto: UpdateSubscriptionPlanDto): Promise<SubscriptionPlanItem> {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id } });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    const updated = await this.prisma.subscriptionPlan.update({
      where: { id },
      data: {
        name: dto.name !== undefined ? dto.name : plan.name,
        description: dto.description !== undefined ? dto.description : plan.description,
        priceMonthlyMinor:
          dto.priceMonthlyMinor !== undefined
            ? BigInt(dto.priceMonthlyMinor)
            : plan.priceMonthlyMinor,
        priceYearlyMinor:
          dto.priceYearlyMinor !== undefined
            ? BigInt(dto.priceYearlyMinor)
            : plan.priceYearlyMinor,
        currency: dto.currency !== undefined ? dto.currency : plan.currency,
        maxBranches: dto.maxBranches !== undefined ? dto.maxBranches : plan.maxBranches,
        maxStaffUsers: dto.maxStaffUsers !== undefined ? dto.maxStaffUsers : plan.maxStaffUsers,
        maxMonthlyAppointments:
          dto.maxMonthlyAppointments !== undefined
            ? dto.maxMonthlyAppointments
            : plan.maxMonthlyAppointments,
        hasLineIntegration:
          dto.hasLineIntegration !== undefined
            ? dto.hasLineIntegration
            : plan.hasLineIntegration,
        hasAdvancedInventory:
          dto.hasAdvancedInventory !== undefined
            ? dto.hasAdvancedInventory
            : plan.hasAdvancedInventory,
        hasClinicalSoap:
          dto.hasClinicalSoap !== undefined ? dto.hasClinicalSoap : plan.hasClinicalSoap,
        hasVaccinationRegistry:
          dto.hasVaccinationRegistry !== undefined
            ? dto.hasVaccinationRegistry
            : plan.hasVaccinationRegistry,
        hasCommissionEngine:
          dto.hasCommissionEngine !== undefined
            ? dto.hasCommissionEngine
            : plan.hasCommissionEngine,
        hasMultiBranchCentral:
          dto.hasMultiBranchCentral !== undefined
            ? dto.hasMultiBranchCentral
            : plan.hasMultiBranchCentral,
        hasApiAccess: dto.hasApiAccess !== undefined ? dto.hasApiAccess : plan.hasApiAccess,
        isActive: dto.isActive !== undefined ? dto.isActive : plan.isActive,
        sortOrder: dto.sortOrder !== undefined ? dto.sortOrder : plan.sortOrder,
      },
    });

    return this.mapPlanItem(updated);
  }

  /**
   * Get active subscription details & usage quotas for a tenant
   */
  async getTenantSubscription(tenantId: string): Promise<TenantSubscriptionDetails> {
    await this.ensureDefaultPlans();

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    let sub = tenant.subscriptions[0];

    // If tenant doesn't have a subscription yet, auto-provision active STARTER plan
    if (!sub) {
      const defaultPlan = await this.prisma.subscriptionPlan.findUnique({
        where: { code: 'STARTER' },
      });

      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);

      sub = await this.prisma.subscription.create({
        data: {
          tenantId,
          planId: defaultPlan?.id || null,
          planCode: 'STARTER',
          status: 'ACTIVE',
          billingCycle: 'MONTHLY',
          priceMinor: defaultPlan ? defaultPlan.priceMonthlyMinor : BigInt(129000),
          currency: 'THB',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
        include: { plan: true },
      });
    }

    const plan = sub.plan;

    // Compute live usage metrics
    const [branchCount, userCount, startOfMonth] = await Promise.all([
      this.prisma.branch.count({ where: { tenantId } }),
      this.prisma.user.count({ where: { tenantId } }),
      new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    ]);

    const appointmentCount = await this.prisma.appointment.count({
      where: {
        tenantId,
        startAt: { gte: startOfMonth },
      },
    });

    const effectiveMaxBranches =
      sub.customMaxBranches || (plan ? plan.maxBranches : 1);
    const effectiveMaxStaffUsers =
      sub.customMaxStaffUsers || (plan ? plan.maxStaffUsers : 3);
    const effectiveMaxMonthlyAppointments = plan
      ? plan.maxMonthlyAppointments
      : 300;

    return {
      id: sub.id,
      tenantId: sub.tenantId,
      tenantName: tenant.name,
      planId: sub.planId,
      planCode: sub.planCode,
      planName: plan ? plan.name : sub.planCode,
      status: sub.status as SubscriptionStatus,
      billingCycle: sub.billingCycle as BillingCycle,
      priceMinor: Number(sub.priceMinor),
      currency: sub.currency,
      trialEndsAt: sub.trialEndsAt ? sub.trialEndsAt.toISOString() : null,
      currentPeriodStart: sub.currentPeriodStart.toISOString(),
      currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      canceledAt: sub.canceledAt ? sub.canceledAt.toISOString() : null,
      customMaxBranches: sub.customMaxBranches || null,
      customMaxStaffUsers: sub.customMaxStaffUsers || null,
      paymentMethod: sub.paymentMethod || null,
      effectiveMaxBranches,
      effectiveMaxStaffUsers,
      effectiveMaxMonthlyAppointments,
      currentBranchCount: branchCount,
      currentUserCount: userCount,
      currentMonthlyAppointmentCount: appointmentCount,
      hasLineIntegration: plan ? plan.hasLineIntegration : false,
      hasAdvancedInventory: plan ? plan.hasAdvancedInventory : false,
      hasClinicalSoap: plan ? plan.hasClinicalSoap : false,
      hasVaccinationRegistry: plan ? plan.hasVaccinationRegistry : false,
      hasCommissionEngine: plan ? plan.hasCommissionEngine : false,
      hasMultiBranchCentral: plan ? plan.hasMultiBranchCentral : false,
      hasApiAccess: plan ? plan.hasApiAccess : false,
    };
  }

  /**
   * Assign or upgrade tenant subscription plan
   */
  async assignTenantSubscription(
    dto: AssignSubscriptionDto
  ): Promise<TenantSubscriptionDetails> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: dto.tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const planCode = dto.planCode.toUpperCase().trim();
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { code: planCode },
    });

    if (!plan) {
      throw new NotFoundException(`Plan ${planCode} not found`);
    }

    const billingCycle = dto.billingCycle || 'MONTHLY';
    const priceMinor =
      billingCycle === 'YEARLY' ? plan.priceYearlyMinor : plan.priceMonthlyMinor;

    const now = new Date();
    const periodEnd = new Date(now);
    if (billingCycle === 'YEARLY') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const existingSub = await this.prisma.subscription.findFirst({
      where: { tenantId: dto.tenantId },
      orderBy: { createdAt: 'desc' },
    });

    if (existingSub) {
      await this.prisma.subscription.update({
        where: { id: existingSub.id },
        data: {
          planId: plan.id,
          planCode: plan.code,
          status: dto.status || 'ACTIVE',
          billingCycle,
          priceMinor,
          currency: plan.currency,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          customMaxBranches:
            dto.customMaxBranches !== undefined
              ? dto.customMaxBranches
              : existingSub.customMaxBranches,
          customMaxStaffUsers:
            dto.customMaxStaffUsers !== undefined
              ? dto.customMaxStaffUsers
              : existingSub.customMaxStaffUsers,
          paymentMethod: dto.paymentMethod || existingSub.paymentMethod,
        },
      });
    } else {
      await this.prisma.subscription.create({
        data: {
          tenantId: dto.tenantId,
          planId: plan.id,
          planCode: plan.code,
          status: dto.status || 'ACTIVE',
          billingCycle,
          priceMinor,
          currency: plan.currency,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          customMaxBranches: dto.customMaxBranches || null,
          customMaxStaffUsers: dto.customMaxStaffUsers || null,
          paymentMethod: dto.paymentMethod || null,
        },
      });
    }

    return this.getTenantSubscription(dto.tenantId);
  }

  /**
   * Check if tenant is within quota limits
   */
  async checkQuota(
    tenantId: string,
    resource: 'BRANCH' | 'USER' | 'APPOINTMENT' | 'FEATURE',
    featureName?: string
  ): Promise<PlanQuotaCheckResult> {
    const sub = await this.getTenantSubscription(tenantId);

    if (resource === 'BRANCH') {
      const allowed = sub.currentBranchCount < sub.effectiveMaxBranches;
      return {
        allowed,
        resource: 'BRANCH',
        currentUsage: sub.currentBranchCount,
        maxAllowed: sub.effectiveMaxBranches,
        planCode: sub.planCode,
        message: allowed
          ? 'Within branch quota'
          : `Plan ${sub.planCode} allows max ${sub.effectiveMaxBranches} branches. Please upgrade plan.`,
      };
    }

    if (resource === 'USER') {
      const allowed = sub.currentUserCount < sub.effectiveMaxStaffUsers;
      return {
        allowed,
        resource: 'USER',
        currentUsage: sub.currentUserCount,
        maxAllowed: sub.effectiveMaxStaffUsers,
        planCode: sub.planCode,
        message: allowed
          ? 'Within staff user quota'
          : `Plan ${sub.planCode} allows max ${sub.effectiveMaxStaffUsers} staff users. Please upgrade plan.`,
      };
    }

    if (resource === 'APPOINTMENT') {
      const allowed =
        sub.currentMonthlyAppointmentCount <
        sub.effectiveMaxMonthlyAppointments;
      return {
        allowed,
        resource: 'APPOINTMENT',
        currentUsage: sub.currentMonthlyAppointmentCount,
        maxAllowed: sub.effectiveMaxMonthlyAppointments,
        planCode: sub.planCode,
        message: allowed
          ? 'Within monthly appointment quota'
          : `Plan ${sub.planCode} monthly appointment limit reached (${sub.effectiveMaxMonthlyAppointments}).`,
      };
    }

    if (resource === 'FEATURE') {
      let hasFeature = false;
      if (featureName === 'LINE_INTEGRATION') hasFeature = sub.hasLineIntegration;
      if (featureName === 'ADVANCED_INVENTORY') hasFeature = sub.hasAdvancedInventory;
      if (featureName === 'CLINICAL_SOAP') hasFeature = sub.hasClinicalSoap;
      if (featureName === 'VACCINATION_REGISTRY') hasFeature = sub.hasVaccinationRegistry;
      if (featureName === 'COMMISSION_ENGINE') hasFeature = sub.hasCommissionEngine;
      if (featureName === 'MULTI_BRANCH_HQ') hasFeature = sub.hasMultiBranchCentral;
      if (featureName === 'API_ACCESS') hasFeature = sub.hasApiAccess;

      return {
        allowed: hasFeature,
        resource: 'FEATURE',
        currentUsage: hasFeature ? 1 : 0,
        maxAllowed: 1,
        planCode: sub.planCode,
        message: hasFeature
          ? `Feature ${featureName} is available in ${sub.planCode}`
          : `Feature ${featureName} requires Professional or Enterprise plan.`,
      };
    }

    return {
      allowed: true,
      resource,
      currentUsage: 0,
      maxAllowed: 999,
      planCode: sub.planCode,
    };
  }

  /**
   * Helper mapper
   */
  private mapPlanItem(p: any): SubscriptionPlanItem {
    return {
      id: p.id,
      code: p.code,
      name: p.name,
      description: p.description || null,
      priceMonthlyMinor: Number(p.priceMonthlyMinor),
      priceYearlyMinor: Number(p.priceYearlyMinor),
      currency: p.currency,
      maxBranches: p.maxBranches,
      maxStaffUsers: p.maxStaffUsers,
      maxMonthlyAppointments: p.maxMonthlyAppointments,
      hasLineIntegration: p.hasLineIntegration,
      hasAdvancedInventory: p.hasAdvancedInventory,
      hasClinicalSoap: p.hasClinicalSoap,
      hasVaccinationRegistry: p.hasVaccinationRegistry,
      hasCommissionEngine: p.hasCommissionEngine,
      hasMultiBranchCentral: p.hasMultiBranchCentral,
      hasApiAccess: p.hasApiAccess,
      isActive: p.isActive,
      sortOrder: p.sortOrder,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }
}
