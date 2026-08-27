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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ClinicVisitsService } from './clinic-visits.service';
import { CreateClinicVisitDto } from './dto/create-clinic-visit.dto';
import { UpdateClinicVisitDto } from './dto/update-clinic-visit.dto';
import { QueryClinicVisitsDto } from './dto/query-clinic-visits.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { ClinicVisitStatus } from '@petflow/types';

@ApiTags('Veterinary & Clinical')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clinical/visits')
export class ClinicVisitsController {
  constructor(private readonly clinicVisitsService: ClinicVisitsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new clinic visit for medical examination' })
  @ApiResponse({ status: 201, description: 'Clinic visit created successfully' })
  createClinicVisit(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateClinicVisitDto
  ) {
    return this.clinicVisitsService.createClinicVisit(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated list of clinic visits with filters' })
  @ApiResponse({ status: 200, description: 'Paginated clinic visits' })
  getClinicVisits(
    @CurrentTenant() tenantId: string,
    @Query() query: QueryClinicVisitsDto
  ) {
    return this.clinicVisitsService.getClinicVisits(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get clinic visit details by ID' })
  @ApiParam({ name: 'id', description: 'Clinic Visit UUID' })
  @ApiResponse({ status: 200, description: 'Clinic visit details' })
  getClinicVisitById(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string
  ) {
    return this.clinicVisitsService.getClinicVisitById(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update clinic visit vitals, SOAP notes, diagnosis or status' })
  @ApiParam({ name: 'id', description: 'Clinic Visit UUID' })
  @ApiResponse({ status: 200, description: 'Clinic visit updated successfully' })
  updateClinicVisit(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateClinicVisitDto
  ) {
    return this.clinicVisitsService.updateClinicVisit(tenantId, id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update clinic visit status' })
  @ApiParam({ name: 'id', description: 'Clinic Visit UUID' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  updateClinicVisitStatus(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body('status') status: ClinicVisitStatus
  ) {
    return this.clinicVisitsService.updateClinicVisitStatus(tenantId, id, status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete clinic visit' })
  @ApiParam({ name: 'id', description: 'Clinic Visit UUID' })
  @ApiResponse({ status: 200, description: 'Clinic visit deleted' })
  deleteClinicVisit(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string
  ) {
    return this.clinicVisitsService.deleteClinicVisit(tenantId, id);
  }
}
