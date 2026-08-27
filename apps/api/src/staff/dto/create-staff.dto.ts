import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { StaffType, UserRole } from '@prisma/client';

export class CreateStaffDto {
  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', description: 'Existing user ID if attaching profile to existing user' })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ example: 'somchai@petflow.test', description: 'Staff login email (required if userId not provided)' })
  @IsEmail()
  @IsOptional()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ example: 'P@ssword123', description: 'Staff login password (required if userId not provided)' })
  @IsString()
  @IsOptional()
  @MinLength(6)
  @MaxLength(100)
  password?: string;

  @ApiPropertyOptional({ example: 'สมชาย', description: 'First name (required if userId not provided)' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ example: 'ใจดี', description: 'Last name (required if userId not provided)' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ example: '081-234-5678', description: 'Contact phone number' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.GROOMER, description: 'IAM User Role' })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({ example: 'ช่างชาย', description: 'Staff nickname / display name' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  nickname?: string;

  @ApiPropertyOptional({ enum: StaffType, default: StaffType.GROOMER, description: 'Staff operational type' })
  @IsEnum(StaffType)
  @IsOptional()
  staffType?: StaffType = StaffType.GROOMER;

  @ApiPropertyOptional({ example: ['ตัดแต่งขนสุนัขพันธุ์ใหญ่', 'สปานวดอโรมา'], description: 'List of skills/specialties' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  specialties?: string[] = [];

  @ApiPropertyOptional({ example: 'VET-12345', description: 'Veterinary license number (if applicable)' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  licenseNumber?: string;

  @ApiPropertyOptional({ example: 'ประสบการณ์กรูมมิ่ง 5 ปี ชำนาญทรงเกาหลีและทรงเท็ดดี้แบร์' })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({ example: '#4F46E5', description: 'HEX color for calendar/queue operations display' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  colorCode?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  avatarUrl?: string;

  @ApiPropertyOptional({ example: true, default: true, description: 'Whether this staff member can be booked for appointments' })
  @IsBoolean()
  @IsOptional()
  isBookable?: boolean = true;

  @ApiPropertyOptional({ example: ['b1111111-1111-4111-a111-111111111111'], description: 'Branch IDs this staff is assigned to' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  branchIds?: string[];
}
