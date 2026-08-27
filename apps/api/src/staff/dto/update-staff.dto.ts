import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateStaffDto } from './create-staff.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { UserStatus } from '@prisma/client';

export class UpdateStaffDto extends PartialType(CreateStaffDto) {
  @ApiPropertyOptional({ enum: UserStatus, description: 'User account status' })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;
}
