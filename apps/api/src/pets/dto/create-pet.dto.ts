import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PetSpecies, PetSex } from '@prisma/client';

export class CreatePetDto {
  @ApiProperty({ description: 'Customer UUID who owns this pet' })
  @IsUUID('4')
  @IsNotEmpty()
  customerId!: string;

  @ApiProperty({ example: 'โมจิ (Mochi)', description: 'Pet name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ enum: PetSpecies, default: PetSpecies.DOG })
  @IsEnum(PetSpecies)
  @IsOptional()
  species?: PetSpecies = PetSpecies.DOG;

  @ApiPropertyOptional({ example: 'Pomeranian' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  breed?: string;

  @ApiPropertyOptional({ enum: PetSex, default: PetSex.UNKNOWN })
  @IsEnum(PetSex)
  @IsOptional()
  sex?: PetSex = PetSex.UNKNOWN;

  @ApiPropertyOptional({ example: '2023-04-10', description: 'Birth date in YYYY-MM-DD' })
  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @ApiPropertyOptional({ example: 3.5, description: 'Weight in kg' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  weight?: number;

  @ApiPropertyOptional({ example: '900182001928374' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  microchipNumber?: string;

  @ApiPropertyOptional({ example: 'แพ้ยาฆ่าเชื้อกลุ่ม Amoxicillin' })
  @IsString()
  @IsOptional()
  allergies?: string;

  @ApiPropertyOptional({ example: 'กลัวเสียงไดร์เป่าขนตัวใหญ่ ต้องใช้ไดร์เก็บเสียง' })
  @IsString()
  @IsOptional()
  behavioralNotes?: string;

  @ApiPropertyOptional({ example: 'ชอบให้หวีขนเบาๆ บริเวณหลังหู' })
  @IsString()
  @IsOptional()
  specialRequirements?: string;

  @ApiPropertyOptional({ example: 'https://storage.petflow.co/pets/mochi.jpg' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  photoUrl?: string;
}
