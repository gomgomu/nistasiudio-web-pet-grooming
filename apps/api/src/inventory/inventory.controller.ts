import {
  Controller,
  Get,
  Post,
  Param,
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
import { InventoryService } from './inventory.service';
import {
  CreateInventoryTransactionDto,
  StockTakeAdjustmentDto,
  QueryInventoryTransactionsDto,
} from './dto/create-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.interface';

@ApiTags('Inventory & Stock Ledger')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  private getAllowedBranchIds(user: AuthenticatedUser): string[] {
    if (['SUPER_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN'].includes(user.role)) {
      return [];
    }
    return (user.allowedBranches || []).map((b) => b.id);
  }

  @Post('transactions')
  @ApiOperation({
    summary: 'Record an immutable stock movement (Stock-In, Sales Out, Consumption, Waste, Transfer)',
  })
  @ApiResponse({ status: 201, description: 'Transaction recorded' })
  recordTransaction(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInventoryTransactionDto
  ) {
    const allowedBranches = this.getAllowedBranchIds(user);
    return this.inventoryService.recordTransaction(
      tenantId,
      allowedBranches,
      dto
    );
  }

  @Post('adjust')
  @ApiOperation({
    summary: 'Reconcile physical stock count against ledger (Stock-Take Adjustment)',
  })
  @ApiResponse({ status: 201, description: 'Stock adjusted' })
  adjustStock(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: StockTakeAdjustmentDto
  ) {
    const allowedBranches = this.getAllowedBranchIds(user);
    return this.inventoryService.adjustStock(
      tenantId,
      allowedBranches,
      dto
    );
  }

  @Get('branches/:branchId/stock')
  @ApiOperation({ summary: 'Get stock balances and low-stock indicators for all products in a branch' })
  @ApiResponse({ status: 200, description: 'Branch stock balance list' })
  getBranchStockList(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('branchId') branchId: string,
    @Query('search') search?: string
  ) {
    const allowedBranches = this.getAllowedBranchIds(user);
    return this.inventoryService.getBranchStockList(
      tenantId,
      allowedBranches,
      branchId,
      search
    );
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Query inventory transaction history log' })
  @ApiResponse({ status: 200, description: 'Paginated transaction history' })
  findTransactions(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryInventoryTransactionsDto
  ) {
    const allowedBranches = this.getAllowedBranchIds(user);
    return this.inventoryService.findTransactions(
      tenantId,
      allowedBranches,
      query
    );
  }
}
