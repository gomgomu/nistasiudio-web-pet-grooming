import {
  IsUUID,
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ClinicVisitStatus, ClinicVisitType } from '@petflow/types';

export class QueryClinicVisitsDto {
  @ApiPropertyOptional({ description: 'Filter by Branch ID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Filter by Pet ID' })
  @IsOptional()
  @IsUUID()
  petId?: string;

  @ApiPropertyOptional({ description: 'Filter by Customer ID' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Filter by Veterinarian ID' })
  @IsOptional()
  @IsUUID()
  veterinarianId?: string;

  @ApiPropertyOptional({
    enum: [
      'SCHEDULED',
      'WAITING',
      'IN_CONSULTATION',
      'EXAMINATION',
      'TREATMENT',
      'COMPLETED',
      'CANCELLED',
    ],
  })
  @IsOptional()
  @IsEnum([
    'SCHEDULED',
    'WAITING',
    'IN_CONSULTATION',
    'EXAMINATION',
    'TREATMENT',
    'COMPLETED',
    'CANCELLED',
  ])
  status?: ClinicVisitStatus;

  @ApiPropertyOptional({
    enum: [
      'GENERAL_CHECKUP',
      'VACCINATION',
      'SICK_VISIT',
      'FOLLOW_UP',
      'SURGERY',
      'DENTAL',
      'EMERGENCY',
      'GROOMING_HEALTH_CHECK',
    ],
  })
  @IsOptional()
  @IsEnum([
    'GENERAL_CHECKUP',
    'VACCINATION',
    'SICK_VISIT',
    'FOLLOW_UP',
    'SURGERY',
    'DENTAL',
    'EMERGENCY',
    'GROOMING_HEALTH_CHECK',
  ])
  visitType?: ClinicVisitType;

  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-08-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Search customer name, pet name, or chief complaint' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
