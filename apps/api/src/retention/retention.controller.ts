import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RetentionService } from './retention.service';
import { GroomingDueService } from './grooming-due.service';
import { VaccineDueService } from './vaccine-due.service';
import { CampaignService } from './campaign.service';
import { QuerySegmentsDto } from './dto/query-segments.dto';
import { QueryGroomingDueDto } from './dto/query-grooming-due.dto';
import { QueryVaccineDueDto } from './dto/query-vaccine-due.dto';
import { CreatePetVaccinationDto } from './dto/record-vaccination.dto';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { QueryCampaignDto } from './dto/query-campaign.dto';
import { RecordCampaignConversionDto } from './dto/record-conversion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@ApiTags('Retention & Customer Segmentation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('retention')
export class RetentionController {
  constructor(
    private readonly retentionService: RetentionService,
    private readonly groomingDueService: GroomingDueService,
    private readonly vaccineDueService: VaccineDueService,
    private readonly campaignService: CampaignService
  ) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get retention overview and customer segmentation summary metrics' })
  @ApiResponse({ status: 200, description: 'Summary of VIP, New, Active, At-Risk, and Lost customer segments' })
  getOverview(
    @CurrentTenant() tenantId: string,
    @Query() query: QuerySegmentsDto
  ) {
    return this.retentionService.getRetentionOverview(tenantId, {
      newDaysThreshold: query.newDaysThreshold,
      activeDaysThreshold: query.activeDaysThreshold,
      atRiskDaysThreshold: query.atRiskDaysThreshold,
      vipMinSpendMinor: query.vipMinSpendMinor,
      vipMinVisits: query.vipMinVisits,
    });
  }

  @Get('segments/summary')
  @ApiOperation({ summary: 'Alias for retention overview' })
  @ApiResponse({ status: 200, description: 'Summary of VIP, New, Active, At-Risk, and Lost customer segments' })
  getSegmentsSummary(
    @CurrentTenant() tenantId: string,
    @Query() query: QuerySegmentsDto
  ) {
    return this.getOverview(tenantId, query);
  }

  @Get('customers')
  @ApiOperation({ summary: 'Get paginated list of customers classified by segment with RFM metrics' })
  @ApiResponse({ status: 200, description: 'Paginated segmented customer list' })
  getSegmentedCustomers(
    @CurrentTenant() tenantId: string,
    @Query() query: QuerySegmentsDto
  ) {
    return this.retentionService.getSegmentedCustomers(tenantId, query);
  }

