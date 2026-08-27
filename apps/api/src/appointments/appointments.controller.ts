import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
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
import { AppointmentsService } from './appointments.service';
import { BookingConflictService } from './booking-conflict.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { QueryAppointmentDto } from './dto/query-appointment.dto';
import { ValidateBookingDto } from './dto/validate-booking.dto';
import { FindAvailableSlotsDto } from './dto/find-available-slots.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Appointments & Bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly bookingConflictService: BookingConflictService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new appointment with automated conflict checking & pricing' })
  @ApiResponse({ status: 201, description: 'Appointment created successfully' })
  create(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') currentUserId: string,
    @Body() dto: CreateAppointmentDto
  ) {
    return this.appointmentsService.create(tenantId, currentUserId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Find all appointments with filters, date range, search, and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of appointments' })
  findAll(
    @CurrentTenant() tenantId: string,
    @Query() query: QueryAppointmentDto
  ) {
    return this.appointmentsService.findAll(tenantId, query);
  }

  @Post('check-conflicts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate appointment slot and detect booking conflicts' })
  @ApiResponse({ status: 200, description: 'Booking validation result' })
  validateBooking(
    @CurrentTenant() tenantId: string,
    @Body() dto: ValidateBookingDto
  ) {
    return this.bookingConflictService.validateBooking(tenantId, dto);
  }

  @Get('available-slots')
  @ApiOperation({ summary: 'Find conflict-free available booking time slots' })
  @ApiResponse({ status: 200, description: 'List of available slots' })
  findAvailableSlots(
    @CurrentTenant() tenantId: string,
    @Query() query: FindAvailableSlotsDto
  ) {
    return this.bookingConflictService.findAvailableSlots(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get appointment details by ID' })
  @ApiResponse({ status: 200, description: 'Appointment details' })
  findById(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string
  ) {
    return this.appointmentsService.findById(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update appointment details with conflict re-validation' })
  @ApiResponse({ status: 200, description: 'Appointment updated successfully' })
  update(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateAppointmentDto
  ) {
    return this.appointmentsService.update(id, tenantId, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update appointment status lifecycle (CHECKED_IN, COMPLETED, CANCELLED, etc.)' })
  @ApiResponse({ status: 200, description: 'Appointment status updated' })
  updateStatus(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateAppointmentStatusDto
  ) {
    return this.appointmentsService.updateStatus(id, tenantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an appointment' })
  @ApiResponse({ status: 200, description: 'Appointment deleted successfully' })
  delete(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string
  ) {
    return this.appointmentsService.delete(id, tenantId);
  }
}
