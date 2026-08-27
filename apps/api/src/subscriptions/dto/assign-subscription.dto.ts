import {
  IsUUID,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionStatus, BillingCycle } from '@prisma/client';

export class AssignSubscriptionDto {
  @ApiProperty({ description: 'Tenant UUID' })
  @IsUUID()
  tenantId: string;

  @ApiProperty({ example: 'PROFESSIONAL', description: 'Plan Code' })
  @IsString()
  planCode: string;

  @ApiPropertyOptional({ enum: BillingCycle, default: BillingCycle.MONTHLY })
  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;

  @ApiPropertyOptional({ enum: SubscriptionStatus, default: SubscriptionStatus.ACTIVE })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @ApiPropertyOptional({ example: 5, description: 'Override max branches limit' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  customMaxBranches?: number;

  @ApiPropertyOptional({ example: 15, description: 'Override max staff users limit' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  customMaxStaffUsers?: number;

  @ApiPropertyOptional({ example: 'PROMPTPAY' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;
}
