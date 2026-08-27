import { IsOptional, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SendFollowUpReminderDto {
  @ApiPropertyOptional({ enum: ['LINE', 'SMS'], default: 'LINE' })
  @IsOptional()
  @IsIn(['LINE', 'SMS'])
  channel?: 'LINE' | 'SMS';

  @ApiPropertyOptional({ example: 'สวัสดีครับ คลินิกขอแจ้งเตือนนัดตรวจติดตามอาการน้องโมจิ...' })
  @IsOptional()
  @IsString()
  customMessage?: string;
}
