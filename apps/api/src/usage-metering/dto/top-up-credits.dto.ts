import { IsEnum, IsInt, Min, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UsageMetricType } from '@prisma/client';

export class TopUpCreditsDto {
  @ApiProperty({ enum: UsageMetricType, example: UsageMetricType.LINE_MESSAGES })
  @IsEnum(UsageMetricType)
  metricType: UsageMetricType;

  @ApiProperty({ example: 1000, description: 'Number of extra credits to add' })
  @IsInt()
  @Min(1)
  credits: number;

  @ApiProperty({ example: 35000, description: 'Total price in satang (minor units) e.g. 350 THB' })
  @IsInt()
  @Min(0)
  amountMinor: number;

  @ApiProperty({ example: 'PROMPTPAY', default: 'PROMPTPAY' })
  @IsString()
  paymentMethod: string;

  @ApiPropertyOptional({ example: 'LINE OA Notification Addon Pack 1,000 Messages' })
  @IsOptional()
  @IsString()
  description?: string;
}
