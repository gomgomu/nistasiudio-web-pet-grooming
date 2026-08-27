import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { SoapNotesService } from './soap-notes.service';
import { UpdateSoapNoteDto } from './dto/update-soap-note.dto';
import { AddClinicAttachmentDto } from './dto/add-clinic-attachment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@ApiTags('Veterinary SOAP Notes & Medical History')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clinical')
export class SoapNotesController {
  constructor(private readonly soapNotesService: SoapNotesService) {}

  @Get('visits/:visitId/soap')
  @ApiOperation({ summary: 'Get structured SOAP note, vitals, and revision history for a visit' })
  @ApiParam({ name: 'visitId', description: 'Clinic Visit UUID' })
  @ApiResponse({ status: 200, description: 'Structured SOAP note dataset' })
  getSoapNote(
    @CurrentTenant() tenantId: string,
    @Param('visitId') visitId: string
  ) {
    return this.soapNotesService.getSoapNoteByVisitId(tenantId, visitId);
  }

  @Put('visits/:visitId/soap')
  @ApiOperation({ summary: 'Save/Update SOAP note and create immutable audit snapshot' })
  @ApiParam({ name: 'visitId', description: 'Clinic Visit UUID' })
  @ApiResponse({ status: 200, description: 'Updated SOAP note dataset' })
  updateSoapNote(
    @CurrentTenant() tenantId: string,
    @Param('visitId') visitId: string,
    @Body() dto: UpdateSoapNoteDto,
    @Req() req: any
  ) {
    const userId = req.user?.id;
    const userName = req.user?.name || req.user?.email;
    return this.soapNotesService.updateSoapNote(tenantId, visitId, dto, userId, userName);
  }

  @Patch('visits/:visitId/soap')
  @ApiOperation({ summary: 'Patch SOAP note and create immutable audit snapshot' })
  @ApiParam({ name: 'visitId', description: 'Clinic Visit UUID' })
  @ApiResponse({ status: 200, description: 'Updated SOAP note dataset' })
  patchSoapNote(
    @CurrentTenant() tenantId: string,
    @Param('visitId') visitId: string,
    @Body() dto: UpdateSoapNoteDto,
    @Req() req: any
  ) {
    const userId = req.user?.id;
    const userName = req.user?.name || req.user?.email;
    return this.soapNotesService.updateSoapNote(tenantId, visitId, dto, userId, userName);
  }

  @Get('pets/:petId/medical-history')
  @ApiOperation({ summary: 'Get chronological medical history & past SOAP notes for a pet' })
  @ApiParam({ name: 'petId', description: 'Pet UUID' })
  @ApiResponse({ status: 200, description: 'Pet medical history' })
  getPetMedicalHistory(
    @CurrentTenant() tenantId: string,
    @Param('petId') petId: string
  ) {
    return this.soapNotesService.getPetMedicalHistory(tenantId, petId);
  }

  @Post('visits/:visitId/attachments')
  @ApiOperation({ summary: 'Attach clinical photo / document to a visit' })
  @ApiParam({ name: 'visitId', description: 'Clinic Visit UUID' })
  @ApiResponse({ status: 201, description: 'Attachment created' })
  addClinicAttachment(
    @CurrentTenant() tenantId: string,
    @Param('visitId') visitId: string,
    @Body() dto: AddClinicAttachmentDto
  ) {
    return this.soapNotesService.addClinicAttachment(tenantId, visitId, dto);
  }

  @Get('visits/:visitId/attachments')
  @ApiOperation({ summary: 'List all clinical attachments for a visit' })
  @ApiParam({ name: 'visitId', description: 'Clinic Visit UUID' })
  @ApiResponse({ status: 200, description: 'List of attachments' })
  getClinicAttachments(
    @CurrentTenant() tenantId: string,
    @Param('visitId') visitId: string
  ) {
    return this.soapNotesService.getClinicAttachments(tenantId, visitId);
  }

  @Delete('attachments/:attachmentId')
  @ApiOperation({ summary: 'Delete clinical attachment' })
  @ApiParam({ name: 'attachmentId', description: 'Attachment UUID' })
  @ApiResponse({ status: 200, description: 'Attachment deleted' })
  deleteClinicAttachment(
    @CurrentTenant() tenantId: string,
    @Param('attachmentId') attachmentId: string
  ) {
    return this.soapNotesService.deleteClinicAttachment(tenantId, attachmentId);
  }
}
