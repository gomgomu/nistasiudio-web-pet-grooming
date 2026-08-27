import { IsNotEmpty, IsUUID, IsNumber, Min, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordCampaignConversionDto {
  @ApiProperty({ description: 'Customer UUID that converted' })
  @IsNotEmpty()
  @IsUUID()
  customerId!: string;

  @ApiProperty({ description: 'Invoice or purchase amount in minor units (satang)' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amountMinor!: number;

  @ApiPropertyOptional({ description: 'Invoice UUID' })
  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @ApiPropertyOptional({ description: 'Notes or promo code applied' })
  @IsOptional()
  @IsString()
  notes?: string;
}
