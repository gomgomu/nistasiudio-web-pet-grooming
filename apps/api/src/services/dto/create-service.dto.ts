import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateServiceDto {
  @ApiProperty({ example: 'อาบน้ำ + ตัดขนสุนัขพันธุ์เล็ก (Full Grooming S)', description: 'Service name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ example: 'GROOMING', description: 'Category identifier string or group' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  category?: string = 'GROOMING';

  @ApiPropertyOptional({ example: 'b1e1b1e1-b1e1-b1e1-b1e1-b1e1b1e1b1e1', description: 'Optional ServiceCategory ID' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'c2e2c2e2-c2e2-c2e2-c2e2-c2e2c2e2c2e2', description: 'Branch ID (if branch-specific, otherwise null for all branches)' })
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ example: 60, description: 'Duration in minutes', default: 60, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  durationMinutes?: number = 60;

  @ApiPropertyOptional({
    example: 45000,
    description: 'Base price in minor units (e.g. satang: 45000 = 450.00 THB)',
    default: 0,
    minimum: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  basePriceMinor?: number = 0;

  @ApiPropertyOptional({ example: true, description: 'Active state of service', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
