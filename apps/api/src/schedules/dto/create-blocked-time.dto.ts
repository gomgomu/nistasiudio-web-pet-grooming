import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateBlockedTimeDto {
  @ApiProperty({ example: 'ประชุมทีมประจำสัปดาห์ / บำรุงรักษาอุปกรณ์อาบน้ำ', description: 'Title or reason for blocked time' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiProperty({ example: '2026-09-01T09:00:00.000Z', description: 'Start timestamp (ISO-8601)' })
  @IsDateString()
  @IsNotEmpty()
  startAt!: string;

  @ApiProperty({ example: '2026-09-01T11:00:00.000Z', description: 'End timestamp (ISO-8601)' })
  @IsDateString()
  @IsNotEmpty()
  endAt!: string;

  @ApiPropertyOptional({ example: false, default: false, description: 'Is all day block' })
  @IsBoolean()
  @IsOptional()
  isAllDay?: boolean = false;

  @ApiPropertyOptional({ example: 'b1111111-1111-4111-a111-111111111111', description: 'Branch ID (if branch-wide or branch-scoped block)' })
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ example: 'u1111111-1111-4111-a111-111111111111', description: 'Specific staff user ID (if blocking staff member)' })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ example: 'ปิดรับคิวอาบน้ำเพื่อทำความสะอาดเครื่องมือและอ่างสปา' })
  @IsString()
  @IsOptional()
  notes?: string;
}
