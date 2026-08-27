import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateQueueItemDto {
  @ApiPropertyOptional({
    example: 's1111111-1111-4111-a111-111111111111',
    description: 'Service ID to be performed',
  })
  @IsUUID()
  @IsOptional()
  serviceId?: string;

  @ApiPropertyOptional({
    example: 'u1111111-1111-4111-a111-111111111111',
    description: 'Assigned Groomer (Staff ID)',
  })
  @IsUUID()
  @IsOptional()
  groomerId?: string;

  @ApiPropertyOptional({
    example: 'น้องกลัวเสียงไดร์เป่าขน ระวังติ่งเนื้อที่ใบหูด้านซ้าย',
    description: 'Special care notes for this grooming session',
  })
  @IsString()
  @IsOptional()
  specialCareNotes?: string;

  @ApiPropertyOptional({
    example: 4.8,
    description: 'Measured weight in kg',
  })
  @IsNumber()
  @Min(0.1)
  @Type(() => Number)
  @IsOptional()
  weightKg?: number;

  @ApiPropertyOptional({
    example: 90,
    description: 'Estimated duration in minutes',
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  estimatedDurationMinutes?: number;

  @ApiPropertyOptional({
    example: 65000,
    description: 'Price in satang minor units',
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  priceMinor?: number;
}
