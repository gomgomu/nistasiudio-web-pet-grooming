import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SchedulesService } from './schedules.service';
import { BatchUpsertScheduleDto } from './dto/upsert-schedule.dto';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';
import { CreateBlockedTimeDto } from './dto/create-blocked-time.dto';
import { UpdateBlockedTimeDto } from './dto/update-blocked-time.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { LeaveStatus } from '@prisma/client';

@ApiTags('Schedules & Working Hours')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  // ---------------------------------------------------------------------------
  // Weekly Schedules
  // ---------------------------------------------------------------------------

  @Get('staff/:userId')
  @ApiOperation({ summary: 'Get recurring weekly schedule and breaks for a staff member' })
  @ApiResponse({ status: 200, description: 'Weekly shift schedule' })
  getStaffSchedule(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentTenant() tenantId: string
  ) {
    return this.schedulesService.getStaffSchedule(userId, tenantId);
  }

  @Put('staff/:userId')
  @ApiOperation({ summary: 'Upsert recurring weekly shift schedule & breaks for a staff member' })
  @ApiResponse({ status: 200, description: 'Schedules updated successfully' })
  upsertStaffSchedule(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: BatchUpsertScheduleDto
  ) {
    return this.schedulesService.upsertStaffSchedule(userId, tenantId, dto);
  }

  // ---------------------------------------------------------------------------
  // Staff Leaves
  // ---------------------------------------------------------------------------

  @Get('leaves')
  @ApiOperation({ summary: 'List all staff leave records' })
  @ApiResponse({ status: 200, description: 'List of staff leaves' })
  findAllLeaves(
    @CurrentTenant() tenantId: string,
    @Query('userId') userId?: string,
    @Query('status') status?: LeaveStatus
  ) {
    return this.schedulesService.findAllLeaves(tenantId, { userId, status });
  }

  @Get('leaves/:id')
  @ApiOperation({ summary: 'Get staff leave by ID' })
  @ApiResponse({ status: 200, description: 'Leave record found' })
  findLeaveById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string
  ) {
    return this.schedulesService.findLeaveById(id, tenantId);
  }

  @Post('leaves')
  @ApiOperation({ summary: 'Submit / record a staff leave' })
  @ApiResponse({ status: 201, description: 'Leave recorded successfully' })
  createLeave(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateLeaveDto
  ) {
    return this.schedulesService.createLeave(tenantId, dto);
  }

  @Patch('leaves/:id')
  @ApiOperation({ summary: 'Update staff leave' })
  @ApiResponse({ status: 200, description: 'Leave updated successfully' })
  updateLeave(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateLeaveDto
  ) {
    return this.schedulesService.updateLeave(id, tenantId, dto);
  }

  @Delete('leaves/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete / cancel staff leave record' })
  @ApiResponse({ status: 200, description: 'Leave deleted successfully' })
  deleteLeave(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string
  ) {
    return this.schedulesService.deleteLeave(id, tenantId);
  }

  // ---------------------------------------------------------------------------
  // Blocked Times
  // ---------------------------------------------------------------------------

  @Get('blocked-times')
  @ApiOperation({ summary: 'List blocked time slots for branch or staff' })
  @ApiResponse({ status: 200, description: 'List of blocked times' })
  findAllBlockedTimes(
    @CurrentTenant() tenantId: string,
    @Query('branchId') branchId?: string,
    @Query('userId') userId?: string
  ) {
    return this.schedulesService.findAllBlockedTimes(tenantId, {
      branchId,
      userId,
    });
  }

  @Get('blocked-times/:id')
  @ApiOperation({ summary: 'Get blocked time by ID' })
  @ApiResponse({ status: 200, description: 'Blocked time found' })
  findBlockedTimeById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string
  ) {
    return this.schedulesService.findBlockedTimeById(id, tenantId);
  }

  @Post('blocked-times')
  @ApiOperation({ summary: 'Create a blocked time slot (branch or staff)' })
  @ApiResponse({ status: 201, description: 'Blocked time created successfully' })
  createBlockedTime(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateBlockedTimeDto
  ) {
    return this.schedulesService.createBlockedTime(tenantId, dto);
  }

  @Patch('blocked-times/:id')
  @ApiOperation({ summary: 'Update blocked time slot' })
  @ApiResponse({ status: 200, description: 'Blocked time updated successfully' })
  updateBlockedTime(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateBlockedTimeDto
  ) {
    return this.schedulesService.updateBlockedTime(id, tenantId, dto);
  }

  @Delete('blocked-times/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete blocked time slot' })
  @ApiResponse({ status: 200, description: 'Blocked time deleted successfully' })
  deleteBlockedTime(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string
  ) {
    return this.schedulesService.deleteBlockedTime(id, tenantId);
  }

  // ---------------------------------------------------------------------------
  // Availability Engine Check
  // ---------------------------------------------------------------------------

  @Get('check-availability')
  @ApiOperation({ summary: 'Check staff availability for a specific booking slot' })
  @ApiResponse({ status: 200, description: 'Availability check result' })
  checkStaffAvailability(
    @CurrentTenant() tenantId: string,
    @Query() query: CheckAvailabilityDto
  ) {
    return this.schedulesService.checkStaffAvailability(tenantId, query);
  }
}
