import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { SaaSAdminService } from './saas-admin.service';
import { QuerySaaSTenantsDto } from './dto/query-saas-tenants.dto';
import { UpdateTenantStatusDto } from './dto/update-tenant-status.dto';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('SaaS Super Admin Console')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_OWNER, UserRole.TENANT_ADMIN)
@Controller('saas-admin')
export class SaaSAdminController {
  constructor(private readonly saasAdminService: SaaSAdminService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get global SaaS KPIs, MRR, ARR, and platform health metrics' })
  @ApiResponse({ status: 200, description: 'SaaS metrics overview' })
  getMetricsOverview() {
    return this.saasAdminService.getMetricsOverview();
  }

  @Get('tenants')
  @ApiOperation({ summary: 'List all tenants across the SaaS platform with live counts' })
  @ApiResponse({ status: 200, description: 'Paginated list of tenants' })
  listTenants(@Query() query: QuerySaaSTenantsDto) {
    return this.saasAdminService.listTenants(query);
  }

  @Get('tenants/:id')
  @ApiOperation({ summary: 'Get complete tenant details, usage quotas, and users' })
  @ApiParam({ name: 'id', description: 'Tenant UUID' })
  @ApiResponse({ status: 200, description: 'Tenant details' })
  getTenantDetails(@Param('id') id: string) {
    return this.saasAdminService.getTenantDetails(id);
  }

  @Patch('tenants/:id/status')
  @ApiOperation({ summary: 'Suspend or reactivate a tenant' })
  @ApiParam({ name: 'id', description: 'Tenant UUID' })
  @ApiResponse({ status: 200, description: 'Tenant status updated' })
  updateTenantStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTenantStatusDto,
    @Req() req: any
  ) {
    const adminUserId = req.user?.id;
    return this.saasAdminService.updateTenantStatus(id, dto, adminUserId);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get system-wide audit trail logs' })
  @ApiResponse({ status: 200, description: 'Platform audit logs' })
  getSystemAuditLogs(@Query() query: QueryAuditLogsDto) {
    return this.saasAdminService.getSystemAuditLogs(query);
  }
}
