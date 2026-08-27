import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { FollowUpRemindersService } from './follow-up-reminders.service';
import { QueryFollowUpsDto } from './dto/query-follow-ups.dto';
import { SendFollowUpReminderDto } from './dto/send-follow-up-reminder.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@ApiTags('Veterinary Follow-up & Recheck Reminders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clinical/follow-ups')
export class FollowUpRemindersController {
  constructor(private readonly followUpService: FollowUpRemindersService) {}

  @Get()
  @ApiOperation({ summary: 'Get list of upcoming & overdue clinical follow-ups' })
  @ApiResponse({ status: 200, description: 'List of follow-up items' })
  getFollowUps(
    @CurrentTenant() tenantId: string,
    @Query() query: QueryFollowUpsDto
  ) {
    return this.followUpService.getFollowUps(tenantId, query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get follow-up reminders KPI summary metrics' })
  @ApiResponse({ status: 200, description: 'Summary statistics' })
  getFollowUpSummary(@CurrentTenant() tenantId: string) {
    return this.followUpService.getFollowUpSummary(tenantId);
  }

  @Post(':visitId/send-reminder')
  @ApiOperation({ summary: '1-Click send clinical follow-up reminder via LINE or SMS' })
  @ApiParam({ name: 'visitId', description: 'Clinic Visit UUID' })
  @ApiResponse({ status: 200, description: 'Reminder dispatched successfully' })
  sendReminder(
    @CurrentTenant() tenantId: string,
    @Param('visitId') visitId: string,
    @Body() dto: SendFollowUpReminderDto
  ) {
    return this.followUpService.sendFollowUpReminder(tenantId, visitId, dto);
  }

  @Delete(':visitId')
  @ApiOperation({ summary: 'Dismiss follow-up for a clinic visit' })
  @ApiParam({ name: 'visitId', description: 'Clinic Visit UUID' })
  @ApiResponse({ status: 200, description: 'Follow-up dismissed' })
  dismissFollowUp(
    @CurrentTenant() tenantId: string,
    @Param('visitId') visitId: string
  ) {
    return this.followUpService.dismissFollowUp(tenantId, visitId);
  }
}
