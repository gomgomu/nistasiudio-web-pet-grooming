import { IsUUID, IsEnum, IsInt, Min, IsOptional, IsString, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UsageMetricType } from '@prisma/client';

export class RecordUsageDto {
  @ApiProperty({ description: 'Tenant UUID' })
  @IsUUID()
  tenantId: string;

  @ApiProperty({ enum: UsageMetricType, example: UsageMetricType.LINE_MESSAGES })
  @IsEnum(UsageMetricType)
  metricType: UsageMetricType;

  @ApiProperty({ example: 1, description: 'Quantity consumed' })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ example: 'notif-12345' })
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiPropertyOptional({ example: { template: 'APPOINTMENT_REMINDER' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
