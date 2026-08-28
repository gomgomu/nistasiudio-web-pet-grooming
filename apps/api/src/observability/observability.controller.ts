import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ObservabilityService } from './observability.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Platform Observability & Metrics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_OWNER)
@Controller('observability')
export class ObservabilityController {
  constructor(private readonly observabilityService: ObservabilityService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get comprehensive platform metrics (system, queue, db)' })
  @ApiResponse({ status: 200, description: 'Live platform observability metrics' })
  getPlatformOverview() {
    return this.observabilityService.getPlatformOverview();
  }

  @Get('system')
  @ApiOperation({ summary: 'Get detailed Node.js runtime and host memory/CPU metrics' })
  @ApiResponse({ status: 200, description: 'System performance metrics' })
  getSystemMetrics() {
    return this.observabilityService.getSystemMetrics();
  }

  @Get('queues')
  @ApiOperation({ summary: 'Get BullMQ job queue stats (waiting, active, failed)' })
  @ApiResponse({ status: 200, description: 'BullMQ job queues metrics' })
  getQueueMetrics() {
    return this.observabilityService.getQueueMetrics();
  }
}
