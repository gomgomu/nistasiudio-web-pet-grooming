import { Module } from '@nestjs/common';
import { ClinicVisitsController } from './clinic-visits.controller';
import { ClinicVisitsService } from './clinic-visits.service';
import { SoapNotesController } from './soap-notes.controller';
import { SoapNotesService } from './soap-notes.service';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsService } from './prescriptions.service';
import { VaccinationsController } from './vaccinations.controller';
import { VaccinationsService } from './vaccinations.service';
import { FollowUpRemindersController } from './follow-up-reminders.controller';
import { FollowUpRemindersService } from './follow-up-reminders.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LineModule } from '../line/line.module';
import { QueueModule } from '../notifications/queues/queue.module';

@Module({
  imports: [PrismaModule, LineModule, QueueModule],
  controllers: [
    ClinicVisitsController,
    SoapNotesController,
    PrescriptionsController,
    VaccinationsController,
    FollowUpRemindersController,
  ],
  providers: [
    ClinicVisitsService,
    SoapNotesService,
    PrescriptionsService,
    VaccinationsService,
    FollowUpRemindersService,
  ],
  exports: [
    ClinicVisitsService,
    SoapNotesService,
    PrescriptionsService,
    VaccinationsService,
    FollowUpRemindersService,
  ],
})
export class ClinicalModule {}


