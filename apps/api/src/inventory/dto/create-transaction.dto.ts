import {
  IsEnum,
  IsNumber,
  Min,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsInt,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryTransactionType } from '@petflow/types';

export class CreateInventoryTransactionDto {
  @ApiProperty({ description: 'Branch ID where stock is moving', example: 'd3b07384-d113-4674-be46-3475f3a0937a' })
  @IsUUID()
  branchId!: string;

  @ApiProperty({ description: 'Product ID', example: 'e2b07384-d113-4674-be46-3475f3a0937b' })
  @IsUUID()
  productId!: string;

  @ApiProperty({
    enum: ['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER', 'CONSUMPTION', 'WASTE'],
    description: 'Transaction movement type',
    example: 'IN',
  })
  @IsEnum(['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER', 'CONSUMPTION', 'WASTE'])
  type!: InventoryTransactionType;

  @ApiProperty({ description: 'Movement quantity (e.g. 10.00)', example: 10 })
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  quantity!: number;

  @ApiPropertyOptional({
    description: 'Destination Branch ID (Required when type is TRANSFER)',
    example: 'f4b07384-d113-4674-be46-3475f3a0937c',
  })
  @IsOptional()
  @IsUUID()
  targetBranchId?: string;

  @ApiPropertyOptional({
    description: 'Reference source (e.g. INVOICE, PURCHASE, INITIAL_STOCK, GROOMING_USE, CLINIC_TREATMENT, DAMAGE, MANUAL)',
    example: 'PURCHASE',
  })
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiPropertyOptional({ description: 'Reference ID (e.g. invoiceId, purchaseId, queueItemId)' })
  @IsOptional()
  @IsUUID()
  referenceId?: string;
}

export class StockTakeAdjustmentDto {
  @ApiProperty({ description: 'Branch ID' })
  @IsUUID()
  branchId!: string;

  @ApiProperty({ description: 'Product ID' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ description: 'Actual physical count counted during stock-take', example: 12 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  actualCount!: number;

  @ApiPropertyOptional({ description: 'Reason for stock adjustment' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class QueryInventoryTransactionsDto {
  @ApiPropertyOptional({ description: 'Filter by Branch ID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Filter by Product ID' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({
    enum: ['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER', 'CONSUMPTION', 'WASTE'],
    description: 'Filter by transaction type',
  })
  @IsOptional()
  @IsEnum(['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER', 'CONSUMPTION', 'WASTE'])
  type?: InventoryTransactionType;

  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}
