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
import { ClinicVisitStatus } from '@petflow/types';
import { ClinicVisitVitalSignsDto } from './create-clinic-visit.dto';

export class UpdateSoapNoteDto {
  @ApiPropertyOptional({
    description: 'Subjective (S): ประวัติอาการจากเจ้าของสัตว์เลี้ยง, ความอยากอาหาร, พฤติกรรม',
    example: 'เจ้าของสังเกตว่าสุนัขเกาหูบ่อยมา 3 วัน ไม่ยอมให้จับใบหู ร้องเจ็บ ทานอาหารปกติ',
  })
  @IsOptional()
  @IsString()
  subjective?: string;

  @ApiPropertyOptional({
    description: 'Objective (O): ผลการตรวจร่างกาย, สัญญาณชีพ, การตรวจเฉพาะระบบ, ผลตรวจแล็บ',
    example: 'ตรวจช่องหูขวาพบ Erythema, Ceruminous discharge สีน้ำตาลดำ Cytology: Malassezia pachydermatis (3+)',
  })
  @IsOptional()
  @IsString()
  objective?: string;

  @ApiPropertyOptional({
    description: 'Assessment (A): การวินิจฉัยโรคหลัก, การวินิจฉัยแยกโรค, ปัญหาทางการแพทย์',
    example: 'Right Otitis Externa caused by Malassezia pachydermatis overgrowth',
  })
  @IsOptional()
  @IsString()
  assessment?: string;

  @ApiPropertyOptional({
    description: 'Plan (P): แผนการรักษา, ยา, การล้างแผล, คำแนะนำเจ้าของ, การนัดตรวจติดตาม',
    example: '1. Flush right ear with Epi-Otic ear cleanser\n2. Dexoryl ear drops 5 drops BID x 7 days\n3. Recheck cytology in 7 days',
  })
  @IsOptional()
  @IsString()
  plan?: string;

  @ApiPropertyOptional({ example: 'คันหู เกาตลอดเวลา มีกลิ่นและสะเก็ดสีดำ' })
  @IsOptional()
  @IsString()
  chiefComplaint?: string;

  @ApiPropertyOptional({ example: 'มีสะเก็ดขี้หูดำ กลิ่นเหม็นอับ' })
  @IsOptional()
  @IsString()
  symptoms?: string;

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

  @ApiPropertyOptional({ example: 'งดให้น้ำเข้าหู ใส่คอลลาร์ป้องกันการเกา' })
  @IsOptional()
  @IsString()
  dischargeNotes?: string;

  @ApiPropertyOptional({ example: '2026-09-03' })
  @IsOptional()
  @IsDateString()
  followUpDate?: string;

  @ApiPropertyOptional({ example: 'นัดตรวจซ้ำและส่องกล้องดูเซลล์หู (Ear Cytology Recheck)' })
  @IsOptional()
  @IsString()
  followUpReason?: string;

  @ApiPropertyOptional({ type: ClinicVisitVitalSignsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ClinicVisitVitalSignsDto)
  vitals?: ClinicVisitVitalSignsDto;

  @ApiPropertyOptional({ description: 'Attending Veterinarian User ID' })
  @IsOptional()
  @IsUUID()
  veterinarianId?: string;

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
    description: 'Audit note / changelog reason for editing clinical history',
    example: 'อัปเดตผลตรวจ Ear Cytology เพิ่มเติม',
  })
  @IsOptional()
  @IsString()
  authorNote?: string;
}
