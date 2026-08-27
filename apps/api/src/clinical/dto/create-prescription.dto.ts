import {
  IsUUID,
  IsString,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePrescriptionDto {
  @ApiPropertyOptional({ description: 'Link to Inventory Product ID for stock deduction' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiProperty({ example: 'Dexoryl Ear Drops' })
  @IsString()
  medicationName: string;

  @ApiPropertyOptional({ example: 'Gentamicin + Thiabendazole + Dexamethasone' })
  @IsOptional()
  @IsString()
  genericName?: string;

  @ApiPropertyOptional({ example: 'DROPS', description: 'TABLET, SYRUP, DROPS, INJECTION, SPOT_ON' })
  @IsOptional()
  @IsString()
  dosageForm?: string;

  @ApiPropertyOptional({ example: '10 g/bottle' })
  @IsOptional()
  @IsString()
  strength?: string;

  @ApiPropertyOptional({ example: 12.5, description: 'Calculated dose per kg (mg/kg)' })
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

  @ApiProperty({ example: 1, description: 'Quantity prescribed' })
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiPropertyOptional({ example: 'ขวด', description: 'Unit (เม็ด, ขวด, หลอด, ml)' })
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

  @ApiPropertyOptional({ example: 35000, description: 'Price in satang minor units' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceMinor?: number;
}
