import { PartialType } from '@nestjs/swagger';
import { CreateBlockedTimeDto } from './create-blocked-time.dto';

export class UpdateBlockedTimeDto extends PartialType(CreateBlockedTimeDto) {}
