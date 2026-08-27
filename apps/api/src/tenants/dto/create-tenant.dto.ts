import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, Matches } from 'class-validator';
import { BusinessType } from '@prisma/client';

export class CreateTenantDto {
  @ApiProperty({ example: 'Happy Paws Clinic & Grooming', description: 'Business name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: 'happy-paws', description: 'Unique tenant URL slug' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug!: string;

  @ApiPropertyOptional({ enum: BusinessType, default: BusinessType.HYBRID_CLINIC_GROOMING })
  @IsEnum(BusinessType)
  @IsOptional()
  businessType?: BusinessType;

  @ApiPropertyOptional({ example: '02-123-4567', description: 'Contact phone number' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ example: 'contact@happypaws.com', description: 'Contact email' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ example: 'Asia/Bangkok', default: 'Asia/Bangkok' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  timezone?: string;
}
