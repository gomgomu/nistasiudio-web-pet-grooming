import {
  Controller,
  Get,
  Post,
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
import { PaymentsService } from './payments.service';
import { RecordPaymentDto, QueryPaymentsDto } from './dto/record-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.interface';

@ApiTags('Invoices & POS')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  private getAllowedBranchIds(user: AuthenticatedUser): string[] {
    if (['SUPER_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN'].includes(user.role)) {
      return [];
    }
    return (user.allowedBranches || []).map((b) => b.id);
  }

  @Post('invoices/:invoiceId/payments')
  @ApiOperation({
    summary: 'Record a payment for an invoice (Cash, PromptPay, Transfer, Card) and update status',
  })
  @ApiResponse({ status: 201, description: 'Payment recorded successfully' })
  recordPayment(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('invoiceId') invoiceId: string,
    @Body() dto: RecordPaymentDto
  ) {
    const allowedBranches = this.getAllowedBranchIds(user);
    return this.paymentsService.recordPayment(
      tenantId,
      allowedBranches,
      invoiceId,
      user.id,
      dto
    );
  }

  @Get('invoices/:invoiceId/payments')
  @ApiOperation({ summary: 'Get all payment transactions for a specific invoice' })
  @ApiResponse({ status: 200, description: 'List of payments for invoice' })
  findInvoicePayments(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('invoiceId') invoiceId: string
  ) {
    const allowedBranches = this.getAllowedBranchIds(user);
    return this.paymentsService.findInvoicePayments(
      tenantId,
      allowedBranches,
      invoiceId
    );
  }

  @Get('payments')
  @ApiOperation({ summary: 'List all payments with branch, method, and date filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of payments' })
  findAllPayments(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryPaymentsDto
  ) {
    const allowedBranches = this.getAllowedBranchIds(user);
    return this.paymentsService.findAllPayments(
      tenantId,
      allowedBranches,
      query
    );
  }

  @Delete('payments/:id')
  @ApiOperation({ summary: 'Void/reverse a payment transaction' })
  @ApiResponse({ status: 200, description: 'Payment reversed successfully' })
  voidPayment(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string
  ) {
    const allowedBranches = this.getAllowedBranchIds(user);
    return this.paymentsService.voidPayment(tenantId, allowedBranches, id);
  }
}
