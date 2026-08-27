import {
  Controller,
  Get,
  Post,
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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { QueryPetDto } from './dto/query-pet.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@ApiTags('Pets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pets')
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new pet under a customer' })
  @ApiResponse({ status: 201, description: 'Pet created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Customer does not belong to tenant' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreatePetDto
  ) {
    return this.petsService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all pets with filtering and pagination' })
  findAll(
    @CurrentTenant() tenantId: string,
    @Query() query: QueryPetDto
  ) {
    return this.petsService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get pet details, medical history, and grooming notes by ID' })
  @ApiResponse({ status: 200, description: 'Pet found' })
  @ApiResponse({ status: 403, description: 'Forbidden: Cross-tenant access' })
  @ApiResponse({ status: 404, description: 'Pet not found' })
  findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string
  ) {
    return this.petsService.findById(id, tenantId);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get chronological unified timeline of all pet events' })
  @ApiResponse({ status: 200, description: 'Timeline retrieved' })
  @ApiResponse({ status: 403, description: 'Forbidden: Cross-tenant access' })
  getTimeline(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string
  ) {
    return this.petsService.getTimeline(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update pet details, allergies, or behavior notes' })
  @ApiResponse({ status: 200, description: 'Pet updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Cross-tenant access' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdatePetDto
  ) {
    return this.petsService.update(id, tenantId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete pet record' })
  @ApiResponse({ status: 200, description: 'Pet deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Cross-tenant access' })
  delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string
  ) {
    return this.petsService.delete(id, tenantId);
  }
}
