import { IsOptional, IsString, IsUUID, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { VaccineType } from '@prisma/client';

export class QueryVaccinationsDto {
  @ApiPropertyOptional({ description: 'Filter by Pet UUID' })
  @IsOptional()
  @IsUUID()
  petId?: string;

  @ApiPropertyOptional({ description: 'Filter by Customer UUID' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ enum: VaccineType })
  @IsOptional()
  @IsEnum(VaccineType)
  vaccineType?: VaccineType;

  @ApiPropertyOptional({ description: 'Search term for pet name, owner, or vaccine name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by due date start (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dueFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by due date end (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dueTo?: string;
}
