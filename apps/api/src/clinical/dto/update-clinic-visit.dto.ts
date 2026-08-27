import {
  IsUUID,
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ClinicVisitStatus, ClinicVisitType } from '@petflow/types';
import { ClinicVisitVitalSignsDto } from './create-clinic-visit.dto';

export class UpdateClinicVisitDto {
  @ApiPropertyOptional({
    enum: [
      'SCHEDULED',
      'WAITING',
      'IN_CONSULTATION',
      'EXAMINATION',
      'TREATMENT',
      'COMPLETED',
      'CANCELLED',
    ],
  })
  @IsOptional()
  @IsEnum([
    'SCHEDULED',
    'WAITING',
    'IN_CONSULTATION',
    'EXAMINATION',
    'TREATMENT',
    'COMPLETED',
    'CANCELLED',
  ])
  status?: ClinicVisitStatus;

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

  @ApiPropertyOptional({ description: 'Attending Veterinarian (User ID)' })
  @IsOptional()
  @IsUUID()
  veterinarianId?: string;

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

  @ApiPropertyOptional({ description: 'Completion timestamp' })
  @IsOptional()
  @IsDateString()
  completedAt?: string;
}
