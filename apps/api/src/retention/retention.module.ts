import { Module } from '@nestjs/common';
import { RetentionController } from './retention.controller';
import { RetentionService } from './retention.service';
import { GroomingDueService } from './grooming-due.service';
import { VaccineDueService } from './vaccine-due.service';
import { CampaignService } from './campaign.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LineModule } from '../line/line.module';

@Module({
  imports: [PrismaModule, LineModule],
  controllers: [RetentionController],
  providers: [
    RetentionService,
    GroomingDueService,
    VaccineDueService,
    CampaignService,
  ],
  exports: [
    RetentionService,
    GroomingDueService,
    VaccineDueService,
    CampaignService,
  ],
})
export class RetentionModule {}



