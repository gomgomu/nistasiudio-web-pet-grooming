import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Branches')
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_OWNER, UserRole.TENANT_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new branch under a tenant' })
  @ApiResponse({ status: 201, description: 'Branch created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient role permissions' })
  @ApiResponse({ status: 409, description: 'Branch code already exists in tenant' })
  create(@Body() dto: CreateBranchDto) {
    return this.branchesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all branches for a tenant' })
  @ApiQuery({ name: 'tenantId', required: true, description: 'Tenant UUID' })
  findByTenant(@Query('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.branchesService.findByTenant(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get branch details by ID' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Optional Tenant UUID for isolation check' })
  findById(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('tenantId') tenantId?: string
  ) {
    return this.branchesService.findById(id, tenantId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_OWNER, UserRole.TENANT_ADMIN, UserRole.BRANCH_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update branch information' })
  @ApiResponse({ status: 200, description: 'Branch updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient role permissions' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBranchDto,
    @Query('tenantId') tenantId?: string
  ) {
    return this.branchesService.update(id, dto, tenantId);
  }
}
