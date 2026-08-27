import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsNumber,
  IsObject,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CampaignChannel,
  CampaignAudienceSegment,
  CampaignDiscountType,
} from '@petflow/types';

export class CreateCampaignDto {
  @ApiProperty({ description: 'Campaign name (e.g. แคมเปญ Win-Back ลูกค้าหาย 90 วัน)' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    description: 'Campaign channel',
    enum: ['LINE', 'SMS', 'EMAIL'],
    default: 'LINE',
  })
  @IsOptional()
  @IsEnum(['LINE', 'SMS', 'EMAIL'])
  channel?: CampaignChannel = 'LINE';

  @ApiProperty({
    description: 'Audience segment to target',
    enum: ['ALL', 'AT_RISK', 'LOST', 'VIP', 'GROOMING_DUE', 'VACCINE_DUE', 'NEW'],
  })
  @IsNotEmpty()
  @IsEnum(['ALL', 'AT_RISK', 'LOST', 'VIP', 'GROOMING_DUE', 'VACCINE_DUE', 'NEW'])
  audienceSegment!: CampaignAudienceSegment;

  @ApiPropertyOptional({ description: 'Custom criteria thresholds (e.g. daysSinceLastVisit, species)' })
  @IsOptional()
  @IsObject()
  audienceFilterCriteria?: Record<string, any>;

  @ApiProperty({
    description: 'Message template with merge tags like {customerName}, {petName}, {promoCode}',
    example: 'สวัสดีครับคุณ {customerName} คิดถึงน้อง {petName} จังเลย! รับส่วนลด 15% รหัส {promoCode}',
  })
  @IsNotEmpty()
  @IsString()
  messageTemplate!: string;

  @ApiPropertyOptional({ description: 'Promo code (e.g. WINBACK15, WE_MISS_YOU)' })
  @IsOptional()
  @IsString()
  promoCode?: string;

  @ApiPropertyOptional({
    description: 'Discount type',
    enum: ['PERCENTAGE', 'FIXED', 'FREE_SERVICE', 'NONE'],
    default: 'NONE',
  })
  @IsOptional()
  @IsEnum(['PERCENTAGE', 'FIXED', 'FREE_SERVICE', 'NONE'])
  discountType?: CampaignDiscountType = 'NONE';

  @ApiPropertyOptional({ description: 'Discount value (e.g. 15 for 15%, 10000 satang for 100 THB)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountValue?: number;

  @ApiPropertyOptional({ description: 'Scheduled delivery date time (ISO string)' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ description: 'Immediately launch campaign and send messages', default: false })
  @IsOptional()
  @IsBoolean()
  launchImmediately?: boolean = false;
}
