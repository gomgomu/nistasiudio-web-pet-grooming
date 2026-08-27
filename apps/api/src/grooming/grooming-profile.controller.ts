import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GroomingProfileService } from './grooming-profile.service';
import { UpsertGroomingProfileDto } from './dto/upsert-grooming-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@ApiTags('Grooming Profiles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pets/:petId/grooming-profile')
export class GroomingProfileController {
  constructor(
    private readonly groomingProfileService: GroomingProfileService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get pet grooming profile, style preferences, and sensitive warnings' })
  @ApiResponse({ status: 200, description: 'Pet grooming profile' })
  findByPetId(
    @CurrentTenant() tenantId: string,
    @Param('petId') petId: string
  ) {
    return this.groomingProfileService.findByPetId(tenantId, petId);
  }

  @Put()
  @ApiOperation({ summary: 'Upsert (create or update) pet grooming profile and preferences' })
  @ApiResponse({ status: 200, description: 'Grooming profile saved' })
  upsertByPetId(
    @CurrentTenant() tenantId: string,
    @Param('petId') petId: string,
    @Body() dto: UpsertGroomingProfileDto
  ) {
    return this.groomingProfileService.upsertByPetId(tenantId, petId, dto);
  }

  @Delete()
  @ApiOperation({ summary: 'Reset or clear pet grooming profile' })
  @ApiResponse({ status: 200, description: 'Grooming profile reset' })
  deleteByPetId(
    @CurrentTenant() tenantId: string,
    @Param('petId') petId: string
  ) {
    return this.groomingProfileService.deleteByPetId(tenantId, petId);
  }
}
