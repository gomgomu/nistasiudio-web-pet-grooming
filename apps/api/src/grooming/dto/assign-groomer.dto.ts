import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignGroomerDto {
  @ApiProperty({
    example: 'u1111111-1111-4111-a111-111111111111',
    description: 'Staff / Groomer ID to assign this queue item to',
  })
  @IsUUID()
  groomerId: string;
}
