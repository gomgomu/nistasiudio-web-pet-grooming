import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ValidateUploadDto {
  @ApiProperty({ example: 'pet-mochi-grooming-before.jpg', description: 'Original file name' })
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @ApiProperty({ example: 'image/jpeg', description: 'MIME type of file' })
  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @ApiPropertyOptional({ example: 1048576, description: 'File size in bytes' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  fileSizeBytes?: number;
}
