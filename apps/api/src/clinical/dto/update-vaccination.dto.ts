import {
  IsUUID,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { VaccineType } from '@prisma/client';

export class UpdateVaccinationDto {
  @ApiPropertyOptional({ description: 'Veterinarian UUID who administered the vaccine' })
  @IsOptional()
  @IsUUID()
  administeredById?: string;

  @ApiPropertyOptional({ enum: VaccineType })
  @IsOptional()
  @IsEnum(VaccineType)
  vaccineType?: VaccineType;

  @ApiPropertyOptional({ example: 'Nobivac DHPPi + L' })
  @IsOptional()
  @IsString()
  vaccineName?: string;

  @ApiPropertyOptional({ example: 'MSD Animal Health' })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional({ example: 'LOT-2026-X99' })
  @IsOptional()
  @IsString()
  lotNumber?: string;

  @ApiPropertyOptional({ example: '2026-08-27T10:30:00.000Z' })
  @IsOptional()
  @IsDateString()
  administeredAt?: string;

  @ApiPropertyOptional({ example: '2027-08-27' })
  @IsOptional()
  @IsDateString()
  nextDueAt?: string;

  @ApiPropertyOptional({ example: 4.5 })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(200)
  weightKg?: number;

  @ApiPropertyOptional({ example: 38.5 })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(45)
  temperatureC?: number;

  @ApiPropertyOptional({ example: 'Right shoulder (SC)' })
  @IsOptional()
  @IsString()
  siteOfInjection?: string;

  @ApiPropertyOptional({ example: 'VAC-2026-00441' })
  @IsOptional()
  @IsString()
  certificateNumber?: string;

  @ApiPropertyOptional({ example: 'สุขภาพแข็งแรง ไม่มีประวัติแพ้วัคซีน' })
  @IsOptional()
  @IsString()
  notes?: string;
}
