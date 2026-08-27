import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NoShowReportService } from './no-show-report.service';
import { OwnerDashboardService } from './owner-dashboard.service';
import { RevenueRecoveryService } from './revenue-recovery.service';
import { QueryNoShowReportDto } from './dto/query-no-show-report.dto';
import { QueryOwnerDashboardDto } from './dto/query-owner-dashboard.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@ApiTags('Reports & Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly noShowReportService: NoShowReportService,
    private readonly ownerDashboardService: OwnerDashboardService,
    private readonly revenueRecoveryService: RevenueRecoveryService
  ) {}

  // ---------------------------------------------------------------------------
  // Revenue Recovery Command Center (PF-057)
  // ---------------------------------------------------------------------------

  @Get('revenue-recovery/summary')
  @ApiOperation({ summary: 'Get summary of all recoverable revenue opportunities' })
  @ApiResponse({ status: 200, description: 'Revenue recovery summary' })
  getRevenueRecoverySummary(
    @CurrentTenant() tenantId: string,
    @Query('branchId') branchId?: string
  ) {
    return this.revenueRecoveryService.getRevenueRecoverySummary(tenantId, branchId);
  }

  @Get('revenue-recovery/opportunities')
  @ApiOperation({ summary: 'Get prioritized list of actionable revenue recovery opportunities' })
  @ApiResponse({ status: 200, description: 'Actionable recovery opportunities list' })
  getRevenueRecoveryOpportunities(
    @CurrentTenant() tenantId: string,
    @Query('branchId') branchId?: string
  ) {
    return this.revenueRecoveryService.getRevenueRecoveryOpportunities(tenantId, branchId);
  }

  @Get('revenue-recovery/dashboard')
  @ApiOperation({ summary: 'Get complete revenue recovery command center dataset' })
  @ApiResponse({ status: 200, description: 'Revenue recovery full dashboard dataset' })
  getRevenueRecoveryDashboard(
    @CurrentTenant() tenantId: string,
    @Query('branchId') branchId?: string
  ) {
    return this.revenueRecoveryService.getRevenueRecoveryDashboardData(tenantId, branchId);
  }

  @Post('revenue-recovery/quick-dispatch')
  @ApiOperation({ summary: '1-Click quick dispatch recovery reminder via LINE' })
  @ApiResponse({ status: 200, description: 'Dispatch status result' })
  quickDispatchRecovery(
    @CurrentTenant() tenantId: string,
    @Body() payload: {
      customerId: string;
      lineUserId?: string | null;
      message: string;
      opportunityId: string;
    }
  ) {
    return this.revenueRecoveryService.quickDispatchRecoveryMessage(tenantId, payload);
  }

  // ---------------------------------------------------------------------------
  // Owner Dashboard Endpoints (PF-055)
  // ---------------------------------------------------------------------------

  @Get('dashboard/owner')
  @ApiOperation({ summary: 'Get executive metrics for business owner dashboard' })
  @ApiResponse({ status: 200, description: 'Owner dashboard metrics (Revenue, Appointments, No-Shows, LTV, Retention, Daily Trend)' })
  getOwnerDashboard(
    @CurrentTenant() tenantId: string,
    @Query() query: QueryOwnerDashboardDto
  ) {
    return this.ownerDashboardService.getOwnerDashboardMetrics(tenantId, query);
  }

  // ---------------------------------------------------------------------------
  // No-Show Report Endpoints (PF-054)
  // ---------------------------------------------------------------------------

  @Get('no-show/summary')
  @ApiOperation({ summary: 'Get summary of appointment no-show rates, lost revenue, and lost minutes' })
  @ApiResponse({ status: 200, description: 'No-show report summary metrics' })
  getNoShowSummary(
    @CurrentTenant() tenantId: string,
    @Query() query: QueryNoShowReportDto
  ) {
    return this.noShowReportService.getNoShowSummary(tenantId, query);
  }

  @Get('no-show/customers')
  @ApiOperation({ summary: 'Get list of customers with repeat no-shows and risk ratings' })
  @ApiResponse({ status: 200, description: 'No-show customer list' })
  getNoShowByCustomers(
    @CurrentTenant() tenantId: string,
    @Query() query: QueryNoShowReportDto
  ) {
    return this.noShowReportService.getNoShowByCustomers(tenantId, query);
  }

  @Get('no-show/services')
  @ApiOperation({ summary: 'Get no-show breakdown by service' })
  @ApiResponse({ status: 200, description: 'No-show breakdown by service' })
  getNoShowByServices(
    @CurrentTenant() tenantId: string,
    @Query() query: QueryNoShowReportDto
  ) {
    return this.noShowReportService.getNoShowByServices(tenantId, query);
  }

  @Get('no-show/days')
  @ApiOperation({ summary: 'Get no-show breakdown by day of week' })
  @ApiResponse({ status: 200, description: 'No-show breakdown by day of week' })
  getNoShowByDayOfWeek(
    @CurrentTenant() tenantId: string,
    @Query() query: QueryNoShowReportDto
  ) {
    return this.noShowReportService.getNoShowByDayOfWeek(tenantId, query);
  }

  @Get('no-show/appointments')
  @ApiOperation({ summary: 'Get paginated list of no-show appointments with details and staff notes' })
  @ApiResponse({ status: 200, description: 'Paginated no-show appointments' })
  getNoShowAppointments(
    @CurrentTenant() tenantId: string,
    @Query() query: QueryNoShowReportDto
  ) {
    return this.noShowReportService.getNoShowAppointments(tenantId, query);
  }
}

