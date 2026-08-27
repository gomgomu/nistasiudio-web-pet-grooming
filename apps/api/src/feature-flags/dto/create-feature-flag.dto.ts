import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFeatureFlagDto {
  @ApiProperty({ example: 'LINE_MESSAGING', description: 'Unique uppercase feature key' })
  @IsString()
  key: string;

  @ApiProperty({ example: 'LINE Official Account Integration' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'ส่งข้อความนัดหมายและใบเสร็จผ่าน LINE OA' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'MARKETING', default: 'CORE' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isGlobalEnabled?: boolean;

  @ApiPropertyOptional({ example: 'PROFESSIONAL', description: 'Minimum plan required' })
  @IsOptional()
  @IsString()
  minPlanCode?: string;
}
