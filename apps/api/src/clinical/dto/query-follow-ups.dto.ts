import { IsOptional, IsString, IsUUID, IsNumber, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryFollowUpsDto {
  @ApiPropertyOptional({ default: 14, description: 'Days ahead to query follow-ups' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  daysAhead?: number;

  @ApiPropertyOptional({ enum: ['ALL', 'OVERDUE', 'DUE_TODAY', 'UPCOMING'], default: 'ALL' })
  @IsOptional()
  @IsIn(['ALL', 'OVERDUE', 'DUE_TODAY', 'UPCOMING'])
  urgency?: 'ALL' | 'OVERDUE' | 'DUE_TODAY' | 'UPCOMING';

  @ApiPropertyOptional({ description: 'Filter by veterinarian UUID' })
  @IsOptional()
  @IsUUID()
  veterinarianId?: string;

  @ApiPropertyOptional({ description: 'Filter by branch UUID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Search by pet name, customer name, phone, or reason' })
  @IsOptional()
  @IsString()
  search?: string;
}
