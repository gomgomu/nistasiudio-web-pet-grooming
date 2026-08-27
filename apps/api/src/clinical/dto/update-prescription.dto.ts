import {
  IsUUID,
  IsString,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePrescriptionDto {
  @ApiPropertyOptional({ description: 'Link to Inventory Product ID for stock deduction' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ example: 'Dexoryl Ear Drops' })
  @IsOptional()
  @IsString()
  medicationName?: string;

  @ApiPropertyOptional({ example: 'Gentamicin + Thiabendazole + Dexamethasone' })
  @IsOptional()
  @IsString()
  genericName?: string;

  @ApiPropertyOptional({ example: 'DROPS' })
  @IsOptional()
  @IsString()
  dosageForm?: string;

  @ApiPropertyOptional({ example: '10 g/bottle' })
  @IsOptional()
  @IsString()
  strength?: string;

  @ApiPropertyOptional({ example: 12.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  dosagePerKg?: number;

  @ApiPropertyOptional({ example: '5 drops / ear' })
  @IsOptional()
  @IsString()
  calculatedDose?: string;

  @ApiPropertyOptional({ example: 'EAR (หยอดหูขวา)' })
  @IsOptional()
  @IsString()
  route?: string;

  @ApiPropertyOptional({ example: 'BID (วันละ 2 ครั้ง เช้า-เย็น)' })
  @IsOptional()
  @IsString()
  frequency?: string;

  @ApiPropertyOptional({ example: '7 วัน' })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  quantity?: number;

  @ApiPropertyOptional({ example: 'ขวด' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ example: 'หยอดหูข้างขวาครั้งละ 5 หยด เช้า-เย็น หลังทำความสะอาดหู' })
  @IsOptional()
  @IsString()
  instruction?: string;

  @ApiPropertyOptional({ example: 'เก็บในอุณหภูมิห้อง ไม่เกิน 30°C เขย่าขวดก่อนใช้' })
  @IsOptional()
  @IsString()
  cautionNotes?: string;

  @ApiPropertyOptional({ example: 35000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceMinor?: number;
}
