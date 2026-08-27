import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateServiceCategoryDto {
  @ApiProperty({ example: 'อาบน้ำตัดขน (Grooming)', description: 'Category name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;
}
