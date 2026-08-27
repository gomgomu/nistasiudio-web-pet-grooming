import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { RecordUsageDto } from './dto/record-usage.dto';
import { TopUpCreditsDto } from './dto/top-up-credits.dto';
import {
  UsageMetricType,
  UsageMeterItem,
  TenantUsageDashboard,
} from '@petflow/types';
import { UsageMetricType as PrismaMetricType } from '@prisma/client';

@Injectable()
export class UsageMeteringService {
  private readonly logger = new Logger(UsageMeteringService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionsService: SubscriptionsService
  ) {}

  /**
   * Helper: Get current billing period formatted as "YYYY-MM"
   */
  getCurrentBillingPeriod(date: Date = new Date()): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  /**
   * Default Plan Quota allocations for each metric
   */
  getPlanQuotas(planCode: string = 'STARTER'): Record<UsageMetricType, { limit: number; unit: string; label: string }> {
    const isPro = planCode === 'PROFESSIONAL';
    const isEnterprise = planCode === 'ENTERPRISE';

    return {
      LINE_MESSAGES: {
        limit: isEnterprise ? 10000 : isPro ? 2000 : 500,
        unit: 'ข้อความ',
        label: 'LINE OA ข้อความอัตโนมัติ',
      },
      SMS_CREDITS: {
        limit: isEnterprise ? 2000 : isPro ? 500 : 100,
        unit: 'เครดิต',
        label: 'SMS แจ้งเตือนฉุกเฉิน / OTP',
      },
      STORAGE_BYTES: {
        limit: isEnterprise ? 107374182400 : isPro ? 10737418240 : 1073741824, // 100GB / 10GB / 1GB
        unit: 'Bytes',
        label: 'พื้นที่จัดเก็บรูปถ่าย & เวชระเบียน (Storage)',
      },
      MONTHLY_APPOINTMENTS: {
        limit: isEnterprise ? 10000 : isPro ? 1000 : 300,
        unit: 'เคส',
        label: 'ยอดนัดหมายต่อเดือน',
      },
      API_CALLS: {
        limit: isEnterprise ? 500000 : isPro ? 50000 : 1000,
        unit: 'ครั้ง',
        label: 'API & Webhook Calls',
      },
    };
  }

  /**
   * Ensure TenantUsageSummary exists for a metric in the given period
   */
  async ensureUsageSummary(
    tenantId: string,
    metricType: PrismaMetricType,
    billingPeriod: string = this.getCurrentBillingPeriod()
  ) {
    const existing = await this.prisma.tenantUsageSummary.findUnique({
      where: {
        tenantId_metricType_billingPeriod: {
          tenantId,
          metricType,
          billingPeriod,
        },
      },
    });

    if (existing) return existing;

    const sub = await this.subscriptionsService.getTenantSubscription(tenantId);
    const quotas = this.getPlanQuotas(sub.planCode);
    const defaultLimit = quotas[metricType as UsageMetricType]?.limit || 1000;

    return this.prisma.tenantUsageSummary.create({
      data: {
        tenantId,
        metricType,
        billingPeriod,
        usedQuantity: 0,
        quotaLimit: defaultLimit,
        extraCredits: 0,
        lastWarningThreshold: null,
      },
    });
  }

  /**
   * Record a resource consumption event (immutable log + summary increment)
   */
  async recordUsage(dto: RecordUsageDto): Promise<{
    success: boolean;
    used: number;
    totalAllowed: number;
    remaining: number;
    warningLevel: string;
  }> {
    const billingPeriod = this.getCurrentBillingPeriod();
    const summary = await this.ensureUsageSummary(dto.tenantId, dto.metricType, billingPeriod);

    // 1. Create immutable audit record
    await this.prisma.tenantUsageRecord.create({
      data: {
        tenantId: dto.tenantId,
        metricType: dto.metricType,
        billingPeriod,
        quantity: dto.quantity,
        referenceId: dto.referenceId || null,
        metadata: dto.metadata ? (dto.metadata as any) : undefined,
      },
    });

    // 2. Increment summary
    const newUsed = summary.usedQuantity + dto.quantity;
    const totalAllowed = summary.quotaLimit + summary.extraCredits;
    const percentage = totalAllowed > 0 ? (newUsed / totalAllowed) * 100 : 100;

    let warningLevel: 'NORMAL' | 'WARNING_80' | 'CRITICAL_95' | 'EXCEEDED_100' = 'NORMAL';
    let newThreshold: number | null = summary.lastWarningThreshold;

    if (percentage >= 100) {
      warningLevel = 'EXCEEDED_100';
      newThreshold = 100;
    } else if (percentage >= 95) {
      warningLevel = 'CRITICAL_95';
      newThreshold = 95;
    } else if (percentage >= 80) {
      warningLevel = 'WARNING_80';
      newThreshold = 80;
    }

    await this.prisma.tenantUsageSummary.update({
      where: { id: summary.id },
      data: {
        usedQuantity: newUsed,
        lastWarningThreshold: newThreshold,
      },
    });

    return {
      success: true,
      used: newUsed,
      totalAllowed,
      remaining: Math.max(0, totalAllowed - newUsed),
      warningLevel,
    };
  }

