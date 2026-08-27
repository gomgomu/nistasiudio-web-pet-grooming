import { IsString, IsOptional, IsEnum, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClinicAttachmentType } from '@petflow/types';

export class AddClinicAttachmentDto {
  @ApiProperty({
    enum: ['WOUND_PHOTO', 'LAB_RESULT', 'XRAY', 'ULTRASOUND', 'PRESCRIPTION_SLIP', 'OTHER'],
    example: 'WOUND_PHOTO',
  })
  @IsEnum(['WOUND_PHOTO', 'LAB_RESULT', 'XRAY', 'ULTRASOUND', 'PRESCRIPTION_SLIP', 'OTHER'])
  attachmentType: ClinicAttachmentType;

  @ApiProperty({ example: 'https://storage.petflow.app/attachments/wound-ear-01.jpg' })
  @IsString()
  fileUrl: string;

  @ApiPropertyOptional({ example: 'wound-ear-01.jpg' })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({ example: 'ภาพถ่ายบริเวณใบหูขวาก่อนทำความสะอาด' })
  @IsOptional()
  @IsString()
  caption?: string;
}
