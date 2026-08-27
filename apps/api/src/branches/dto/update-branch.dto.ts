import { ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { CreateBranchDto } from './create-branch.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateBranchDto extends PartialType(OmitType(CreateBranchDto, ['tenantId'] as const)) {
  @ApiPropertyOptional({ example: true, description: 'Branch active status' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
