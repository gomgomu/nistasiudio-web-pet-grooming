import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AppointmentStatus } from '@prisma/client';

export class UpdateAppointmentStatusDto {
  @ApiProperty({
    enum: AppointmentStatus,
    example: AppointmentStatus.CHECKED_IN,
    description: 'New appointment status (PENDING, CONFIRMED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW)',
  })
  @IsEnum(AppointmentStatus)
  @IsNotEmpty()
  status!: AppointmentStatus;

  @ApiPropertyOptional({
    example: 'ลูกค้าติดธุระด่วน ขอเลื่อนนัดวันอื่น',
    description: 'Reason for cancellation (required if status is CANCELLED)',
  })
  @IsString()
  @IsOptional()
  cancellationReason?: string;
}
