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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignBranchesDto } from './dto/assign-branch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_OWNER, UserRole.TENANT_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new user under a tenant (Owner/Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient role permissions' })
  @ApiResponse({ status: 409, description: 'User email already exists in tenant' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users belonging to a tenant' })
  @ApiQuery({ name: 'tenantId', required: true, description: 'Tenant UUID' })
  findByTenant(@Query('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.usersService.findByTenant(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user profile by ID' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Optional Tenant UUID for isolation check' })
  findById(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('tenantId') tenantId?: string
  ) {
    return this.usersService.findById(id, tenantId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_OWNER, UserRole.TENANT_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile and permissions' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient role permissions' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @Query('tenantId') tenantId?: string
  ) {
    return this.usersService.update(id, dto, tenantId);
  }

  @Post(':id/branches')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_OWNER, UserRole.TENANT_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign branches to a user' })
  @ApiResponse({ status: 200, description: 'Branches assigned successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient role permissions' })
  assignBranches(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignBranchesDto,
    @Query('tenantId') tenantId?: string
  ) {
    return this.usersService.assignBranches(id, dto.branchIds, tenantId);
  }
}