  @Get('customers/:id')
  @ApiOperation({ summary: 'Get detailed RFM and segmentation breakdown for a single customer' })
  @ApiResponse({ status: 200, description: 'Customer segmentation details and recent history' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  getCustomerDetail(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) customerId: string,
    @Query() query: QuerySegmentsDto
  ) {
    return this.retentionService.getCustomerSegmentDetail(tenantId, customerId, {
      newDaysThreshold: query.newDaysThreshold,
      activeDaysThreshold: query.activeDaysThreshold,
      atRiskDaysThreshold: query.atRiskDaysThreshold,
      vipMinSpendMinor: query.vipMinSpendMinor,
      vipMinVisits: query.vipMinVisits,
    });
  }

  // ---------------------------------------------------------------------------
  // Grooming Due Detector Endpoints (PF-051)
  // ---------------------------------------------------------------------------

  @Get('grooming-due/summary')
  @ApiOperation({ summary: 'Get summary metrics of pets due/overdue for grooming' })
  @ApiResponse({ status: 200, description: 'Grooming due metrics (Upcoming, Due Now, Overdue, Critical)' })
  getGroomingDueSummary(
    @CurrentTenant() tenantId: string,
    @Query() query: QueryGroomingDueDto
  ) {
    return this.groomingDueService.getGroomingDueSummary(tenantId, {
      defaultIntervalDays: query.defaultIntervalDays,
      dogIntervalDays: query.dogIntervalDays,
      catIntervalDays: query.catIntervalDays,
      upcomingDaysThreshold: query.upcomingDaysThreshold,
      overdueDaysThreshold: query.overdueDaysThreshold,
      criticalOverdueDaysThreshold: query.criticalOverdueDaysThreshold,
      usePersonalizedInterval: query.usePersonalizedInterval,
    });
  }

  @Get('grooming-due/pets')
  @ApiOperation({ summary: 'Get paginated list of pets with grooming due status and recommended messages' })
  @ApiResponse({ status: 200, description: 'Paginated grooming due pet items' })
  getGroomingDuePets(
    @CurrentTenant() tenantId: string,
    @Query() query: QueryGroomingDueDto
  ) {
    return this.groomingDueService.getGroomingDuePets(tenantId, query);
  }

  // ---------------------------------------------------------------------------
  // Vaccine Due Detector Endpoints (PF-052)
  // ---------------------------------------------------------------------------

  @Get('vaccine-due/summary')
  @ApiOperation({ summary: 'Get summary metrics of pets due/overdue for vaccination boosters' })
  @ApiResponse({ status: 200, description: 'Vaccination due metrics (Upcoming, Due Now, Overdue, Critical)' })
  getVaccineDueSummary(
    @CurrentTenant() tenantId: string,
    @Query() query: QueryVaccineDueDto
  ) {
    return this.vaccineDueService.getVaccineDueSummary(tenantId, {
      annualIntervalDays: query.annualIntervalDays,
      upcomingDaysThreshold: query.upcomingDaysThreshold,
      dueNowDaysThreshold: query.dueNowDaysThreshold,
      criticalOverdueDaysThreshold: query.criticalOverdueDaysThreshold,
    });
  }

  @Get('vaccine-due/pets')
  @ApiOperation({ summary: 'Get paginated list of pets with vaccine due status and clinical risk notes' })
  @ApiResponse({ status: 200, description: 'Paginated vaccine due pet items' })
  getVaccineDuePets(
    @CurrentTenant() tenantId: string,
    @Query() query: QueryVaccineDueDto
  ) {
    return this.vaccineDueService.getVaccineDuePets(tenantId, query);
  }

  @Post('vaccine-due/record')
  @ApiOperation({ summary: 'Record a new pet vaccination (Veterinary module ready)' })
  @ApiResponse({ status: 201, description: 'Vaccination record created successfully' })
  recordVaccination(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreatePetVaccinationDto
  ) {
    return this.vaccineDueService.recordVaccination(tenantId, dto);
  }

  // ---------------------------------------------------------------------------
  // Win-Back & Campaign Endpoints (PF-053)
  // ---------------------------------------------------------------------------

  @Get('campaigns/summary')
  @ApiOperation({ summary: 'Get overall Win-Back campaigns performance summary and ROI' })
  @ApiResponse({ status: 200, description: 'Campaign performance metrics and conversion rates' })
  getCampaignSummary(@CurrentTenant() tenantId: string) {
    return this.campaignService.getCampaignPerformanceSummary(tenantId);
  }

  @Get('campaigns/preview-audience')
  @ApiOperation({ summary: 'Preview audience size, LINE availability, and estimated revenue for a segment' })
  @ApiResponse({ status: 200, description: 'Audience preview count and sample customer list' })
  previewCampaignAudience(
    @CurrentTenant() tenantId: string,
    @Query('audienceSegment') audienceSegment: any
  ) {
    return this.campaignService.getWinBackAudiencePreview(tenantId, audienceSegment || 'AT_RISK');
  }

  @Get('campaigns')
  @ApiOperation({ summary: 'Get list of marketing and win-back campaigns' })
  @ApiResponse({ status: 200, description: 'Paginated campaign list' })
  getCampaigns(
    @CurrentTenant() tenantId: string,
    @Query() query: QueryCampaignDto
  ) {
    return this.campaignService.getCampaigns(tenantId, query);
  }

  @Post('campaigns')
  @ApiOperation({ summary: 'Create a new Win-Back or marketing campaign' })
  @ApiResponse({ status: 201, description: 'Campaign created successfully' })
  createCampaign(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateCampaignDto
  ) {
    return this.campaignService.createCampaign(tenantId, dto);
  }

  @Get('campaigns/:id')
  @ApiOperation({ summary: 'Get campaign details and recipient delivery statuses' })
  @ApiResponse({ status: 200, description: 'Campaign details with recipients' })
  getCampaignById(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) campaignId: string
  ) {
    return this.campaignService.getCampaignById(tenantId, campaignId);
  }

  @Post('campaigns/:id/launch')
  @ApiOperation({ summary: 'Launch campaign dispatch to all eligible audience recipients' })
  @ApiResponse({ status: 200, description: 'Campaign dispatched successfully' })
  launchCampaign(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) campaignId: string
  ) {
    return this.campaignService.launchCampaign(tenantId, campaignId);
  }

  @Post('campaigns/:id/conversion')
  @ApiOperation({ summary: 'Record customer conversion attributed to a campaign' })
  @ApiResponse({ status: 200, description: 'Conversion recorded successfully' })
  recordConversion(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) campaignId: string,
    @Body() dto: RecordCampaignConversionDto
  ) {
    return this.campaignService.recordCampaignConversion(tenantId, campaignId, dto);
  }
}



