import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ValidateBookingDto {
  @ApiProperty({ example: 'b1111111-1111-4111-a111-111111111111', description: 'Branch ID' })
  @IsUUID()
  @IsNotEmpty()
  branchId!: string;

  @ApiProperty({ example: '2026-09-01T09:00:00.000Z', description: 'Appointment start time (ISO 8601 UTC)' })
  @IsDateString()
  @IsNotEmpty()
  startAt!: string;

  @ApiProperty({ example: '2026-09-01T10:30:00.000Z', description: 'Appointment end time (ISO 8601 UTC)' })
  @IsDateString()
  @IsNotEmpty()
  endAt!: string;

  @ApiPropertyOptional({ example: 'p1111111-1111-4111-a111-111111111111', description: 'Pet ID to check for overlapping appointments' })
  @IsUUID()
  @IsOptional()
  petId?: string;

  @ApiPropertyOptional({ example: 's1111111-1111-4111-a111-111111111111', description: 'Service ID to verify active status' })
  @IsUUID()
  @IsOptional()
  serviceId?: string;

  @ApiPropertyOptional({ example: 'u1111111-1111-4111-a111-111111111111', description: 'Assigned Staff (User ID) to check schedule and collisions' })
  @IsUUID()
  @IsOptional()
  staffId?: string;

  @ApiPropertyOptional({ example: 'a1111111-1111-4111-a111-111111111111', description: 'Appointment ID to exclude (when updating existing appointment)' })
  @IsUUID()
  @IsOptional()
  excludeAppointmentId?: string;

  @ApiPropertyOptional({ example: 10, default: 0, description: 'Buffer interval in minutes between consecutive appointments', minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  bufferMinutes?: number = 0;
}
