import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { AssignSubscriptionDto } from './dto/assign-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { Roles } from '../common/guards/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('SaaS Subscription & Billing')
@Controller()
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // ---------------------------------------------------------------------------
  // Public / Tenant Endpoints
  // ---------------------------------------------------------------------------

  @Get('subscriptions/plans')
  @ApiOperation({ summary: 'Get active public subscription plans & pricing tiers' })
  @ApiResponse({ status: 200, description: 'List of active plans' })
  getPublicPlans() {
    return this.subscriptionsService.getPublicPlans();
  }

  @Get('subscriptions/current')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get current tenant active subscription details & live usage quotas' })
  @ApiResponse({ status: 200, description: 'Current tenant subscription and quotas' })
  getCurrentSubscription(@CurrentTenant() tenantId: string) {
    return this.subscriptionsService.getTenantSubscription(tenantId);
  }

  @Get('subscriptions/quota-check')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Check if tenant has quota to perform an action or access a feature' })
  @ApiQuery({ name: 'resource', enum: ['BRANCH', 'USER', 'APPOINTMENT', 'FEATURE'] })
  @ApiQuery({ name: 'featureName', required: false })
  @ApiResponse({ status: 200, description: 'Quota check result' })
  checkQuota(
    @CurrentTenant() tenantId: string,
    @Query('resource') resource: 'BRANCH' | 'USER' | 'APPOINTMENT' | 'FEATURE',
    @Query('featureName') featureName?: string
  ) {
    return this.subscriptionsService.checkQuota(tenantId, resource, featureName);
  }

  // ---------------------------------------------------------------------------
  // SaaS Admin Endpoints
  // ---------------------------------------------------------------------------

  @Get('admin/subscriptions/plans')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_OWNER, UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: '[Admin] Get all subscription plans including inactive' })
  @ApiResponse({ status: 200, description: 'All plans' })
  getAllPlansAdmin() {
    return this.subscriptionsService.getAllPlans();
  }

  @Post('admin/subscriptions/plans')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_OWNER, UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: '[Admin] Create new subscription plan tier' })
  @ApiResponse({ status: 201, description: 'Plan created' })
  createPlan(@Body() dto: CreateSubscriptionPlanDto) {
    return this.subscriptionsService.createPlan(dto);
  }

  @Patch('admin/subscriptions/plans/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_OWNER, UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: '[Admin] Update subscription plan tier' })
  @ApiParam({ name: 'id', description: 'Plan UUID' })
  @ApiResponse({ status: 200, description: 'Plan updated' })
  updatePlan(
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionPlanDto
  ) {
    return this.subscriptionsService.updatePlan(id, dto);
  }

  @Post('admin/subscriptions/assign')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_OWNER, UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: '[Admin] Assign or upgrade a tenant subscription plan' })
  @ApiResponse({ status: 200, description: 'Subscription assigned' })
  assignSubscription(@Body() dto: AssignSubscriptionDto) {
    return this.subscriptionsService.assignTenantSubscription(dto);
  }
}
