import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTenantStatusDto {
  @ApiProperty({ description: 'Active status (true = active, false = suspended)' })
  @IsBoolean()
  isActive: boolean;

  @ApiPropertyOptional({ example: 'Non-payment of subscription after 3 notices' })
  @IsOptional()
  @IsString()
  reason?: string;
}
