import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AppointmentRemindersService } from './appointment-reminders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@ApiTags('Appointment Reminders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentRemindersController {
  constructor(
    private readonly remindersService: AppointmentRemindersService
  ) {}

  @Post(':id/reminders/schedule')
  @ApiOperation({ summary: 'Schedule automated 24h and 2h reminders for an appointment' })
  @ApiResponse({ status: 200, description: 'Reminders scheduled' })
  scheduleReminders(
    @CurrentTenant() tenantId: string,
    @Param('id') appointmentId: string
  ) {
    return this.remindersService.scheduleAppointmentReminders(
      tenantId,
      appointmentId
    );
  }

  @Post(':id/reminders/send-now')
  @ApiOperation({ summary: 'Immediately dispatch an ad-hoc reminder to customer via LINE/SMS' })
  @ApiResponse({ status: 201, description: 'Immediate reminder sent' })
  sendImmediate(
    @CurrentTenant() tenantId: string,
    @Param('id') appointmentId: string,
    @Query('interval') interval?: '24h' | '2h'
  ) {
    return this.remindersService.sendImmediateReminder(
      tenantId,
      appointmentId,
      interval || '24h'
    );
  }

  @Get(':id/reminders')
  @ApiOperation({ summary: 'Get reminder history for an appointment' })
  @ApiResponse({ status: 200, description: 'Reminder history list' })
  getReminders(
    @CurrentTenant() tenantId: string,
    @Param('id') appointmentId: string
  ) {
    return this.remindersService.getAppointmentReminders(
      tenantId,
      appointmentId
    );
  }

  @Post('reminders/dispatch-batch')
  @ApiOperation({ summary: 'Run batch scan and schedule reminders for all upcoming appointments' })
  @ApiResponse({ status: 200, description: 'Batch processing result' })
  dispatchBatch(@CurrentTenant() tenantId: string) {
    return this.remindersService.dispatchDueBatch(tenantId);
  }
}
