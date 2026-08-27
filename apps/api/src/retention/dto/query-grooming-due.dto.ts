import { IsOptional, IsEnum, IsString, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { GroomingDueStatus, PetSpecies } from '@petflow/types';

export enum GroomingDueSortField {
  DAYS_DIFFERENCE = 'daysDifference',
  LAST_GROOMED_AT = 'lastGroomedAt',
  NEXT_DUE_AT = 'nextDueAt',
  PET_NAME = 'petName',
  CUSTOMER_NAME = 'customerName',
}

export class QueryGroomingDueDto {
  @ApiPropertyOptional({
    description: 'Filter by grooming due status',
    enum: ['UPCOMING', 'DUE_NOW', 'OVERDUE', 'CRITICAL_OVERDUE', 'ON_TRACK'],
  })
  @IsOptional()
  @IsEnum(['UPCOMING', 'DUE_NOW', 'OVERDUE', 'CRITICAL_OVERDUE', 'ON_TRACK'])
  status?: GroomingDueStatus;

  @ApiPropertyOptional({
    description: 'Filter by pet species',
    enum: ['DOG', 'CAT', 'BIRD', 'RABBIT', 'OTHER'],
  })
  @IsOptional()
  @IsEnum(['DOG', 'CAT', 'BIRD', 'RABBIT', 'OTHER'])
  species?: PetSpecies;

  @ApiPropertyOptional({ description: 'Filter by whether pet already has a future booking' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  hasFutureBooking?: boolean;

  @ApiPropertyOptional({ description: 'Search keyword (pet name, breed, owner name, phone)' })
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
    description: 'Sort field',
    enum: GroomingDueSortField,
    default: GroomingDueSortField.DAYS_DIFFERENCE,
  })
  @IsOptional()
  @IsEnum(GroomingDueSortField)
  sortBy?: GroomingDueSortField = GroomingDueSortField.DAYS_DIFFERENCE;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ description: 'Default grooming cycle interval in days (default 30)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  defaultIntervalDays?: number;

  @ApiPropertyOptional({ description: 'Dog grooming cycle interval in days (default 28)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  dogIntervalDays?: number;

  @ApiPropertyOptional({ description: 'Cat grooming cycle interval in days (default 45)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  catIntervalDays?: number;

  @ApiPropertyOptional({ description: 'Threshold days for UPCOMING status (default 7)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  upcomingDaysThreshold?: number;

  @ApiPropertyOptional({ description: 'Threshold days for OVERDUE status (default 7)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  overdueDaysThreshold?: number;

  @ApiPropertyOptional({ description: 'Threshold days for CRITICAL_OVERDUE status (default 30)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  criticalOverdueDaysThreshold?: number;

  @ApiPropertyOptional({ description: 'Whether to calculate personalized cycle if visits >= 2' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  usePersonalizedInterval?: boolean;
}
