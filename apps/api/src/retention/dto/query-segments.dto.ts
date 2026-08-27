import { IsOptional, IsEnum, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerSegment } from '@petflow/types';

export enum SegmentSortField {
  RECENCY = 'recency',
  FREQUENCY = 'frequency',
  MONETARY = 'monetary',
  NAME = 'name',
  REGISTERED_AT = 'registeredAt',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class QuerySegmentsDto {
  @ApiPropertyOptional({
    description: 'Filter customers by segment',
    enum: ['NEW', 'ACTIVE', 'AT_RISK', 'LOST', 'VIP'],
  })
  @IsOptional()
  @IsEnum(['NEW', 'ACTIVE', 'AT_RISK', 'LOST', 'VIP'])
  segment?: CustomerSegment;

  @ApiPropertyOptional({ description: 'Filter by branch UUID' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Search keyword (name, phone, email, pet name)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number (default 1)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Limit per page (default 20, max 100)', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: SegmentSortField,
    default: SegmentSortField.RECENCY,
  })
  @IsOptional()
  @IsEnum(SegmentSortField)
  sortBy?: SegmentSortField = SegmentSortField.RECENCY;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({ description: 'Days threshold for NEW segment (default 30)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  newDaysThreshold?: number;

  @ApiPropertyOptional({ description: 'Days threshold for ACTIVE segment (default 60)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  activeDaysThreshold?: number;

  @ApiPropertyOptional({ description: 'Days threshold for AT_RISK segment (default 120)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  atRiskDaysThreshold?: number;

  @ApiPropertyOptional({ description: 'Minimum spend in Satang for VIP (default 1000000 = 10,000 THB)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  vipMinSpendMinor?: number;

  @ApiPropertyOptional({ description: 'Minimum visits for VIP (default 5)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  vipMinVisits?: number;
}
