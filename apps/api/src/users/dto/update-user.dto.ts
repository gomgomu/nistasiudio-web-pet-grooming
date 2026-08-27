import { ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['tenantId', 'password'] as const)
) {
  @ApiPropertyOptional({ example: 'NewPassword123!', minLength: 8, description: 'Optional new password' })
  @IsString()
  @IsOptional()
  @MinLength(8)
  password?: string;
}
