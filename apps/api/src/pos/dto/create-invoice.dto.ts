import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  Max,
  ArrayMinSize,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvoiceItemType, InvoiceStatus } from '@petflow/types';

export class CreateInvoiceItemDto {
  @ApiProperty({ description: 'Item description or service/product name', example: 'อาบน้ำตัดขนสุนัขพันธุ์เล็ก' })
  @IsString()
  description!: string;

  @ApiPropertyOptional({ enum: ['SERVICE', 'PRODUCT', 'MEDICATION', 'CUSTOM'], default: 'SERVICE' })
  @IsOptional()
  @IsEnum(['SERVICE', 'PRODUCT', 'MEDICATION', 'CUSTOM'])
  itemType?: InvoiceItemType;

  @ApiPropertyOptional({ description: 'Linked Service ID if applicable' })
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @ApiPropertyOptional({ description: 'Linked Product ID if applicable' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ description: 'Staff ID who provided the service (for commissions)' })
  @IsOptional()
  @IsUUID()
  staffId?: string;

  @ApiProperty({ description: 'Quantity (integer or decimal e.g. 1.5 kg)', example: 1, default: 1 })
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  quantity: number = 1;

  @ApiProperty({ description: 'Unit price in integer minor units (satang e.g. 50000 = 500.00 THB)', example: 50000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unitPriceMinor!: number;

  @ApiPropertyOptional({ description: 'Fixed item discount in satang', example: 5000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  discountMinor?: number;

  @ApiPropertyOptional({ description: 'Percentage item discount (0-100%)', example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  discountPercentage?: number;

  @ApiPropertyOptional({ description: 'VAT percentage rate (default 7.00)', example: 7.0, default: 7.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  taxRate?: number = 7.0;

  @ApiPropertyOptional({ description: 'Whether the unit price includes VAT', default: false })
  @IsOptional()
  @IsBoolean()
  isTaxInclusive?: boolean;
}

export class CreateInvoiceDto {
  @ApiProperty({ description: 'Branch ID where invoice is issued' })
  @IsUUID()
  branchId!: string;

  @ApiProperty({ description: 'Customer ID' })
  @IsUUID()
  customerId!: string;

  @ApiPropertyOptional({ description: 'Pet ID' })
  @IsOptional()
  @IsUUID()
  petId?: string;

  @ApiPropertyOptional({ description: 'Linked Appointment ID' })
  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @ApiPropertyOptional({ description: 'Linked Grooming Queue Item ID' })
  @IsOptional()
  @IsUUID()
  queueItemId?: string;

  @ApiPropertyOptional({ description: 'Linked Clinic Visit ID' })
  @IsOptional()
  @IsUUID()
  clinicVisitId?: string;

  @ApiPropertyOptional({ enum: ['DRAFT', 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'VOID'], default: 'UNPAID' })
  @IsOptional()
  @IsEnum(['DRAFT', 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'VOID'])
  status?: InvoiceStatus = 'UNPAID';

  @ApiProperty({ description: 'Invoice line items', type: [CreateInvoiceItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items!: CreateInvoiceItemDto[];

  @ApiPropertyOptional({ description: 'Overall invoice fixed discount in satang', example: 10000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  discountMinor?: number;

  @ApiPropertyOptional({ description: 'Overall invoice discount percentage (0-100%)', example: 5 })
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

  @ApiPropertyOptional({ description: 'Issued timestamp (defaults to now)' })
  @IsOptional()
  @IsDateString()
  issuedAt?: string;
}
