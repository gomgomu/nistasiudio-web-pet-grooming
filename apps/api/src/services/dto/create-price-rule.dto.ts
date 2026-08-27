import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PetSpecies } from '@prisma/client';

export class CreatePriceRuleDto {
  @ApiProperty({ example: 's1111111-1111-4111-a111-111111111111', description: 'Service ID' })
  @IsUUID()
  @IsNotEmpty()
  serviceId!: string;

  @ApiPropertyOptional({ enum: PetSpecies, default: PetSpecies.DOG, description: 'Pet species' })
  @IsEnum(PetSpecies)
  @IsOptional()
  species?: PetSpecies = PetSpecies.DOG;

  @ApiPropertyOptional({ example: 'สุนัขพันธุ์เล็ก (0 - 5 kg)', description: 'Rule tier label' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 0, description: 'Minimum pet weight in kg (inclusive)', minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minWeight?: number;

  @ApiPropertyOptional({ example: 5, description: 'Maximum pet weight in kg (inclusive)', minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxWeight?: number;

  @ApiProperty({ example: 45000, description: 'Price in minor units (e.g. satang: 45000 = 450.00 THB)', minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  priceMinor!: number;

  @ApiPropertyOptional({ example: 60, description: 'Service duration in minutes for this bracket', minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  durationMinutes?: number;

  @ApiPropertyOptional({ example: true, default: true, description: 'Active state of this rule' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
