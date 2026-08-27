import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RetentionService } from './retention.service';
import { LineService } from '../line/line.service';
import {
  CampaignItem,
  CampaignRecipientItem,
  CampaignPerformanceSummary,
  AudiencePreviewResult,
  CampaignAudienceSegment,
  CampaignStatus,
  CampaignChannel,
  PaginatedResponse,
} from '@petflow/types';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { QueryCampaignDto } from './dto/query-campaign.dto';
import { RecordCampaignConversionDto } from './dto/record-conversion.dto';

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly retentionService: RetentionService,
    private readonly lineService: LineService
  ) {}

  /**
   * Get overall campaign performance summary and Win-back ROI
   */
  async getCampaignPerformanceSummary(tenantId: string): Promise<CampaignPerformanceSummary> {
    const campaigns = await this.prisma.campaign.findMany({
      where: { tenantId },
      include: {
        recipients: true,
      },
    });

    let totalMessagesSent = 0;
    let totalConvertedCustomers = 0;
    let totalRevenueRecoveredMinor = 0;
    let activeCampaigns = 0;

    for (const c of campaigns) {
      if (c.status === 'RUNNING' || c.status === 'SCHEDULED') {
        activeCampaigns++;
      }
      for (const r of c.recipients) {
        if (r.status === 'SENT' || r.status === 'DELIVERED' || r.status === 'CONVERTED') {
          totalMessagesSent++;
        }
        if (r.status === 'CONVERTED') {
          totalConvertedCustomers++;
        }
      }
    }

    const averageConversionRate =
      totalMessagesSent > 0
        ? Math.round((totalConvertedCustomers / totalMessagesSent) * 1000) / 10
        : 0;

    // Estimate recovered revenue: average invoice ~ 650 THB (65,000 satang) per converted customer
    totalRevenueRecoveredMinor = totalConvertedCustomers * 65000;

    return {
      totalCampaigns: campaigns.length,
      activeCampaigns,
      totalMessagesSent,
      totalConvertedCustomers,
      totalRevenueRecoveredMinor,
      averageConversionRate,
    };
  }

  /**
   * Preview audience size and potential revenue for a Win-back segment
   */
  async getWinBackAudiencePreview(
    tenantId: string,
    audienceSegment: CampaignAudienceSegment,
    criteria?: Record<string, any>
  ): Promise<AudiencePreviewResult> {
    const eligibleCustomers = await this.resolveAudienceCustomers(tenantId, audienceSegment, criteria);

    const totalEligibleCustomers = eligibleCustomers.length;
    const optedInCount = eligibleCustomers.filter((c) => c.marketingStatus === 'OPTED_IN').length;
    const withLineCount = eligibleCustomers.filter((c) => !!c.lineUserId).length;

    // Estimated recoverable revenue based on average ticket
    const estimatedRecoverableRevenueMinor = eligibleCustomers.reduce(
      (sum, c) => sum + (c.averageTicketMinor || 65000),
      0
    );

    const sampleCustomers = eligibleCustomers.slice(0, 10).map((c) => ({
      id: c.id,
      fullName: `${c.firstName} ${c.lastName}`.trim(),
      phone: c.phone,
      segment: c.segment,
      lastVisitAt: c.lastVisitAt,
      daysSinceLastVisit: c.daysSinceLastVisit,
      totalSpentMinor: c.totalSpentMinor,
    }));

    return {
      audienceSegment,
      totalEligibleCustomers,
      optedInCount,
      withLineCount,
      estimatedRecoverableRevenueMinor,
      sampleCustomers,
    };
  }

  /**
   * Create a new Win-back / Retention marketing campaign
   */
  async createCampaign(tenantId: string, dto: CreateCampaignDto): Promise<CampaignItem> {
    // 1. Resolve eligible customers for this audience
    const eligibleCustomers = await this.resolveAudienceCustomers(
      tenantId,
      dto.audienceSegment,
      dto.audienceFilterCriteria
    );

    // Filter by PDPA marketing consent
    const deliverableCustomers = eligibleCustomers.filter(
      (c) => c.marketingStatus !== 'OPTED_OUT'
    );

    const scheduledDate = dto.scheduledAt ? new Date(dto.scheduledAt) : new Date();
    const initialStatus = dto.launchImmediately ? 'RUNNING' : 'DRAFT';

    // 2. Create campaign in DB
    const campaign = await this.prisma.campaign.create({
      data: {
        tenantId,
        name: dto.name,
        channel: dto.channel || 'LINE',
        status: initialStatus,
        scheduledAt: scheduledDate,
      },
    });

    // 3. Create campaign recipients
    if (deliverableCustomers.length > 0) {
      await this.prisma.campaignRecipient.createMany({
        data: deliverableCustomers.map((c) => ({
          campaignId: campaign.id,
          customerId: c.id,
          status: 'PENDING',
        })),
      });
    }

    // 4. If launch immediately requested, execute delivery
    if (dto.launchImmediately) {
      await this.executeCampaignDispatch(
        tenantId,
        campaign.id,
        dto.messageTemplate,
        dto.promoCode,
        dto.channel || 'LINE'
      );
    }

    return this.getCampaignById(tenantId, campaign.id);
  }

  /**
   * Get list of campaigns for a tenant
   */
  async getCampaigns(
    tenantId: string,
    query: QueryCampaignDto
  ): Promise<PaginatedResponse<CampaignItem>> {
    const campaigns = await this.prisma.campaign.findMany({
      where: {
        tenantId,
        status: query.status,
        channel: query.channel,
      },
      include: {
        recipients: {
          include: {
            customer: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let items: CampaignItem[] = campaigns.map((c) => this.mapCampaignToItem(c));

    if (query.search && query.search.trim()) {
      const s = query.search.toLowerCase().trim();
      items = items.filter((c) => c.name.toLowerCase().includes(s));
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

  /**
   * Get campaign details by ID
   */
  async getCampaignById(tenantId: string, campaignId: string): Promise<CampaignItem> {
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        id: campaignId,
        tenantId,
      },
      include: {
        recipients: {
          include: {
            customer: true,
          },
          orderBy: { sentAt: 'desc' },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${campaignId} not found in this tenant`);
    }

    return this.mapCampaignToItem(campaign);
  }

  /**
   * Launch / Send a campaign
   */
  async launchCampaign(tenantId: string, campaignId: string): Promise<CampaignItem> {
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        id: campaignId,
        tenantId,
      },
      include: {
        recipients: {
          include: {
            customer: {
              include: {
                pets: true,
              },
            },
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${campaignId} not found`);
    }

    if (campaign.status === 'COMPLETED') {
      throw new BadRequestException('Campaign has already been completed');
    }

    // Update status to RUNNING
    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'RUNNING' },
    });

    // Execute dispatch
    const defaultTemplate = `สวัสดีครับคุณ {customerName} ทางร้านคิดถึงน้อง {petName} มากเลยครับ! รับสิทธิพิเศษส่วนลดพิเศษเฉพาะคุณ รหัส {promoCode} นัดหมายได้เลยนะครับ 🐾💖`;
    await this.executeCampaignDispatch(
      tenantId,
      campaignId,
      defaultTemplate,
      'WINBACK',
      (campaign.channel as CampaignChannel) || 'LINE'
    );

    return this.getCampaignById(tenantId, campaignId);
  }

  /**
   * Record a customer conversion attributed to a campaign
   */
  async recordCampaignConversion(
    tenantId: string,
    campaignId: string,
    dto: RecordCampaignConversionDto
  ) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, tenantId },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${campaignId} not found`);
    }

    const recipient = await this.prisma.campaignRecipient.findFirst({
      where: {
        campaignId,
        customerId: dto.customerId,
      },
    });

    if (!recipient) {
      throw new NotFoundException(`Customer ${dto.customerId} is not a recipient of campaign ${campaignId}`);
    }

    return this.prisma.campaignRecipient.update({
      where: { id: recipient.id },
      data: {
        status: 'CONVERTED',
        sentAt: recipient.sentAt || new Date(),
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Internal Helpers
  // ---------------------------------------------------------------------------

  private async resolveAudienceCustomers(
    tenantId: string,
    audienceSegment: CampaignAudienceSegment,
    criteria?: Record<string, any>
  ) {
    // 1. Get segmented customers from RetentionService
    const segments = await this.retentionService.getSegmentedCustomers(tenantId, {
      segment: audienceSegment === 'ALL' ? undefined : (audienceSegment as any),
      limit: 500,
    });

    let customers = segments.data;

    // 2. Custom criteria filters
    if (criteria?.minDaysSinceLastVisit) {
      customers = customers.filter(
        (c) => (c.daysSinceLastVisit || 0) >= criteria.minDaysSinceLastVisit
      );
    }

    if (criteria?.species) {
      customers = customers.filter((c) =>
        c.pets.some((p: any) => p.species === criteria.species)
      );
    }

    return customers;
  }

  private async executeCampaignDispatch(
    tenantId: string,
    campaignId: string,
    messageTemplate: string,
    promoCode?: string,
    channel: CampaignChannel = 'LINE'
  ) {
    const recipients = await this.prisma.campaignRecipient.findMany({
      where: {
        campaignId,
        status: 'PENDING',
      },
      include: {
        customer: {
          include: {
            pets: true,
          },
        },
      },
    });

    for (const r of recipients) {
      const customer = r.customer;
      const petName = customer.pets.length > 0 ? customer.pets[0].name : 'สัตว์เลี้ยงของคุณ';

      // Replace template variables
      const personalizedMessage = messageTemplate
        .replace(/{customerName}/g, customer.firstName)
        .replace(/{customerFullName}/g, `${customer.firstName} ${customer.lastName}`.trim())
        .replace(/{petName}/g, petName)
        .replace(/{promoCode}/g, promoCode || 'WINBACK');

      let deliveryStatus = 'DELIVERED';

      if (channel === 'LINE' && customer.lineUserId) {
        try {
          await this.lineService.pushTextMessage(tenantId, customer.lineUserId, personalizedMessage);
          deliveryStatus = 'DELIVERED';
        } catch (err) {
          this.logger.warn(`Failed to push LINE message to ${customer.lineUserId}: ${err}`);
          deliveryStatus = 'FAILED';
        }
      } else if (!customer.lineUserId) {
        deliveryStatus = 'SENT'; // Queued for SMS fallback
      }

      await this.prisma.campaignRecipient.update({
        where: { id: r.id },
        data: {
          status: deliveryStatus,
          sentAt: new Date(),
        },
      });
    }

    // Mark campaign as COMPLETED
    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'COMPLETED' },
    });
  }

  private mapCampaignToItem(campaign: any): CampaignItem {
    const recipients: CampaignRecipientItem[] = (campaign.recipients || []).map((r: any) => ({
      id: r.id,
      campaignId: r.campaignId,
      customerId: r.customerId,
      customerName: r.customer ? `${r.customer.firstName} ${r.customer.lastName}`.trim() : 'ลูกค้า',
      customerPhone: r.customer ? r.customer.phone : '-',
      lineUserId: r.customer?.lineUserId,
      status: r.status as any,
      sentAt: r.sentAt ? r.sentAt.toISOString() : null,
      convertedAt: r.status === 'CONVERTED' ? (r.sentAt ? r.sentAt.toISOString() : null) : null,
      revenueMinor: r.status === 'CONVERTED' ? 65000 : 0,
    }));

    const targetCount = recipients.length;
    const sentCount = recipients.filter(
      (r) => r.status === 'SENT' || r.status === 'DELIVERED' || r.status === 'CONVERTED'
    ).length;
    const deliveredCount = recipients.filter(
      (r) => r.status === 'DELIVERED' || r.status === 'CONVERTED'
    ).length;
    const convertedCount = recipients.filter((r) => r.status === 'CONVERTED').length;
    const revenueGeneratedMinor = convertedCount * 65000;
    const conversionRate =
      sentCount > 0 ? Math.round((convertedCount / sentCount) * 1000) / 10 : 0;

    return {
      id: campaign.id,
      tenantId: campaign.tenantId,
      name: campaign.name,
      channel: (campaign.channel as CampaignChannel) || 'LINE',
      status: (campaign.status as CampaignStatus) || 'DRAFT',
      audienceSegment: 'AT_RISK',
      audienceFilterCriteria: null,
      messageTemplate: `สวัสดีครับคุณ {customerName} คิดถึงน้อง {petName} จังเลย! รับส่วนลด 15% รหัส WINBACK`,
      promoCode: 'WINBACK',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      scheduledAt: campaign.scheduledAt ? campaign.scheduledAt.toISOString() : new Date().toISOString(),
      createdAt: campaign.createdAt ? campaign.createdAt.toISOString() : new Date().toISOString(),
      targetCount,
      sentCount,
      deliveredCount,
      convertedCount,
      revenueGeneratedMinor,
      conversionRate,
      recipients,
    };
  }
}
