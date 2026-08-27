import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { LeaveStatus, LeaveType } from '@prisma/client';

export class CreateLeaveDto {
  @ApiProperty({ example: 'u1111111-1111-4111-a111-111111111111', description: 'Staff user ID' })
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @ApiPropertyOptional({ enum: LeaveType, default: LeaveType.PERSONAL })
  @IsEnum(LeaveType)
  @IsOptional()
  leaveType?: LeaveType = LeaveType.PERSONAL;

  @ApiProperty({ example: '2026-09-01', description: 'Start date of leave (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @ApiProperty({ example: '2026-09-03', description: 'End date of leave (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  endDate!: string;

  @ApiPropertyOptional({ example: 'ลากิจส่วนตัวไปทำธุระต่างจังหวัด' })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ enum: LeaveStatus, default: LeaveStatus.APPROVED })
  @IsEnum(LeaveStatus)
  @IsOptional()
  status?: LeaveStatus = LeaveStatus.APPROVED;
}
