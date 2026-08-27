import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CheckPasswordDto {
  @ApiProperty({ example: 'Str0ngP@ssw0rd!', description: 'Password string to evaluate for security policy' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
