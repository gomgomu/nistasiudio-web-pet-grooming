import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class TriggerBackupDto {
  @ApiPropertyOptional({ description: 'Custom prefix for backup file', example: 'manual_maintenance' })
  @IsOptional()
  @IsString()
  customPrefix?: string;

  @ApiPropertyOptional({ description: 'Retention period in days before pruning', example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  retentionDays?: number;
}
