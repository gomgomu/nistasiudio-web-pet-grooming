import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class LoginDto {
  @ApiPropertyOptional({ example: 'happy-paws', description: 'Tenant URL Slug' })
  @IsString()
  @IsOptional()
  tenantSlug?: string;

  @ApiPropertyOptional({ description: 'Tenant UUID (if slug not provided)' })
  @IsUUID()
  @IsOptional()
  tenantId?: string;

  @ApiProperty({ example: 'staff@happypaws.com', description: 'User login email' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'SecurePassword123!', description: 'User password' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
