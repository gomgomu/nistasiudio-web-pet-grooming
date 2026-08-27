import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PetSpecies } from '@prisma/client';

export class CalculatePriceDto {
  @ApiProperty({ example: 's1111111-1111-4111-a111-111111111111', description: 'Service ID' })
  @IsUUID()
  @IsNotEmpty()
  serviceId!: string;

  @ApiPropertyOptional({ example: 'p1111111-1111-4111-a111-111111111111', description: 'Optional Pet ID to automatically load species and current weight' })
  @IsUUID()
  @IsOptional()
  petId?: string;

  @ApiPropertyOptional({ enum: PetSpecies, default: PetSpecies.DOG, description: 'Pet species (if petId not provided)' })
  @IsEnum(PetSpecies)
  @IsOptional()
  species?: PetSpecies;

  @ApiPropertyOptional({ example: 4.5, description: 'Pet weight in kg (if petId not provided or overridden)', minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  weightKg?: number;
}
