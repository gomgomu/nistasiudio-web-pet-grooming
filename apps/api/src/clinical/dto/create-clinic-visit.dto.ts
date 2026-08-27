import {
  IsUUID,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClinicVisitType } from '@petflow/types';

export class ClinicVisitVitalSignsDto {
  @ApiPropertyOptional({ example: 4.5, description: 'Weight in kg' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(200)
  weightKg?: number;

  @ApiPropertyOptional({ example: 38.5, description: 'Body temperature in Celsius' })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(45)
  temperatureC?: number;

  @ApiPropertyOptional({ example: 120, description: 'Heart rate in beats per minute' })
  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(300)
  heartRateBpm?: number;

  @ApiPropertyOptional({ example: 28, description: 'Respiratory rate in breaths per minute' })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(150)
  respiratoryRateBpm?: number;

  @ApiPropertyOptional({ example: '< 2s', description: 'Capillary refill time' })
  @IsOptional()
  @IsString()
  capillaryRefillTime?: string;

  @ApiPropertyOptional({ example: 'Pink, Moist', description: 'Mucous membrane condition' })
  @IsOptional()
  @IsString()
  mucousMembrane?: string;

  @ApiPropertyOptional({ example: 5, description: 'Body Condition Score (1-9)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(9)
  bodyConditionScore?: number;
}

export class CreateClinicVisitDto {
  @ApiProperty({ description: 'Branch ID' })
  @IsUUID()
  branchId: string;

  @ApiProperty({ description: 'Customer ID' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ description: 'Pet ID' })
  @IsUUID()
  petId: string;

  @ApiPropertyOptional({ description: 'Appointment ID if booked in advance' })
  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @ApiPropertyOptional({ description: 'Attending Veterinarian (User ID)' })
  @IsOptional()
  @IsUUID()
  veterinarianId?: string;

  @ApiPropertyOptional({
    enum: [
      'GENERAL_CHECKUP',
      'VACCINATION',
      'SICK_VISIT',
      'FOLLOW_UP',
      'SURGERY',
      'DENTAL',
      'EMERGENCY',
      'GROOMING_HEALTH_CHECK',
    ],
    default: 'GENERAL_CHECKUP',
  })
  @IsOptional()
  @IsEnum([
    'GENERAL_CHECKUP',
    'VACCINATION',
    'SICK_VISIT',
    'FOLLOW_UP',
    'SURGERY',
    'DENTAL',
    'EMERGENCY',
    'GROOMING_HEALTH_CHECK',
  ])
  visitType?: ClinicVisitType;

  @ApiPropertyOptional({ example: 'คันหู เกาตลอดเวลา มีกลิ่นและสะเก็ดสีดำ' })
  @IsOptional()
  @IsString()
  chiefComplaint?: string;

  @ApiPropertyOptional({ example: 'เริ่มมีอาการมา 3 วัน ไม่ยอมให้จับใบหู' })
  @IsOptional()
  @IsString()
  symptoms?: string;

  @ApiPropertyOptional({ type: ClinicVisitVitalSignsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ClinicVisitVitalSignsDto)
  vitals?: ClinicVisitVitalSignsDto;

  @ApiPropertyOptional({ description: 'Subjective (SOAP S)' })
  @IsOptional()
  @IsString()
  subjective?: string;

  @ApiPropertyOptional({ description: 'Objective (SOAP O)' })
  @IsOptional()
  @IsString()
  objective?: string;

  @ApiPropertyOptional({ description: 'Assessment (SOAP A)' })
  @IsOptional()
  @IsString()
  assessment?: string;

  @ApiPropertyOptional({ description: 'Plan (SOAP P)' })
  @IsOptional()
  @IsString()
  plan?: string;

  @ApiPropertyOptional({ example: 'Otitis Externa (ภาวะช่องหูส่วนนอกอักเสบจากยีสต์)' })
  @IsOptional()
  @IsString()
  diagnosis?: string;

  @ApiPropertyOptional({ example: 'Ear mite infestation, Atopic dermatitis' })
  @IsOptional()
  @IsString()
  differentialDiagnosis?: string;

  @ApiPropertyOptional({ example: 'ล้างทำความสะอาดช่องหู และหยอดยารักษา' })
  @IsOptional()
  @IsString()
  treatmentSummary?: string;

  @ApiPropertyOptional({ example: 'งดให้น้ำเข้าหู ระวังการเกา แนะนำใส่คอลลาร์' })
  @IsOptional()
  @IsString()
  dischargeNotes?: string;

  @ApiPropertyOptional({ example: '2026-09-03' })
  @IsOptional()
  @IsDateString()
  followUpDate?: string;

  @ApiPropertyOptional({ example: 'นัดตรวจซ้ำและส่องกล้องดูเซลล์หู' })
  @IsOptional()
  @IsString()
  followUpReason?: string;

  @ApiPropertyOptional({ description: 'Date and time of visit' })
  @IsOptional()
  @IsDateString()
  visitedAt?: string;
}
