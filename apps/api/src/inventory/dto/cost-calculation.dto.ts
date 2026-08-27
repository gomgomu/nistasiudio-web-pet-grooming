import {
  IsEnum,
  IsOptional,
  IsUUID,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryInventoryValuationDto {
  @ApiPropertyOptional({ description: 'Filter valuation by Branch ID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Filter valuation by Product Category ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    enum: ['MOVING_AVERAGE', 'LATEST_COST', 'MASTER_COST'],
    description: 'Inventory costing method to apply for asset valuation (default MOVING_AVERAGE)',
    example: 'MOVING_AVERAGE',
  })
  @IsOptional()
  @IsEnum(['MOVING_AVERAGE', 'LATEST_COST', 'MASTER_COST'])
  costingMethod?: 'MOVING_AVERAGE' | 'LATEST_COST' | 'MASTER_COST' = 'MOVING_AVERAGE';
}

export class QueryProfitabilityDto {
  @ApiPropertyOptional({ description: 'Filter sales profitability by Branch ID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

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

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 200 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  @Type(() => Number)
  limit?: number = 50;
}
