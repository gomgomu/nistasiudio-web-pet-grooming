import { IsOptional, IsEnum, IsString, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { VaccineDueStatus, PetSpecies } from '@petflow/types';

export enum VaccineDueSortField {
  DAYS_DIFFERENCE = 'daysDifference',
  NEXT_DUE_AT = 'nextDueAt',
  LAST_ADMINISTERED_AT = 'lastAdministeredAt',
  PET_NAME = 'petName',
  CUSTOMER_NAME = 'customerName',
}

export class QueryVaccineDueDto {
  @ApiPropertyOptional({
    description: 'Filter by vaccine due status',
    enum: ['UPCOMING', 'DUE_NOW', 'OVERDUE', 'CRITICAL_OVERDUE', 'UP_TO_DATE'],
  })
  @IsOptional()
  @IsEnum(['UPCOMING', 'DUE_NOW', 'OVERDUE', 'CRITICAL_OVERDUE', 'UP_TO_DATE'])
  status?: VaccineDueStatus;

  @ApiPropertyOptional({
    description: 'Filter by pet species',
    enum: ['DOG', 'CAT', 'BIRD', 'RABBIT', 'OTHER'],
  })
  @IsOptional()
  @IsEnum(['DOG', 'CAT', 'BIRD', 'RABBIT', 'OTHER'])
  species?: PetSpecies;

  @ApiPropertyOptional({ description: 'Filter by vaccine name keyword (e.g. Rabies, DHPP, FVRCP)' })
  @IsOptional()
  @IsString()
  vaccineType?: string;

  @ApiPropertyOptional({ description: 'Filter by future appointment booking status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  hasFutureBooking?: boolean;

  @ApiPropertyOptional({ description: 'Search keyword (pet name, breed, owner name, phone, vaccine name)' })
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
    enum: VaccineDueSortField,
    default: VaccineDueSortField.DAYS_DIFFERENCE,
  })
  @IsOptional()
  @IsEnum(VaccineDueSortField)
  sortBy?: VaccineDueSortField = VaccineDueSortField.DAYS_DIFFERENCE;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ description: 'Annual booster interval in days (default 365)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  annualIntervalDays?: number;

  @ApiPropertyOptional({ description: 'Upcoming threshold in days before due (default 30)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  upcomingDaysThreshold?: number;

  @ApiPropertyOptional({ description: 'Due now threshold in days (default 14)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  dueNowDaysThreshold?: number;

  @ApiPropertyOptional({ description: 'Critical overdue threshold in days past due (default 60)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  criticalOverdueDaysThreshold?: number;
}
