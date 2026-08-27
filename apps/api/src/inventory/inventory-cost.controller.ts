import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InventoryCostService } from './inventory-cost.service';
import {
  QueryInventoryValuationDto,
  QueryProfitabilityDto,
} from './dto/cost-calculation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.interface';

@ApiTags('Inventory Costing & Asset Valuation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryCostController {
  constructor(private readonly costService: InventoryCostService) {}

  private getAllowedBranchIds(user: AuthenticatedUser): string[] {
    if (['SUPER_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN'].includes(user.role)) {
      return [];
    }
    return (user.allowedBranches || []).map((b) => b.id);
  }

  @Get('valuation')
  @ApiOperation({
    summary: 'Generate total inventory asset valuation report using Moving Average Cost or Latest Cost',
  })
  @ApiResponse({ status: 200, description: 'Inventory asset valuation report' })
  getInventoryValuationReport(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryInventoryValuationDto
  ) {
    const allowedBranches = this.getAllowedBranchIds(user);
    return this.costService.getInventoryValuationReport(
      tenantId,
      allowedBranches,
      query
    );
  }

  @Get('products/:productId/cost')
  @ApiOperation({
    summary: 'Get detailed unit cost, Moving Average Cost, gross profit margin, and total valuation for a product',
  })
  @ApiResponse({ status: 200, description: 'Product cost summary' })
  getProductCostSummary(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('productId') productId: string
  ) {
    const allowedBranches = this.getAllowedBranchIds(user);
    return this.costService.getProductCostSummary(
      tenantId,
      allowedBranches,
      productId
    );
  }

  @Get('profitability')
  @ApiOperation({
    summary: 'Analyze product sales revenue vs Cost of Goods Sold (COGS) and gross margin percentages',
  })
  @ApiResponse({ status: 200, description: 'Product profitability report' })
  getProductProfitabilityReport(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryProfitabilityDto
  ) {
    const allowedBranches = this.getAllowedBranchIds(user);
    return this.costService.getProductProfitabilityReport(
      tenantId,
      allowedBranches,
      query
    );
  }
}
