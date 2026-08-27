import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { DispensePrescriptionsDto } from './dto/dispense-prescriptions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@ApiTags('Veterinary Prescriptions & Dispensing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clinical')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Get('visits/:visitId/prescriptions')
  @ApiOperation({ summary: 'Get all prescriptions for a clinic visit' })
  @ApiParam({ name: 'visitId', description: 'Clinic Visit UUID' })
  @ApiResponse({ status: 200, description: 'List of prescriptions' })
  getPrescriptions(
    @CurrentTenant() tenantId: string,
    @Param('visitId') visitId: string
  ) {
    return this.prescriptionsService.getPrescriptionsByVisitId(tenantId, visitId);
  }

  @Post('visits/:visitId/prescriptions')
  @ApiOperation({ summary: 'Create a new prescription for a clinic visit' })
  @ApiParam({ name: 'visitId', description: 'Clinic Visit UUID' })
  @ApiResponse({ status: 201, description: 'Prescription created' })
  createPrescription(
    @CurrentTenant() tenantId: string,
    @Param('visitId') visitId: string,
    @Body() dto: CreatePrescriptionDto
  ) {
    return this.prescriptionsService.createPrescription(tenantId, visitId, dto);
  }

  @Patch('prescriptions/:id')
  @ApiOperation({ summary: 'Update prescription details' })
  @ApiParam({ name: 'id', description: 'Prescription UUID' })
  @ApiResponse({ status: 200, description: 'Prescription updated' })
  updatePrescription(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePrescriptionDto
  ) {
    return this.prescriptionsService.updatePrescription(tenantId, id, dto);
  }

  @Delete('prescriptions/:id')
  @ApiOperation({ summary: 'Delete prescription' })
  @ApiParam({ name: 'id', description: 'Prescription UUID' })
  @ApiResponse({ status: 200, description: 'Prescription deleted' })
  deletePrescription(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string
  ) {
    return this.prescriptionsService.deletePrescription(tenantId, id);
  }

  @Post('visits/:visitId/dispense')
  @ApiOperation({ summary: 'Dispense medications and deduct inventory stock' })
  @ApiParam({ name: 'visitId', description: 'Clinic Visit UUID' })
  @ApiResponse({ status: 200, description: 'Medications dispensed successfully' })
  dispensePrescriptions(
    @CurrentTenant() tenantId: string,
    @Param('visitId') visitId: string,
    @Body() dto: DispensePrescriptionsDto,
    @Req() req: any
  ) {
    const userId = req.user?.id;
    return this.prescriptionsService.dispensePrescriptions(tenantId, visitId, dto, userId);
  }

  @Get('prescriptions/:id/label')
  @ApiOperation({ summary: 'Generate print-ready Thai medicine label for thermal printer' })
  @ApiParam({ name: 'id', description: 'Prescription UUID' })
  @ApiResponse({ status: 200, description: 'Label data' })
  getPrescriptionLabel(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string
  ) {
    return this.prescriptionsService.generatePrescriptionLabel(tenantId, id);
  }
}
