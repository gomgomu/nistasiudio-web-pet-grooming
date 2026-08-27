import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CsvRowDto {
  @ApiProperty({ example: 'กนกวรรณ', description: 'Customer first name' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiPropertyOptional({ example: 'รักดี' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ example: '089-111-2233', description: 'Customer phone number' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiPropertyOptional({ example: 'kanokwan@example.com' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'โมจิ' })
  @IsString()
  @IsOptional()
  petName?: string;

  @ApiPropertyOptional({ example: 'DOG', enum: ['DOG', 'CAT', 'BIRD', 'RABBIT', 'OTHER'] })
  @IsString()
  @IsOptional()
  species?: string;

  @ApiPropertyOptional({ example: 'Pomeranian' })
  @IsString()
  @IsOptional()
  breed?: string;

  @ApiPropertyOptional({ example: 'แพ้ยา Amoxicillin' })
  @IsString()
  @IsOptional()
  allergies?: string;

  @ApiPropertyOptional({ example: 'กลัวเสียงไดร์เป่าขน' })
  @IsString()
  @IsOptional()
  behavioralNotes?: string;
}

export class ImportCustomerCsvDto {
  @ApiPropertyOptional({ description: 'Raw CSV text content' })
  @IsString()
  @IsOptional()
  csvContent?: string;

  @ApiPropertyOptional({ type: [CsvRowDto], description: 'Parsed row array' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CsvRowDto)
  @IsOptional()
  rows?: CsvRowDto[];
}
