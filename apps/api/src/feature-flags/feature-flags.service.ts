import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CreateFeatureFlagDto } from './dto/create-feature-flag.dto';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';
import { SetTenantFeatureOverrideDto } from './dto/set-tenant-override.dto';
import {
  FeatureFlagItem,
  TenantFeatureOverrideItem,
  EvaluatedFeatureFlag,
} from '@petflow/types';

@Injectable()
export class FeatureFlagsService {
  private readonly logger = new Logger(FeatureFlagsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionsService: SubscriptionsService
  ) {}

  /**
   * Auto-seed standard default feature flags
   */
  async ensureDefaultFlags(): Promise<void> {
    const count = await this.prisma.featureFlag.count();
    if (count > 0) return;

    const defaultFlags = [
      {
        key: 'CLINICAL_SOAP',
        name: 'Veterinary Clinical OPD & SOAP Records',
        description: 'ห้องตรวจรักษาผู้ป่วยนอก และการบันทึกเวชระเบียน SOAP สัตวแพทย์',
        category: 'CLINICAL',
        isGlobalEnabled: true,
        minPlanCode: 'STARTER',
      },
      {
        key: 'VACCINATION_REGISTRY',
        name: 'Digital Vaccination & Passport',
        description: 'ทะเบียนประวัติการฉีดวัคซีน และสมุดวัคซีนดิจิทัล',
        category: 'CLINICAL',
        isGlobalEnabled: true,
        minPlanCode: 'STARTER',
      },
      {
        key: 'LINE_MESSAGING',
        name: 'LINE Official Account Integration',
        description: 'ส่งแจ้งเตือนนัดหมาย, คิวกรูมมิ่ง, และใบเสร็จผ่าน LINE OA อัตโนมัติ',
        category: 'MARKETING',
        isGlobalEnabled: true,
        minPlanCode: 'PROFESSIONAL',
      },
      {
        key: 'ADVANCED_INVENTORY',
        name: 'Advanced Inventory & Batch Lot Tracking',
        description: 'คลังยาและสินค้าขั้นสูง ติดตาม Lot วันหมดอายุ และ FIFO Cost',
        category: 'OPERATIONS',
        isGlobalEnabled: true,
        minPlanCode: 'PROFESSIONAL',
      },
      {
        key: 'COMMISSION_ENGINE',
        name: 'Staff & Groomer Commission Calculation',
        description: 'ระบบคำนวณค่าคอมมิชชั่นช่างกรูมมิ่งและสัตวแพทย์อัตโนมัติ',
        category: 'FINANCE',
        isGlobalEnabled: true,
        minPlanCode: 'PROFESSIONAL',
      },
      {
        key: 'MULTI_BRANCH_HQ',
        name: 'Multi-Branch Central HQ & Stock Transfer',
        description: 'ศูนย์ควบคุมหลายสาขา และการโอนย้ายสต็อกสินค้าระหว่างสาขา',
        category: 'ENTERPRISE',
        isGlobalEnabled: true,
        minPlanCode: 'ENTERPRISE',
      },
      {
        key: 'API_ACCESS',
        name: 'Developer API & Webhooks Access',
        description: 'การเชื่อมต่อภายนอกผ่าน REST API และ Webhooks',
        category: 'DEVELOPER',
        isGlobalEnabled: true,
        minPlanCode: 'ENTERPRISE',
      },
      {
        key: 'TELE_MED_BETA',
        name: 'Tele-Veterinary Video Consultation (Beta)',
        description: 'ระบบปรึกษาสัตวแพทย์ทางไกลผ่านวิดีโอคอล (ฟีเจอร์ทดลอง)',
        category: 'BETA',
        isGlobalEnabled: true,
        minPlanCode: 'ENTERPRISE',
      },
      {
        key: 'AI_ASSISTANT',
        name: 'AI Clinical Assistant & Voice Scribe',
        description: 'ผู้ช่วย AI สรุปประวัติการรักษาและถอดเสียง SOAP Note',
        category: 'BETA',
        isGlobalEnabled: true,
        minPlanCode: 'ENTERPRISE',
      },
    ];

    for (const flag of defaultFlags) {
      await this.prisma.featureFlag.create({ data: flag });
    }
  }

