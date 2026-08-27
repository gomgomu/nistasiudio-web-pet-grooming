import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubscriptionPlanDto {
  @ApiProperty({ example: 'PROFESSIONAL', description: 'Unique uppercase plan code' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Professional Plan' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'เหมาะสำหรับคลินิกและโรงพยาบาลสัตว์ขนาดกลาง รองรับ 3 สาขา และระบบ LINE OA' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 299000, description: 'Price in Satang (e.g. 2,990 THB = 299000)' })
  @IsNumber()
  @Min(0)
  priceMonthlyMinor: number;

  @ApiProperty({ example: 2990000, description: 'Yearly price in Satang (e.g. 29,900 THB = 2990000)' })
  @IsNumber()
  @Min(0)
  priceYearlyMinor: number;

  @ApiPropertyOptional({ default: 'THB' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxBranches?: number;

  @ApiPropertyOptional({ default: 3 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxStaffUsers?: number;

  @ApiPropertyOptional({ default: 300 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxMonthlyAppointments?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  hasLineIntegration?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  hasAdvancedInventory?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  hasClinicalSoap?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  hasVaccinationRegistry?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  hasCommissionEngine?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  hasMultiBranchCentral?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  hasApiAccess?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
