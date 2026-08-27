import { IsUUID, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DispensePrescriptionsDto {
  @ApiPropertyOptional({
    description: 'Specific prescription UUIDs to dispense. If omitted, dispenses all pending in visit.',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  prescriptionIds?: string[];

  @ApiPropertyOptional({ default: true, description: 'Automatically record inventory consumption' })
  @IsOptional()
  @IsBoolean()
  deductStock?: boolean;

  @ApiPropertyOptional({ description: 'Branch ID for stock deduction' })
  @IsOptional()
  @IsUUID()
  branchId?: string;
}
