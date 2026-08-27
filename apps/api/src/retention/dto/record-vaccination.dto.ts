import { IsNotEmpty, IsString, IsOptional, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePetVaccinationDto {
  @ApiProperty({ description: 'Pet UUID' })
  @IsNotEmpty()
  @IsUUID()
  petId!: string;

  @ApiProperty({ description: 'Vaccine name (e.g. วัคซีนรวมสุนัข 5 โรค (DHPPi), วัคซีนพิษสุนัขบ้า (Rabies))' })
  @IsNotEmpty()
  @IsString()
  vaccineName!: string;

  @ApiPropertyOptional({ description: 'Vaccine lot/batch number' })
  @IsOptional()
  @IsString()
  lotNumber?: string;

  @ApiPropertyOptional({ description: 'Date vaccine was administered (ISO string or YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  administeredAt?: string;

  @ApiPropertyOptional({ description: 'Next booster due date (ISO string or YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  nextDueAt?: string;

  @ApiPropertyOptional({ description: 'Linked clinic visit UUID if administered during clinic visit' })
  @IsOptional()
  @IsUUID()
  clinicVisitId?: string;
}
