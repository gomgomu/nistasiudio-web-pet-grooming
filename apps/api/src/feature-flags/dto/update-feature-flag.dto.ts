import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFeatureFlagDto {
  @ApiPropertyOptional({ example: 'LINE Official Account Integration' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'ส่งข้อความนัดหมายและใบเสร็จผ่าน LINE OA' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'MARKETING' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isGlobalEnabled?: boolean;

  @ApiPropertyOptional({ example: 'PROFESSIONAL' })
  @IsOptional()
  @IsString()
  minPlanCode?: string;
}
