import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AppointmentSource } from '@prisma/client';

export class CreateAppointmentDto {
  @ApiProperty({ example: 'b1111111-1111-4111-a111-111111111111', description: 'Branch ID' })
  @IsUUID()
  @IsNotEmpty()
  branchId!: string;

  @ApiProperty({ example: 'c1111111-1111-4111-a111-111111111111', description: 'Customer ID' })
  @IsUUID()
  @IsNotEmpty()
  customerId!: string;

  @ApiProperty({ example: 'p1111111-1111-4111-a111-111111111111', description: 'Pet ID' })
  @IsUUID()
  @IsNotEmpty()
  petId!: string;

  @ApiProperty({ example: 's1111111-1111-4111-a111-111111111111', description: 'Service ID' })
  @IsUUID()
  @IsNotEmpty()
  serviceId!: string;

  @ApiPropertyOptional({ example: 'u1111111-1111-4111-a111-111111111111', description: 'Assigned Staff (User ID)' })
  @IsUUID()
  @IsOptional()
  staffId?: string;

  @ApiProperty({ example: '2026-09-01T09:00:00.000Z', description: 'Appointment start time (ISO 8601 UTC)' })
  @IsDateString()
  @IsNotEmpty()
  startAt!: string;

  @ApiPropertyOptional({ example: '2026-09-01T10:30:00.000Z', description: 'Appointment end time (ISO 8601 UTC). If omitted, computed from service duration.' })
  @IsDateString()
  @IsOptional()
  endAt?: string;

  @ApiPropertyOptional({ enum: AppointmentSource, default: AppointmentSource.PHONE, description: 'Booking channel' })
  @IsEnum(AppointmentSource)
  @IsOptional()
  source?: AppointmentSource = AppointmentSource.PHONE;

  @ApiPropertyOptional({ example: 45000, description: 'Price in satang minor units. If omitted, computed from service price rules.' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  priceMinor?: number;

  @ApiPropertyOptional({ example: 'น้องขี้กลัวนิดหน่อย ระวังช่วงเป่าขน', description: 'Special appointment notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: false, default: false, description: 'Allow manual administrative override of booking conflicts' })
  @IsBoolean()
  @IsOptional()
  allowConflict?: boolean = false;
}
