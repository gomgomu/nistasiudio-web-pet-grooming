import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsageMeteringService } from './usage-metering.service';
import { RecordUsageDto } from './dto/record-usage.dto';
import { TopUpCreditsDto } from './dto/top-up-credits.dto';
import { CheckQuotaQueryDto } from './dto/check-quota.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Usage Metering & Quotas')
@Controller()
export class UsageMeteringController {
  constructor(private readonly usageMeteringService: UsageMeteringService) {}

  // ---------------------------------------------------------------------------
  // Tenant Operations
  // ---------------------------------------------------------------------------

  @Get('usage-metering/current')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get current tenant usage meters, progress, and warning thresholds' })
  @ApiQuery({ name: 'billingPeriod', required: false, example: '2026-08' })
  @ApiResponse({ status: 200, description: 'Tenant usage dashboard' })
  getCurrentUsage(
    @CurrentTenant() tenantId: string,
    @Query('billingPeriod') billingPeriod?: string
  ) {
    return this.usageMeteringService.getTenantUsageDashboard(tenantId, billingPeriod);
  }

  @Get('usage-metering/check-quota')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Check remaining quota for a metric before consuming' })
  @ApiResponse({ status: 200, description: 'Quota check result' })
  checkQuota(
    @CurrentTenant() tenantId: string,
    @Query() query: CheckQuotaQueryDto
  ) {
    return this.usageMeteringService.checkQuota(
      tenantId,
      query.metricType,
      query.quantity || 1
    );
  }

  @Post('usage-metering/record')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Record consumption event (LINE message, SMS, Storage, etc.)' })
  @ApiResponse({ status: 201, description: 'Usage recorded successfully' })
  recordUsage(@Body() dto: RecordUsageDto) {
    return this.usageMeteringService.recordUsage(dto);
  }

  @Post('usage-metering/top-up')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_OWNER, UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Top up extra credits (e.g. 1,000 LINE messages pack)' })
  @ApiResponse({ status: 200, description: 'Credits added' })
  topUpCredits(
    @CurrentTenant() tenantId: string,
    @Body() dto: TopUpCreditsDto
  ) {
    return this.usageMeteringService.topUpCredits(tenantId, dto);
  }

  // ---------------------------------------------------------------------------
  // SaaS Super Admin Operations
  // ---------------------------------------------------------------------------

  @Get('admin/usage-metering')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_OWNER, UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: '[Admin] Get platform-wide resource usage metrics' })
  @ApiQuery({ name: 'billingPeriod', required: false, example: '2026-08' })
  @ApiResponse({ status: 200, description: 'Platform usage metrics overview' })
  getAdminUsageOverview(@Query('billingPeriod') billingPeriod?: string) {
    return this.usageMeteringService.getAdminUsageOverview(billingPeriod);
  }
}
