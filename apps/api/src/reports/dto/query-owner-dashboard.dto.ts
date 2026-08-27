import { IsOptional, IsUUID, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DashboardPeriod } from '@petflow/types';

export class QueryOwnerDashboardDto {
  @ApiPropertyOptional({ description: 'Filter by specific branch UUID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({
    description: 'Time period preset',
    enum: ['TODAY', 'THIS_WEEK', 'THIS_MONTH', 'LAST_30_DAYS', 'THIS_YEAR', 'CUSTOM'],
    default: 'THIS_MONTH',
  })
  @IsOptional()
  @IsEnum(['TODAY', 'THIS_WEEK', 'THIS_MONTH', 'LAST_30_DAYS', 'THIS_YEAR', 'CUSTOM'])
  period?: DashboardPeriod = 'THIS_MONTH';

  @ApiPropertyOptional({ description: 'Custom start date (ISO string or YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Custom end date (ISO string or YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
