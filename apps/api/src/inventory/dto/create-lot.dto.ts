import {
  IsString,
  IsUUID,
  IsOptional,
  IsNumber,
  Min,
  IsDateString,
  IsInt,
  Max,
  IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductLotDto {
  @ApiProperty({ description: 'Branch ID', example: 'd3b07384-d113-4674-be46-3475f3a0937a' })
  @IsUUID()
  branchId!: string;

  @ApiProperty({ description: 'Product ID', example: 'e2b07384-d113-4674-be46-3475f3a0937b' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ description: 'Batch / Lot number', example: 'LOT-2026-08A' })
  @IsString()
  lotNumber!: string;

  @ApiPropertyOptional({ description: 'Manufacturing Date (YYYY-MM-DD)', example: '2026-01-15' })
  @IsOptional()
  @IsDateString()
  mfgDate?: string;

  @ApiProperty({ description: 'Expiry Date (YYYY-MM-DD)', example: '2027-08-31' })
  @IsDateString()
  expDate!: string;

  @ApiProperty({ description: 'Initial batch quantity received', example: 50 })
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  quantity!: number;

  @ApiPropertyOptional({ description: 'Storage conditions or supplier lot notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class QueryProductLotsDto {
  @ApiPropertyOptional({ description: 'Filter by Branch ID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Filter by Product ID' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ description: 'Filter lots expiring within N days (e.g. 30, 60, 90)', example: 60 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  expiringWithinDays?: number;

  @ApiPropertyOptional({ description: 'Filter only already expired lots' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isExpired?: boolean;

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

export class QueryStockAlertsDto {
  @ApiPropertyOptional({ description: 'Filter alerts by Branch ID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Filter only critical urgency items (OUT_OF_STOCK and CRITICAL_LOW)' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  criticalOnly?: boolean;

  @ApiPropertyOptional({ description: 'Threshold days ahead for expiry alerts (default 60 days)', example: 60 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  daysAhead?: number = 60;
}
