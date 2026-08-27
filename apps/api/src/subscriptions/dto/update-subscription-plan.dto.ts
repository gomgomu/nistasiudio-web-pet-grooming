import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSubscriptionPlanDto {
  @ApiPropertyOptional({ example: 'Professional Plan' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'เหมาะสำหรับคลินิกและโรงพยาบาลสัตว์' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 299000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceMonthlyMinor?: number;

  @ApiPropertyOptional({ example: 2990000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceYearlyMinor?: number;

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
