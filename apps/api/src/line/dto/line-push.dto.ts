import {
  IsString,
  IsOptional,
  IsObject,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PushLineMessageDto {
  @ApiProperty({ description: 'LINE User ID', example: 'U1234567890abcdef1234567890abcdef' })
  @IsString()
  lineUserId!: string;

  @ApiPropertyOptional({ description: 'Plain text message', example: 'สวัสดีครับ น้องกรูมมิ่งเสร็จแล้วครับ' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({ description: 'Alternative text for Flex message', example: 'ใบเสร็จรับเงิน e-Receipt' })
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiPropertyOptional({ description: 'LINE Flex Message Bubble/Carousel JSON schema' })
  @IsOptional()
  @IsObject()
  flexContents?: Record<string, any>;
}

export class QueryLineInboundDto {
  @ApiPropertyOptional({ description: 'Filter by LINE User ID' })
  @IsOptional()
  @IsString()
  lineUserId?: string;

  @ApiPropertyOptional({ description: 'Filter by Event Type (e.g. message, follow, unfollow, postback)' })
  @IsOptional()
  @IsString()
  eventType?: string;

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
