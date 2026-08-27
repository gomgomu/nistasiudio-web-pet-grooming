import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateTenantDto } from './create-tenant.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateTenantDto extends PartialType(CreateTenantDto) {
  @ApiPropertyOptional({ example: true, description: 'Active status' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
