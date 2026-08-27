import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpsertGroomingProfileDto {
  @ApiPropertyOptional({
    example: 'ทรงเทดดี้แบร์ (Teddy Bear Cut) หน้ากลม ขนตัวสั้น 1 ซม. ขาฟู',
    description: 'Preferred haircut style and grooming preferences',
  })
  @IsString()
  @IsOptional()
  preferredCut?: string;

  @ApiPropertyOptional({
    example: 'แชมพูสูตรอ่อนโยน Hypoallergenic สำหรับผิวบอบบาง',
    description: 'Preferred shampoo formula or coat treatment product',
  })
  @IsString()
  @IsOptional()
  shampoo?: string;

  @ApiPropertyOptional({
    example: 'มีติ่งเนื้อที่หลังหูด้านซ้าย ระวังใบมีดบาด',
    description: 'Physical sensitivities, moles, scars, or injury warnings',
  })
  @IsString()
  @IsOptional()
  warnings?: string;

  @ApiPropertyOptional({
    example: 'กลัวเสียงไดร์เป่าขน ให้ใช้ลมเบา และต้องใส่คอลล่าร์เวลาตัดเล็บ',
    description: 'Behavioral observations and temperaments during grooming',
  })
  @IsString()
  @IsOptional()
  behaviorNotes?: string;

  @ApiPropertyOptional({
    example: 'u1111111-1111-4111-a111-111111111111',
    description: 'Preferred Staff / Groomer ID',
  })
  @IsUUID()
  @IsOptional()
  preferredGroomerId?: string;

  @ApiPropertyOptional({
    example: 'ต้องมีผู้ช่วยช่วยพยุงขาหลังเนื่องจากน้องเคยผ่าตัดสะโพก',
    description: 'Special handling procedures or assistance required',
  })
  @IsString()
  @IsOptional()
  specialHandling?: string;
}
