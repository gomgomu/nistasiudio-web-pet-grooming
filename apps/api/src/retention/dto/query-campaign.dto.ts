import { IsOptional, IsEnum, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CampaignStatus, CampaignChannel, CampaignAudienceSegment } from '@petflow/types';

export class QueryCampaignDto {
  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ['DRAFT', 'SCHEDULED', 'RUNNING', 'COMPLETED', 'CANCELLED', 'PAUSED'],
  })
  @IsOptional()
  @IsEnum(['DRAFT', 'SCHEDULED', 'RUNNING', 'COMPLETED', 'CANCELLED', 'PAUSED'])
  status?: CampaignStatus;

  @ApiPropertyOptional({
    description: 'Filter by channel',
    enum: ['LINE', 'SMS', 'EMAIL'],
  })
  @IsOptional()
  @IsEnum(['LINE', 'SMS', 'EMAIL'])
  channel?: CampaignChannel;

  @ApiPropertyOptional({
    description: 'Filter by target audience segment',
    enum: ['ALL', 'AT_RISK', 'LOST', 'VIP', 'GROOMING_DUE', 'VACCINE_DUE', 'NEW'],
  })
  @IsOptional()
  @IsEnum(['ALL', 'AT_RISK', 'LOST', 'VIP', 'GROOMING_DUE', 'VACCINE_DUE', 'NEW'])
  audienceSegment?: CampaignAudienceSegment;

  @ApiPropertyOptional({ description: 'Search campaign name or promo code' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number (default 1)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Limit per page (default 20, max 100)', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
