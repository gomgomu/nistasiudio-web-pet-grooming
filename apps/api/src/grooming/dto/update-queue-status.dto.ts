import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { GroomingQueueStatus } from '@prisma/client';

export class UpdateQueueStatusDto {
  @ApiProperty({
    enum: GroomingQueueStatus,
    example: GroomingQueueStatus.GROOMING,
    description: 'Next grooming stage status',
  })
  @IsEnum(GroomingQueueStatus)
  status: GroomingQueueStatus;

  @ApiPropertyOptional({
    example: 'เจ้าของเปลี่ยนใจขอยกเลิกนัดหมาย',
    description: 'Reason for cancellation if status is CANCELLED',
  })
  @IsString()
  @IsOptional()
  cancellationReason?: string;

  @ApiPropertyOptional({
    example: 75,
    description: 'Actual elapsed grooming duration in minutes',
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  actualDurationMinutes?: number;
}
