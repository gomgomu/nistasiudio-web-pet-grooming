import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, Matches } from 'class-validator';

export class CreateBranchDto {
  @ApiProperty({ description: 'Tenant UUID that owns this branch' })
  @IsUUID()
  @IsNotEmpty()
  tenantId!: string;

  @ApiProperty({ example: 'สาขาทองหล่อ (Thonglor Branch)', description: 'Branch name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: 'TL-01', description: 'Unique branch code within tenant' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^[A-Z0-9_-]+$/, {
    message: 'Branch code must contain only uppercase alphanumeric characters, hyphens, and underscores',
  })
  code!: string;

  @ApiPropertyOptional({ example: '888 Sukhumvit 55, Bangkok' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: '02-712-3456' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;
}
