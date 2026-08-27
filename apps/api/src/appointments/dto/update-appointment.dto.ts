import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AppointmentSource } from '@prisma/client';

export class UpdateAppointmentDto {
  @ApiPropertyOptional({ example: 'b1111111-1111-4111-a111-111111111111', description: 'Branch ID' })
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ example: 's1111111-1111-4111-a111-111111111111', description: 'Service ID' })
  @IsUUID()
  @IsOptional()
  serviceId?: string;

  @ApiPropertyOptional({ example: 'u1111111-1111-4111-a111-111111111111', description: 'Assigned Staff (User ID)' })
  @IsUUID()
  @IsOptional()
  staffId?: string;

  @ApiPropertyOptional({ example: '2026-09-01T09:00:00.000Z', description: 'Appointment start time (ISO 8601 UTC)' })
  @IsDateString()
  @IsOptional()
  startAt?: string;

  @ApiPropertyOptional({ example: '2026-09-01T10:30:00.000Z', description: 'Appointment end time (ISO 8601 UTC)' })
  @IsDateString()
  @IsOptional()
  endAt?: string;

  @ApiPropertyOptional({ enum: AppointmentSource, description: 'Booking channel' })
  @IsEnum(AppointmentSource)
  @IsOptional()
  source?: AppointmentSource;

  @ApiPropertyOptional({ example: 50000, description: 'Price in satang minor units' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  priceMinor?: number;

  @ApiPropertyOptional({ example: 'เปลี่ยนเป็นช่างหญิงแทน', description: 'Special appointment notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: false, default: false, description: 'Allow manual administrative override of booking conflicts' })
  @IsBoolean()
  @IsOptional()
  allowConflict?: boolean;
}
