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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { QueryStaffDto } from './dto/query-staff.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@ApiTags('Staff')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new staff member or attach staff profile to existing user' })
  @ApiResponse({ status: 201, description: 'Staff member created successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists or staff profile already attached' })
  create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateStaffDto
  ) {
    return this.staffService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all staff members with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of staff members' })
  findAll(
    @CurrentTenant() tenantId: string,
    @Query() query: QueryStaffDto
  ) {
    return this.staffService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get staff member profile details by User ID or Profile ID' })
  @ApiResponse({ status: 200, description: 'Staff member found' })
  @ApiResponse({ status: 403, description: 'Forbidden: Cross-tenant access' })
  @ApiResponse({ status: 404, description: 'Staff member not found' })
  findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string
  ) {
    return this.staffService.findById(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update staff member profile, role, status or branch assignments' })
  @ApiResponse({ status: 200, description: 'Staff member updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Cross-tenant access' })
  @ApiResponse({ status: 404, description: 'Staff member not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateStaffDto
  ) {
    return this.staffService.update(id, tenantId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate staff member' })
  @ApiResponse({ status: 200, description: 'Staff member deactivated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Cross-tenant access' })
  delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string
  ) {
    return this.staffService.delete(id, tenantId);
  }
}