  /**
   * Get all evaluated feature flags for a tenant
   */
  async getTenantFlags(tenantId: string): Promise<EvaluatedFeatureFlag[]> {
    await this.ensureDefaultFlags();

    const [flags, overrides, subDetails] = await Promise.all([
      this.prisma.featureFlag.findMany({ orderBy: { key: 'asc' } }),
      this.prisma.tenantFeatureOverride.findMany({
        where: { tenantId },
        include: { featureFlag: true },
      }),
      this.subscriptionsService.getTenantSubscription(tenantId),
    ]);

    const overrideMap = new Map<string, { isEnabled: boolean; expiresAt: Date | null; reason: string | null }>();
    for (const o of overrides) {
      overrideMap.set(o.featureFlag.key, {
        isEnabled: o.isEnabled,
        expiresAt: o.expiresAt,
        reason: o.reason,
      });
    }

    const now = new Date();
    const evaluated: EvaluatedFeatureFlag[] = [];

    for (const flag of flags) {
      // 1. Global Kill-switch check
      if (!flag.isGlobalEnabled) {
        evaluated.push({
          key: flag.key,
          name: flag.name,
          category: flag.category,
          isEnabled: false,
          source: 'GLOBAL_OFF',
          reason: 'Feature is globally disabled by platform administrators',
        });
        continue;
      }

      // 2. Tenant Override check
      const override = overrideMap.get(flag.key);
      if (override) {
        // If expired, ignore override and proceed to plan check
        const isExpired = override.expiresAt && override.expiresAt < now;
        if (!isExpired) {
          evaluated.push({
            key: flag.key,
            name: flag.name,
            category: flag.category,
            isEnabled: override.isEnabled,
            source: 'TENANT_OVERRIDE',
            reason: override.reason || 'Explicit tenant override',
          });
          continue;
        }
      }

      // 3. Plan Entitlement check
      const isPlanEntitled = this.checkPlanEntitlement(flag.key, subDetails);
      evaluated.push({
        key: flag.key,
        name: flag.name,
        category: flag.category,
        isEnabled: isPlanEntitled,
        source: 'PLAN_ENTITLEMENT',
        reason: isPlanEntitled
          ? `Included in plan ${subDetails.planCode}`
          : `Requires higher subscription plan (${flag.minPlanCode || 'PROFESSIONAL'})`,
      });
    }

    return evaluated;
  }

  /**
   * Check if a specific feature is enabled for a tenant
   */
  async isFeatureEnabled(tenantId: string, featureKey: string): Promise<boolean> {
    const flags = await this.getTenantFlags(tenantId);
    const flag = flags.find((f) => f.key === featureKey.toUpperCase());
    return flag ? flag.isEnabled : false;
  }

  /**
   * Get all feature flags for Admin Console
   */
  async getAllFlagsAdmin(): Promise<FeatureFlagItem[]> {
    await this.ensureDefaultFlags();

    const flags = await this.prisma.featureFlag.findMany({
      include: {
        _count: {
          select: { overrides: true },
        },
      },
      orderBy: { key: 'asc' },
    });

    return flags.map((f) => ({
      id: f.id,
      key: f.key,
      name: f.name,
      description: f.description || null,
      category: f.category,
      isGlobalEnabled: f.isGlobalEnabled,
      minPlanCode: f.minPlanCode || null,
      overrideCount: f._count.overrides,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
    }));
  }

  /**
   * Create a new feature flag
   */
  async createFlag(dto: CreateFeatureFlagDto): Promise<FeatureFlagItem> {
    const key = dto.key.toUpperCase().trim();

    const existing = await this.prisma.featureFlag.findUnique({
      where: { key },
    });

    if (existing) {
      throw new ConflictException(`Feature flag with key ${key} already exists`);
    }

    const flag = await this.prisma.featureFlag.create({
      data: {
        key,
        name: dto.name,
        description: dto.description || null,
        category: dto.category || 'CORE',
        isGlobalEnabled: dto.isGlobalEnabled ?? true,
        minPlanCode: dto.minPlanCode ? dto.minPlanCode.toUpperCase() : null,
      },
    });

    return {
      id: flag.id,
      key: flag.key,
      name: flag.name,
      description: flag.description || null,
      category: flag.category,
      isGlobalEnabled: flag.isGlobalEnabled,
      minPlanCode: flag.minPlanCode || null,
      overrideCount: 0,
      createdAt: flag.createdAt.toISOString(),
      updatedAt: flag.updatedAt.toISOString(),
    };
  }

