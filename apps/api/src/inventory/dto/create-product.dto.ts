import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ description: 'Stock Keeping Unit (Unique per Tenant)', example: 'DOG-SHMP-300' })
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @ApiPropertyOptional({ description: 'EAN-13 / UPC Barcode', example: '8850123456789' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiProperty({ description: 'Product / Medication name', example: 'แชมพูบำรุงขนสูตรอ่อนโยน 300ml' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: 'Category ID relation' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Category name/grouping (e.g. GROOMING_SUPPLY, MEDICATION, VACCINE, PETSHOP, GENERAL)',
    example: 'GROOMING_SUPPLY',
    default: 'GENERAL',
  })
  @IsOptional()
  @IsString()
  category?: string = 'GENERAL';

  @ApiPropertyOptional({
    description: 'Inventory packaging unit (e.g. ชิ้น, ขวด, กล่อง, เม็ด, หลอด, กิโลกรัม)',
    example: 'ขวด',
    default: 'ชิ้น',
  })
  @IsOptional()
  @IsString()
  unit?: string = 'ชิ้น';

  @ApiPropertyOptional({
    description: 'Cost price in integer minor units (satang e.g. 20000 = 200.00 THB)',
    example: 20000,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  costMinor?: number = 0;

  @ApiProperty({
    description: 'Selling retail price in integer minor units (satang e.g. 35000 = 350.00 THB)',
    example: 35000,
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  salePriceMinor!: number;

  @ApiPropertyOptional({
    description: 'Value Added Tax (VAT) rate percentage (e.g. 7.00% or 0.00% for exempt medicines)',
    example: 7.0,
    default: 7.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  taxRate?: number = 7.0;

  @ApiPropertyOptional({
    description: 'Minimum stock reorder point threshold for alerts',
    example: 5,
    default: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  reorderPoint?: number = 5;

  @ApiPropertyOptional({ description: 'Product description or dosage instructions' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether product requires veterinary prescription',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isPrescriptionOnly?: boolean = false;

  @ApiPropertyOptional({ description: 'Whether product is active for sales/stocking', default: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean = true;
}
