import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CheckAvailabilityDto {
  @ApiProperty({ example: 'u1111111-1111-4111-a111-111111111111', description: 'Staff user ID to check' })
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @ApiPropertyOptional({ example: 'b1111111-1111-4111-a111-111111111111', description: 'Branch ID' })
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @ApiProperty({ example: '2026-09-01T10:00:00.000Z', description: 'Desired start timestamp (ISO-8601)' })
  @IsDateString()
  @IsNotEmpty()
  startAt!: string;

  @ApiProperty({ example: '2026-09-01T11:00:00.000Z', description: 'Desired end timestamp (ISO-8601)' })
  @IsDateString()
  @IsNotEmpty()
  endAt!: string;
}
