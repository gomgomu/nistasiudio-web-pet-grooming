import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsObject,
  IsDateString,
  IsBoolean,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  NotificationChannel,
  NotificationType,
  NotificationStatus,
} from '@petflow/types';

export class CreateNotificationDto {
  @ApiProperty({ description: 'Customer ID' })
  @IsUUID()
  customerId!: string;

  @ApiPropertyOptional({ description: 'Associated Appointment ID' })
  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @ApiPropertyOptional({
    enum: ['LINE', 'SMS', 'EMAIL', 'IN_APP'],
    default: 'LINE',
  })
  @IsOptional()
  @IsEnum(['LINE', 'SMS', 'EMAIL', 'IN_APP'])
  channel?: NotificationChannel = 'LINE';

  @ApiProperty({
    enum: [
      'APPOINTMENT_REMINDER',
      'GROOMING_READY',
      'GROOMING_STATUS_UPDATE',
      'VACCINE_REMINDER',
      'INVOICE_RECEIPT',
      'FOLLOW_UP',
      'MARKETING_CAMPAIGN',
      'SYSTEM_ALERT',
    ],
    example: 'APPOINTMENT_REMINDER',
  })
  @IsEnum([
    'APPOINTMENT_REMINDER',
    'GROOMING_READY',
    'GROOMING_STATUS_UPDATE',
    'VACCINE_REMINDER',
    'INVOICE_RECEIPT',
    'FOLLOW_UP',
    'MARKETING_CAMPAIGN',
    'SYSTEM_ALERT',
  ])
  type!: NotificationType;

  @ApiPropertyOptional({ description: 'Template Code (if using a pre-saved template)', example: 'APPT_REMINDER_1D' })
  @IsOptional()
  @IsString()
  templateCode?: string;

  @ApiPropertyOptional({ description: 'Notification Title (required if no templateCode)' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Notification Message body (required if no templateCode)' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ description: 'Dynamic variables for template substitution', example: { customerName: 'คุณสุภาพร', petName: 'น้องโมจิ' } })
  @IsOptional()
  @IsObject()
  templateParams?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Payload metadata or custom Flex message JSON' })
  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Scheduled dispatch time (ISO date string)' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

export class CreateNotificationTemplateDto {
  @ApiProperty({ description: 'Unique template identifier code', example: 'APPT_REMINDER_1D' })
  @IsString()
  code!: string;

  @ApiProperty({ description: 'Human-readable template name', example: 'แจ้งเตือนนัดหมายล่วงหน้า 1 วัน' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ enum: ['LINE', 'SMS', 'EMAIL', 'IN_APP'], default: 'LINE' })
  @IsOptional()
  @IsEnum(['LINE', 'SMS', 'EMAIL', 'IN_APP'])
  channel?: NotificationChannel = 'LINE';

  @ApiProperty({
    enum: [
      'APPOINTMENT_REMINDER',
      'GROOMING_READY',
      'GROOMING_STATUS_UPDATE',
      'VACCINE_REMINDER',
      'INVOICE_RECEIPT',
      'FOLLOW_UP',
      'MARKETING_CAMPAIGN',
      'SYSTEM_ALERT',
    ],
  })
  @IsEnum([
    'APPOINTMENT_REMINDER',
    'GROOMING_READY',
    'GROOMING_STATUS_UPDATE',
    'VACCINE_REMINDER',
    'INVOICE_RECEIPT',
    'FOLLOW_UP',
    'MARKETING_CAMPAIGN',
    'SYSTEM_ALERT',
  ])
  type!: NotificationType;

  @ApiProperty({ description: 'Notification title template' })
  @IsString()
  title!: string;

  @ApiProperty({
    description: 'Message content with {{variables}}',
    example: 'เรียนคุณ {{customerName}} พรุ่งนี้มีนัดพาน้อง {{petName}} มารับบริการที่ {{branchName}} เวลา {{time}} นะคะ 🐾',
  })
  @IsString()
  content!: string;

  @ApiPropertyOptional({ description: 'LINE Flex Message JSON layout' })
  @IsOptional()
  @IsObject()
  lineFlexJson?: Record<string, any>;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class UpdateNotificationTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: ['LINE', 'SMS', 'EMAIL', 'IN_APP'] })
  @IsOptional()
  @IsEnum(['LINE', 'SMS', 'EMAIL', 'IN_APP'])
  channel?: NotificationChannel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  lineFlexJson?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateNotificationPreferenceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowLine?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowSms?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowEmail?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowMarketing?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowReminders?: boolean;
}

export class QueryNotificationsDto {
  @ApiPropertyOptional({ description: 'Filter by Customer ID' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ enum: ['LINE', 'SMS', 'EMAIL', 'IN_APP'] })
  @IsOptional()
  @IsEnum(['LINE', 'SMS', 'EMAIL', 'IN_APP'])
  channel?: NotificationChannel;

  @ApiPropertyOptional({ enum: ['PENDING', 'QUEUED', 'PROCESSING', 'SENT', 'DELIVERED', 'FAILED', 'CANCELLED'] })
  @IsOptional()
  @IsEnum(['PENDING', 'QUEUED', 'PROCESSING', 'SENT', 'DELIVERED', 'FAILED', 'CANCELLED'])
  status?: NotificationStatus;

  @ApiPropertyOptional({
    enum: [
      'APPOINTMENT_REMINDER',
      'GROOMING_READY',
      'GROOMING_STATUS_UPDATE',
      'VACCINE_REMINDER',
      'INVOICE_RECEIPT',
      'FOLLOW_UP',
      'MARKETING_CAMPAIGN',
      'SYSTEM_ALERT',
    ],
  })
  @IsOptional()
  @IsEnum([
    'APPOINTMENT_REMINDER',
    'GROOMING_READY',
    'GROOMING_STATUS_UPDATE',
    'VACCINE_REMINDER',
    'INVOICE_RECEIPT',
    'FOLLOW_UP',
    'MARKETING_CAMPAIGN',
    'SYSTEM_ALERT',
  ])
  type?: NotificationType;

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
