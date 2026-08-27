import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { MarketingStatus } from '@prisma/client';

export class CreateCustomerDto {
  @ApiProperty({ example: 'กนกวรรณ', description: 'Customer first name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ example: 'รักดี', description: 'Customer last name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName!: string;

  @ApiProperty({ example: '089-111-2233', description: 'Primary contact phone number' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  phone!: string;

  @ApiPropertyOptional({ example: 'kanokwan@example.com' })
  @IsEmail()
  @IsOptional()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ example: 'U1234567890abcdef', description: 'LINE User ID for automated messaging' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  lineUserId?: string;

  @ApiPropertyOptional({ example: '123/45 ถนนสุขุมวิท แขวงคลองตัน เขตคลองเตย กทม.' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'ลูกค้าประจำ ชอบพาน้องมาวันเสาร์ช่วงบ่าย' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ enum: MarketingStatus, default: MarketingStatus.OPTED_IN })
  @IsEnum(MarketingStatus)
  @IsOptional()
  marketingStatus?: MarketingStatus;
}
