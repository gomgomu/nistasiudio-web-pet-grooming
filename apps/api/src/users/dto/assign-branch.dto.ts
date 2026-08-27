import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class AssignBranchesDto {
  @ApiProperty({
    example: ['b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22'],
    description: 'Array of Branch UUIDs to grant access to this user',
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  branchIds!: string[];
}
