import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQueueItemDto {
  @ApiProperty({
    example: 'b1111111-1111-4111-a111-111111111111',
    description: 'Branch ID where the grooming queue takes place',
  })
  @IsUUID()
  branchId: string;

  @ApiProperty({
    example: 'c1111111-1111-4111-a111-111111111111',
    description: 'Customer ID',
  })
  @IsUUID()
  customerId: string;

  @ApiProperty({
    example: 'p1111111-1111-4111-a111-111111111111',
    description: 'Pet ID',
  })
  @IsUUID()
  petId: string;

  @ApiProperty({
    example: 's1111111-1111-4111-a111-111111111111',
    description: 'Service ID to be performed',
  })
  @IsUUID()
  serviceId: string;

  @ApiPropertyOptional({
    example: 'a1111111-1111-4111-a111-111111111111',
    description: 'Associated Appointment ID (if checking in from appointment)',
  })
  @IsUUID()
  @IsOptional()
  appointmentId?: string;

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
    example: 4.5,
    description: 'Measured weight in kg at check-in',
  })
  @IsNumber()
  @Min(0.1)
  @Type(() => Number)
  @IsOptional()
  weightKg?: number;

  @ApiPropertyOptional({
    example: 60,
    description: 'Estimated duration in minutes',
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  estimatedDurationMinutes?: number;

  @ApiPropertyOptional({
    example: 55000,
    description: 'Price in satang minor units (if overridden)',
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  priceMinor?: number;
}