  /**
   * Check if tenant has enough remaining quota before performing action
   */
  async checkQuota(
    tenantId: string,
    metricType: PrismaMetricType,
    quantity: number = 1
  ): Promise<{
    allowed: boolean;
    used: number;
    totalAllowed: number;
    remaining: number;
    percentage: number;
  }> {
    const billingPeriod = this.getCurrentBillingPeriod();
    const summary = await this.ensureUsageSummary(tenantId, metricType, billingPeriod);

    const totalAllowed = summary.quotaLimit + summary.extraCredits;
    const remaining = totalAllowed - summary.usedQuantity;
    const allowed = remaining >= quantity;
    const percentage = totalAllowed > 0 ? Math.round((summary.usedQuantity / totalAllowed) * 100) : 100;

    return {
      allowed,
      used: summary.usedQuantity,
      totalAllowed,
      remaining: Math.max(0, remaining),
      percentage,
    };
  }

  /**
   * Get Tenant Usage Dashboard for current or specified period
   */
  async getTenantUsageDashboard(
    tenantId: string,
    billingPeriod: string = this.getCurrentBillingPeriod()
  ): Promise<TenantUsageDashboard> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const sub = await this.subscriptionsService.getTenantSubscription(tenantId);
    const planQuotas = this.getPlanQuotas(sub.planCode);

    const metricTypes: PrismaMetricType[] = [
      PrismaMetricType.LINE_MESSAGES,
      PrismaMetricType.SMS_CREDITS,
      PrismaMetricType.STORAGE_BYTES,
      PrismaMetricType.MONTHLY_APPOINTMENTS,
      PrismaMetricType.API_CALLS,
    ];

    const summaries = await Promise.all(
      metricTypes.map((type) => this.ensureUsageSummary(tenantId, type, billingPeriod))
    );

    const meters: UsageMeterItem[] = summaries.map((s) => {
      const info = planQuotas[s.metricType as UsageMetricType];
      const totalAllowed = s.quotaLimit + s.extraCredits;
      const remaining = Math.max(0, totalAllowed - s.usedQuantity);
      const percentage = totalAllowed > 0 ? Math.min(100, Math.round((s.usedQuantity / totalAllowed) * 100)) : 100;
      const isOverLimit = s.usedQuantity >= totalAllowed;

      let warningLevel: 'NORMAL' | 'WARNING_80' | 'CRITICAL_95' | 'EXCEEDED_100' = 'NORMAL';
      if (isOverLimit) {
        warningLevel = 'EXCEEDED_100';
      } else if (percentage >= 95) {
        warningLevel = 'CRITICAL_95';
      } else if (percentage >= 80) {
        warningLevel = 'WARNING_80';
      }

      return {
        metricType: s.metricType as UsageMetricType,
        label: info?.label || s.metricType,
        unit: info?.unit || 'หน่วย',
        used: s.usedQuantity,
        quotaLimit: s.quotaLimit,
        extraCredits: s.extraCredits,
        totalAllowed,
        remaining,
        percentage,
        isOverLimit,
        warningLevel,
      };
    });

    return {
      tenantId,
      tenantName: tenant.name,
      planCode: sub.planCode,
      billingPeriod,
      meters,
    };
  }

  /**
   * Top up extra credits for a specific metric (e.g. 1,000 LINE messages package)
   */
  async topUpCredits(
    tenantId: string,
    dto: TopUpCreditsDto
  ): Promise<{ success: boolean; newTotalAllowed: number; newRemaining: number }> {
    const billingPeriod = this.getCurrentBillingPeriod();
    const summary = await this.ensureUsageSummary(tenantId, dto.metricType, billingPeriod);

    // Update extra credits
    const updated = await this.prisma.tenantUsageSummary.update({
      where: { id: summary.id },
      data: {
        extraCredits: summary.extraCredits + dto.credits,
      },
    });

    // Record invoice record for the top-up
    const activeSub = await this.prisma.subscription.findFirst({
      where: { tenantId, status: 'ACTIVE' },
    });

    if (activeSub) {
      await this.prisma.subscriptionInvoice.create({
        data: {
          tenantId,
          subscriptionId: activeSub.id,
          invoiceNumber: `TOPUP-${Date.now().toString().slice(-6)}`,
          amountMinor: BigInt(dto.amountMinor),
          status: 'PAID',
          billingPeriodStart: new Date(),
          billingPeriodEnd: new Date(Date.now() + 30 * 86400000),
          paidAt: new Date(),
          paymentReference: `${dto.paymentMethod}-TOPUP-${dto.metricType}`,
        },
      });
    }

    const totalAllowed = updated.quotaLimit + updated.extraCredits;
    const remaining = Math.max(0, totalAllowed - updated.usedQuantity);

    return {
      success: true,
      newTotalAllowed: totalAllowed,
      newRemaining: remaining,
    };
  }

  /**
   * Super Admin Overview: Total platform usage metrics in a billing period
   */
  async getAdminUsageOverview(billingPeriod: string = this.getCurrentBillingPeriod()) {
    const summaries = await this.prisma.tenantUsageSummary.groupBy({
      by: ['metricType'],
      where: { billingPeriod },
      _sum: {
        usedQuantity: true,
        quotaLimit: true,
        extraCredits: true,
      },
      _count: { tenantId: true },
    });

    return summaries.map((s) => ({
      metricType: s.metricType,
      totalTenantsActive: s._count.tenantId,
      totalUsedQuantity: s._sum.usedQuantity || 0,
      totalQuotaAllocated: (s._sum.quotaLimit || 0) + (s._sum.extraCredits || 0),
    }));
  }
}
