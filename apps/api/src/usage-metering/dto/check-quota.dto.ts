import { IsEnum, IsInt, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UsageMetricType } from '@prisma/client';

export class CheckQuotaQueryDto {
  @ApiProperty({ enum: UsageMetricType, example: UsageMetricType.LINE_MESSAGES })
  @IsEnum(UsageMetricType)
  metricType: UsageMetricType;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;
}
