import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InventoryAlertsService } from './inventory-alerts.service';
import {
  CreateProductLotDto,
  QueryProductLotsDto,
  QueryStockAlertsDto,
} from './dto/create-lot.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.interface';

@ApiTags('Inventory Alerts & Drug Expiry')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryAlertsController {
  constructor(private readonly alertsService: InventoryAlertsService) {}

  private getAllowedBranchIds(user: AuthenticatedUser): string[] {
    if (['SUPER_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN'].includes(user.role)) {
      return [];
    }
    return (user.allowedBranches || []).map((b) => b.id);
  }

  @Get('alerts/summary')
  @ApiOperation({ summary: 'Get KPI summary count of low-stock items and expiring/expired drug lots' })
  @ApiResponse({ status: 200, description: 'Alert summary metrics' })
  getDashboardAlertsSummary(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('branchId') branchId?: string
  ) {
    const allowedBranches = this.getAllowedBranchIds(user);
    return this.alertsService.getDashboardAlertsSummary(
      tenantId,
      allowedBranches,
      branchId
    );
  }

  @Get('alerts/low-stock')
  @ApiOperation({ summary: 'Get list of products below reorder point with suggested reorder quantities' })
  @ApiResponse({ status: 200, description: 'Low stock alerts list' })
  getLowStockAlerts(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryStockAlertsDto
  ) {
    const allowedBranches = this.getAllowedBranchIds(user);
    return this.alertsService.getLowStockAlerts(
      tenantId,
      allowedBranches,
      query
    );
  }

  @Get('alerts/expiry')
  @ApiOperation({ summary: 'Get expiring and expired pharmaceutical/vaccine lots' })
  @ApiResponse({ status: 200, description: 'Drug and vaccine expiry alerts' })
  getExpiryAlerts(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryStockAlertsDto
  ) {
    const allowedBranches = this.getAllowedBranchIds(user);
    return this.alertsService.getExpiryAlerts(
      tenantId,
      allowedBranches,
      query
    );
  }

  @Post('lots')
  @ApiOperation({ summary: 'Register a new product lot / batch with expiry date and initial quantity' })
  @ApiResponse({ status: 201, description: 'Lot registered with incoming stock transaction' })
  createLot(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProductLotDto
  ) {
    const allowedBranches = this.getAllowedBranchIds(user);
    return this.alertsService.createLot(
      tenantId,
      allowedBranches,
      dto
    );
  }

  @Get('lots')
  @ApiOperation({ summary: 'Query registered product lots with remaining days to expiry' })
  @ApiResponse({ status: 200, description: 'Paginated product lots' })
  findLots(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryProductLotsDto
  ) {
    const allowedBranches = this.getAllowedBranchIds(user);
    return this.alertsService.findLots(
      tenantId,
      allowedBranches,
      query
    );
  }
}
