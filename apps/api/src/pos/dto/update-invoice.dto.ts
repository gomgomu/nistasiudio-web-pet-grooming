import {
  IsString,
  IsUUID,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  Max,
  ArrayMinSize,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateInvoiceItemDto } from './create-invoice.dto';

export class UpdateInvoiceDto {
  @ApiPropertyOptional({ description: 'Customer ID' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Pet ID' })
  @IsOptional()
  @IsUUID()
  petId?: string;

  @ApiPropertyOptional({ description: 'Invoice line items', type: [CreateInvoiceItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items?: CreateInvoiceItemDto[];

  @ApiPropertyOptional({ description: 'Overall invoice fixed discount in satang' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  discountMinor?: number;

  @ApiPropertyOptional({ description: 'Overall invoice discount percentage (0-100%)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  discountPercentage?: number;

  @ApiPropertyOptional({ description: 'Notes or remarks for the invoice' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class VoidInvoiceDto {
  @ApiProperty({ description: 'Reason for voiding the invoice', example: 'ลูกค้าขอยกเลิกรายการและเปลี่ยนเป็นบริการอื่น' })
  @IsString()
  @MinLength(3)
  reason!: string;
}