  /**
   * Update feature flag
   */
  async updateFlag(id: string, dto: UpdateFeatureFlagDto): Promise<FeatureFlagItem> {
    const flag = await this.prisma.featureFlag.findUnique({ where: { id } });
    if (!flag) {
      throw new NotFoundException('Feature flag not found');
    }

    const updated = await this.prisma.featureFlag.update({
      where: { id },
      data: {
        name: dto.name !== undefined ? dto.name : flag.name,
        description: dto.description !== undefined ? dto.description : flag.description,
        category: dto.category !== undefined ? dto.category : flag.category,
        isGlobalEnabled:
          dto.isGlobalEnabled !== undefined ? dto.isGlobalEnabled : flag.isGlobalEnabled,
        minPlanCode:
          dto.minPlanCode !== undefined
            ? dto.minPlanCode
              ? dto.minPlanCode.toUpperCase()
              : null
            : flag.minPlanCode,
      },
      include: {
        _count: { select: { overrides: true } },
      },
    });

    return {
      id: updated.id,
      key: updated.key,
      name: updated.name,
      description: updated.description || null,
      category: updated.category,
      isGlobalEnabled: updated.isGlobalEnabled,
      minPlanCode: updated.minPlanCode || null,
      overrideCount: updated._count.overrides,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /**
   * Set tenant-specific feature override
   */
  async setTenantOverride(
    dto: SetTenantFeatureOverrideDto
  ): Promise<TenantFeatureOverrideItem> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: dto.tenantId },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const featureKey = dto.featureKey.toUpperCase().trim();
    const flag = await this.prisma.featureFlag.findUnique({
      where: { key: featureKey },
    });
    if (!flag) {
      throw new NotFoundException(`Feature flag ${featureKey} not found`);
    }

    const override = await this.prisma.tenantFeatureOverride.upsert({
      where: {
        tenantId_featureFlagId: {
          tenantId: dto.tenantId,
          featureFlagId: flag.id,
        },
      },
      create: {
        tenantId: dto.tenantId,
        featureFlagId: flag.id,
        isEnabled: dto.isEnabled,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        reason: dto.reason || null,
      },
      update: {
        isEnabled: dto.isEnabled,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        reason: dto.reason || null,
      },
    });

    return {
      id: override.id,
      tenantId: override.tenantId,
      featureFlagId: override.featureFlagId,
      featureKey: flag.key,
      isEnabled: override.isEnabled,
      expiresAt: override.expiresAt ? override.expiresAt.toISOString() : null,
      reason: override.reason || null,
      createdAt: override.createdAt.toISOString(),
    };
  }

  /**
   * Remove tenant feature override
   */
  async removeTenantOverride(
    tenantId: string,
    featureKey: string
  ): Promise<{ success: boolean }> {
    const flag = await this.prisma.featureFlag.findUnique({
      where: { key: featureKey.toUpperCase().trim() },
    });
    if (!flag) {
      throw new NotFoundException(`Feature flag ${featureKey} not found`);
    }

    await this.prisma.tenantFeatureOverride.deleteMany({
      where: {
        tenantId,
        featureFlagId: flag.id,
      },
    });

    return { success: true };
  }

  /**
   * Helper: check plan capabilities
   */
  private checkPlanEntitlement(
    featureKey: string,
    sub: {
      planCode: string;
      hasLineIntegration: boolean;
      hasAdvancedInventory: boolean;
      hasClinicalSoap: boolean;
      hasVaccinationRegistry: boolean;
      hasCommissionEngine: boolean;
      hasMultiBranchCentral: boolean;
      hasApiAccess: boolean;
    }
  ): boolean {
    switch (featureKey) {
      case 'CLINICAL_SOAP':
        return sub.hasClinicalSoap;
      case 'VACCINATION_REGISTRY':
        return sub.hasVaccinationRegistry;
      case 'LINE_MESSAGING':
        return sub.hasLineIntegration;
      case 'ADVANCED_INVENTORY':
        return sub.hasAdvancedInventory;
      case 'COMMISSION_ENGINE':
        return sub.hasCommissionEngine;
      case 'MULTI_BRANCH_HQ':
        return sub.hasMultiBranchCentral;
      case 'API_ACCESS':
        return sub.hasApiAccess;
      case 'TELE_MED_BETA':
      case 'AI_ASSISTANT':
        return sub.planCode === 'ENTERPRISE';
      default:
        return true;
    }
  }
}
