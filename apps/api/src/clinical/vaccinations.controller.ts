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
import { VaccinationsService } from './vaccinations.service';
import { CreateVaccinationDto } from './dto/create-vaccination.dto';
import { UpdateVaccinationDto } from './dto/update-vaccination.dto';
import { QueryVaccinationsDto } from './dto/query-vaccinations.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@ApiTags('Veterinary Vaccinations & Immunization')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clinical')
export class VaccinationsController {
  constructor(private readonly vaccinationsService: VaccinationsService) {}

  @Get('vaccinations')
  @ApiOperation({ summary: 'Query vaccinations with filters' })
  @ApiResponse({ status: 200, description: 'List of vaccination records' })
  getVaccinations(
    @CurrentTenant() tenantId: string,
    @Query() query: QueryVaccinationsDto
  ) {
    return this.vaccinationsService.getVaccinations(tenantId, query);
  }

  @Post('vaccinations')
  @ApiOperation({ summary: 'Create a new vaccination record' })
  @ApiResponse({ status: 201, description: 'Vaccination record created' })
  createVaccination(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateVaccinationDto
  ) {
    return this.vaccinationsService.createVaccination(tenantId, dto);
  }

  @Get('vaccinations/:id')
  @ApiOperation({ summary: 'Get single vaccination record by ID' })
  @ApiParam({ name: 'id', description: 'Vaccination UUID' })
  @ApiResponse({ status: 200, description: 'Vaccination record details' })
  getVaccinationById(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string
  ) {
    return this.vaccinationsService.getVaccinationById(tenantId, id);
  }

  @Patch('vaccinations/:id')
  @ApiOperation({ summary: 'Update vaccination record' })
  @ApiParam({ name: 'id', description: 'Vaccination UUID' })
  @ApiResponse({ status: 200, description: 'Vaccination record updated' })
  updateVaccination(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateVaccinationDto
  ) {
    return this.vaccinationsService.updateVaccination(tenantId, id, dto);
  }

  @Delete('vaccinations/:id')
  @ApiOperation({ summary: 'Delete vaccination record' })
  @ApiParam({ name: 'id', description: 'Vaccination UUID' })
  @ApiResponse({ status: 200, description: 'Vaccination record deleted' })
  deleteVaccination(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string
  ) {
    return this.vaccinationsService.deleteVaccination(tenantId, id);
  }

  @Get('pets/:petId/vaccination-passport')
  @ApiOperation({ summary: 'Get complete Pet Vaccination Passport & history' })
  @ApiParam({ name: 'petId', description: 'Pet UUID' })
  @ApiResponse({ status: 200, description: 'Pet vaccination passport' })
  getPetVaccinationPassport(
    @CurrentTenant() tenantId: string,
    @Param('petId') petId: string
  ) {
    return this.vaccinationsService.getPetVaccinationPassport(tenantId, petId);
  }
}
