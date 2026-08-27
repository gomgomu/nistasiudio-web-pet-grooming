import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto, VoidInvoiceDto } from './dto/update-invoice.dto';
import { QueryInvoicesDto } from './dto/query-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.interface';

@ApiTags('Invoices & POS')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  private getAllowedBranchIds(user: AuthenticatedUser): string[] {
    if (['SUPER_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN'].includes(user.role)) {
      return []; // empty indicates all branches allowed
    }
    return (user.allowedBranches || []).map((b) => b.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new invoice with automated calculation & sequential numbering' })
  @ApiResponse({ status: 201, description: 'Invoice created successfully' })
  create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInvoiceDto
  ) {
    return this.invoicesService.create(tenantId, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List invoices with status, branch, customer, date range, and keyword search' })
  @ApiResponse({ status: 200, description: 'Paginated list of invoices' })
  findAll(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryInvoicesDto
  ) {
    const allowedBranches = this.getAllowedBranchIds(user);
    return this.invoicesService.findAll(tenantId, allowedBranches, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice details by ID with items, payments, and relationships' })
  @ApiResponse({ status: 200, description: 'Invoice detailed view' })
  findOne(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string
  ) {
    const allowedBranches = this.getAllowedBranchIds(user);
    return this.invoicesService.findOne(tenantId, allowedBranches, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update invoice items, discounts, or metadata (non-PAID/non-VOID only)' })
  @ApiResponse({ status: 200, description: 'Invoice updated successfully' })
  update(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto
  ) {
    const allowedBranches = this.getAllowedBranchIds(user);
    return this.invoicesService.update(tenantId, allowedBranches, id, dto);
  }

  @Patch(':id/void')
  @ApiOperation({ summary: 'Void an invoice with reason' })
  @ApiResponse({ status: 200, description: 'Invoice voided successfully' })
  void(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: VoidInvoiceDto
  ) {
    const allowedBranches = this.getAllowedBranchIds(user);
    return this.invoicesService.void(tenantId, allowedBranches, id, user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a draft invoice' })
  @ApiResponse({ status: 200, description: 'Invoice deleted successfully' })
  delete(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string
  ) {
    const allowedBranches = this.getAllowedBranchIds(user);
    return this.invoicesService.delete(tenantId, allowedBranches, id);
  }
}
