import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AppointmentSource, AppointmentStatus } from '@prisma/client';

export class QueryAppointmentDto {
  @ApiPropertyOptional({ example: 'b1111111-1111-4111-a111-111111111111', description: 'Filter by Branch ID' })
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ example: 'u1111111-1111-4111-a111-111111111111', description: 'Filter by Staff (User ID)' })
  @IsUUID()
  @IsOptional()
  staffId?: string;

  @ApiPropertyOptional({ example: 'c1111111-1111-4111-a111-111111111111', description: 'Filter by Customer ID' })
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ example: 'p1111111-1111-4111-a111-111111111111', description: 'Filter by Pet ID' })
  @IsUUID()
  @IsOptional()
  petId?: string;

  @ApiPropertyOptional({ enum: AppointmentStatus, description: 'Filter by Appointment Status' })
  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;

  @ApiPropertyOptional({ enum: AppointmentSource, description: 'Filter by Booking Source' })
  @IsEnum(AppointmentSource)
  @IsOptional()
  source?: AppointmentSource;

  @ApiPropertyOptional({ example: '2026-09-01T00:00:00.000Z', description: 'Filter start date range (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-09-30T23:59:59.999Z', description: 'Filter end date range (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ example: 'สมชาย', description: 'Search term for customer name, phone, or pet name' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: 1, default: 1, description: 'Page number' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20, description: 'Page size' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;
}
