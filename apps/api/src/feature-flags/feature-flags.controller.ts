import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { FeatureFlagsService } from './feature-flags.service';
import { CreateFeatureFlagDto } from './dto/create-feature-flag.dto';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';
import { SetTenantFeatureOverrideDto } from './dto/set-tenant-override.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Feature Flags')
@Controller()
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  // ---------------------------------------------------------------------------
  // Tenant Operations
  // ---------------------------------------------------------------------------

  @Get('feature-flags')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get all evaluated feature flags for the current tenant' })
  @ApiResponse({ status: 200, description: 'List of evaluated feature flags' })
  getTenantFlags(@CurrentTenant() tenantId: string) {
    return this.featureFlagsService.getTenantFlags(tenantId);
  }

  @Get('feature-flags/:key/check')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Check if a specific feature is enabled for the current tenant' })
  @ApiParam({ name: 'key', description: 'Feature flag key e.g. LINE_MESSAGING' })
  @ApiResponse({ status: 200, description: 'Feature flag enabled boolean' })
  async checkFeature(
    @CurrentTenant() tenantId: string,
    @Param('key') key: string
  ) {
    const isEnabled = await this.featureFlagsService.isFeatureEnabled(tenantId, key);
    return { key, isEnabled };
  }

  // ---------------------------------------------------------------------------
  // SaaS Admin Operations
  // ---------------------------------------------------------------------------

  @Get('admin/feature-flags')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_OWNER, UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: '[Admin] Get all feature flags and metadata' })
  @ApiResponse({ status: 200, description: 'All feature flags list' })
  getAllFlagsAdmin() {
    return this.featureFlagsService.getAllFlagsAdmin();
  }

  @Post('admin/feature-flags')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_OWNER)
  @ApiOperation({ summary: '[Admin] Create a new feature flag' })
  @ApiResponse({ status: 201, description: 'Feature flag created' })
  createFlag(@Body() dto: CreateFeatureFlagDto) {
    return this.featureFlagsService.createFlag(dto);
  }

  @Patch('admin/feature-flags/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_OWNER)
  @ApiOperation({ summary: '[Admin] Update feature flag metadata / global switch' })
  @ApiParam({ name: 'id', description: 'Feature flag UUID' })
  @ApiResponse({ status: 200, description: 'Feature flag updated' })
  updateFlag(
    @Param('id') id: string,
    @Body() dto: UpdateFeatureFlagDto
  ) {
    return this.featureFlagsService.updateFlag(id, dto);
  }

  @Post('admin/feature-flags/override')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_OWNER)
  @ApiOperation({ summary: '[Admin] Set tenant-specific feature override' })
  @ApiResponse({ status: 200, description: 'Tenant override saved' })
  setTenantOverride(@Body() dto: SetTenantFeatureOverrideDto) {
    return this.featureFlagsService.setTenantOverride(dto);
  }

  @Delete('admin/feature-flags/override/:tenantId/:key')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_OWNER)
  @ApiOperation({ summary: '[Admin] Remove tenant feature override' })
  @ApiParam({ name: 'tenantId', description: 'Tenant UUID' })
  @ApiParam({ name: 'key', description: 'Feature key' })
  @ApiResponse({ status: 200, description: 'Override removed' })
  removeTenantOverride(
    @Param('tenantId') tenantId: string,
    @Param('key') key: string
  ) {
    return this.featureFlagsService.removeTenantOverride(tenantId, key);
  }
}
