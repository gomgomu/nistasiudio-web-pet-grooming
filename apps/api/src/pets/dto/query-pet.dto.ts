import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { PetSpecies } from '@prisma/client';

export class QueryPetDto {
  @ApiPropertyOptional({ description: 'Filter by specific Customer UUID' })
  @IsUUID('4')
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ enum: PetSpecies, description: 'Filter by species (DOG, CAT, etc.)' })
  @IsEnum(PetSpecies)
  @IsOptional()
  species?: PetSpecies;

  @ApiPropertyOptional({ description: 'Search term for pet name, breed, or microchip' })
  @IsString()
  @IsOptional()
  q?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;
}
