import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { BookingConflictService } from './booking-conflict.service';
import { AppointmentRemindersService } from './appointment-reminders.service';
import { AppointmentRemindersController } from './appointment-reminders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ServicesModule } from '../services/services.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { LineModule } from '../line/line.module';

@Module({
  imports: [PrismaModule, ServicesModule, NotificationsModule, LineModule],
  controllers: [AppointmentsController, AppointmentRemindersController],
  providers: [
    AppointmentsService,
    BookingConflictService,
    AppointmentRemindersService,
  ],
  exports: [
    AppointmentsService,
    BookingConflictService,
    AppointmentRemindersService,
  ],
})
export class AppointmentsModule {}
