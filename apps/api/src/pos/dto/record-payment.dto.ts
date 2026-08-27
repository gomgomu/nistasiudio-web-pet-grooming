import {
  IsEnum,
  IsNumber,
  Min,
  IsOptional,
  IsString,
  IsDateString,
  IsUUID,
  IsInt,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethodType } from '@petflow/types';

export class RecordPaymentDto {
  @ApiProperty({
    enum: ['CASH', 'PROMPTPAY', 'CREDIT_CARD', 'BANK_TRANSFER', 'OTHER'],
    description: 'Payment method',
    example: 'PROMPTPAY',
  })
  @IsEnum(['CASH', 'PROMPTPAY', 'CREDIT_CARD', 'BANK_TRANSFER', 'OTHER'])
  method!: PaymentMethodType;

  @ApiProperty({
    description: 'Payment amount in integer minor units (satang e.g. 53500 = 535.00 THB)',
    example: 53500,
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  amountMinor!: number;

  @ApiPropertyOptional({
    description: 'Amount received / tendered in satang for Cash transactions (e.g. 100000 satang)',
    example: 100000,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  receivedAmountMinor?: number;

  @ApiPropertyOptional({
    description: 'Payment reference code (PromptPay trans ID, slip code, card auth code)',
    example: 'PP-20260825-99823',
  })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({
    description: 'Additional notes or payment remarks',
    example: 'ชำระผ่าน PromptPay QR Code หน้าร้าน',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Payment timestamp (defaults to current time)',
  })
  @IsOptional()
  @IsDateString()
  paidAt?: string;
}

export class QueryPaymentsDto {
  @ApiPropertyOptional({ description: 'Filter by Branch ID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({
    enum: ['CASH', 'PROMPTPAY', 'CREDIT_CARD', 'BANK_TRANSFER', 'OTHER'],
    description: 'Filter by Payment Method',
  })
  @IsOptional()
  @IsEnum(['CASH', 'PROMPTPAY', 'CREDIT_CARD', 'BANK_TRANSFER', 'OTHER'])
  method?: PaymentMethodType;

  @ApiPropertyOptional({ description: 'Start date filter (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date filter (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}
