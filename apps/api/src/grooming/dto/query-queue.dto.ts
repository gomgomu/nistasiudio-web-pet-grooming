import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { GroomingQueueStatus } from '@prisma/client';

export class QueryQueueDto {
  @ApiPropertyOptional({
    example: 'b1111111-1111-4111-a111-111111111111',
    description: 'Filter by Branch ID',
  })
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({
    example: 'u1111111-1111-4111-a111-111111111111',
    description: 'Filter by Groomer ID',
  })
  @IsUUID()
  @IsOptional()
  groomerId?: string;

  @ApiPropertyOptional({
    enum: GroomingQueueStatus,
    description: 'Filter by queue status',
  })
  @IsEnum(GroomingQueueStatus)
  @IsOptional()
  status?: GroomingQueueStatus;

  @ApiPropertyOptional({
    example: '2026-08-25',
    description: 'Filter by queue creation date (YYYY-MM-DD)',
  })
  @IsString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Page number',
    default: 1,
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    example: 50,
    description: 'Limit items per page',
    default: 50,
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 50;
}
