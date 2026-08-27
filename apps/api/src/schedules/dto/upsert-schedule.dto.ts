import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DayOfWeek } from '@prisma/client';

const TIME_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

export class ScheduleItemDto {
  @ApiProperty({ enum: DayOfWeek, example: DayOfWeek.MONDAY })
  @IsEnum(DayOfWeek)
  @IsNotEmpty()
  dayOfWeek!: DayOfWeek;

  @ApiProperty({ example: '09:00', description: 'Shift start time (HH:mm)' })
  @IsString()
  @IsNotEmpty()
  @Matches(TIME_REGEX, { message: 'startTime must be in HH:mm format (e.g. 09:00)' })
  startTime!: string;

  @ApiProperty({ example: '18:00', description: 'Shift end time (HH:mm)' })
  @IsString()
  @IsNotEmpty()
  @Matches(TIME_REGEX, { message: 'endTime must be in HH:mm format (e.g. 18:00)' })
  endTime!: string;

  @ApiPropertyOptional({ example: '12:00', description: 'Break start time (HH:mm)' })
  @IsString()
  @IsOptional()
  @Matches(TIME_REGEX, { message: 'breakStartTime must be in HH:mm format' })
  breakStartTime?: string;

  @ApiPropertyOptional({ example: '13:00', description: 'Break end time (HH:mm)' })
  @IsString()
  @IsOptional()
  @Matches(TIME_REGEX, { message: 'breakEndTime must be in HH:mm format' })
  breakEndTime?: string;

  @ApiPropertyOptional({ example: 'b1111111-1111-4111-a111-111111111111', description: 'Branch ID' })
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ example: true, default: true, description: 'Active status of this working day' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}

export class BatchUpsertScheduleDto {
  @ApiProperty({ type: [ScheduleItemDto], description: 'Weekly shift schedule items' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleItemDto)
  schedules!: ScheduleItemDto[];
}
