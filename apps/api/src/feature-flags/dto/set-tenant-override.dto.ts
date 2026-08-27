import { IsUUID, IsString, IsBoolean, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SetTenantFeatureOverrideDto {
  @ApiProperty({ description: 'Tenant UUID' })
  @IsUUID()
  tenantId: string;

  @ApiProperty({ example: 'LINE_MESSAGING', description: 'Feature Flag Key' })
  @IsString()
  featureKey: string;

  @ApiProperty({ example: true, description: 'Override status (enabled or disabled)' })
  @IsBoolean()
  isEnabled: boolean;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59Z', description: 'Optional expiration datetime' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ example: 'Free 30-day VIP beta testing promo' })
  @IsOptional()
  @IsString()
  reason?: string;
}
