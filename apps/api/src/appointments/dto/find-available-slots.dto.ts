import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FindAvailableSlotsDto {
  @ApiProperty({ example: 'b1111111-1111-4111-a111-111111111111', description: 'Branch ID' })
  @IsUUID()
  @IsNotEmpty()
  branchId!: string;

  @ApiProperty({ example: '2026-09-01', description: 'Date in YYYY-MM-DD format' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be in YYYY-MM-DD format' })
  @IsNotEmpty()
  date!: string;

  @ApiPropertyOptional({ example: 60, default: 60, description: 'Required service duration in minutes', minimum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @IsOptional()
  durationMinutes?: number = 60;

  @ApiPropertyOptional({ example: 'u1111111-1111-4111-a111-111111111111', description: 'Specific Staff ID (optional)' })
  @IsUUID()
  @IsOptional()
  staffId?: string;

  @ApiPropertyOptional({ example: 's1111111-1111-4111-a111-111111111111', description: 'Service ID (optional)' })
  @IsUUID()
  @IsOptional()
  serviceId?: string;

  @ApiPropertyOptional({ example: 10, default: 0, description: 'Buffer interval in minutes between appointments', minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  bufferMinutes?: number = 0;
}
