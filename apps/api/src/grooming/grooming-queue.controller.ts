import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GroomingQueueService } from './grooming-queue.service';
import { GroomingNotificationService } from './grooming-notification.service';
import { CreateQueueItemDto } from './dto/create-queue-item.dto';
import { UpdateQueueItemDto } from './dto/update-queue-item.dto';
import { UpdateQueueStatusDto } from './dto/update-queue-status.dto';
import { AssignGroomerDto } from './dto/assign-groomer.dto';
import { QueryQueueDto } from './dto/query-queue.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@ApiTags('Grooming Queue')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('grooming/queue')
export class GroomingQueueController {
  constructor(
    private readonly groomingQueueService: GroomingQueueService,
    private readonly groomingNotificationService: GroomingNotificationService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Check-in pet and create new grooming queue item' })
  @ApiResponse({ status: 201, description: 'Queue item created successfully' })
  checkIn(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateQueueItemDto
  ) {
    return this.groomingQueueService.checkIn(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List grooming queue items with branch, groomer, date, and status filters' })
  @ApiResponse({ status: 200, description: 'List of grooming queue items' })
  findAll(
    @CurrentTenant() tenantId: string,
    @Query() query: QueryQueueDto
  ) {
    return this.groomingQueueService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single grooming queue item details by ID' })
  @ApiResponse({ status: 200, description: 'Grooming queue item details' })
  findById(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string
  ) {
    return this.groomingQueueService.findById(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update grooming queue item details' })
  @ApiResponse({ status: 200, description: 'Queue item updated successfully' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateQueueItemDto
  ) {
    return this.groomingQueueService.update(tenantId, id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Transition grooming queue status and update milestone timestamps' })
  @ApiResponse({ status: 200, description: 'Queue status updated successfully' })
  updateStatus(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateQueueStatusDto
  ) {
    return this.groomingQueueService.updateStatus(tenantId, id, dto);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign or transfer groomer for a queue item' })
  @ApiResponse({ status: 200, description: 'Groomer assigned successfully' })
  assignGroomer(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: AssignGroomerDto
  ) {
    return this.groomingQueueService.assignGroomer(tenantId, id, dto.groomerId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel and delete grooming queue item' })
  @ApiResponse({ status: 200, description: 'Queue item deleted successfully' })
  delete(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string
  ) {
    return this.groomingQueueService.delete(tenantId, id);
  }

  @Post(':id/notify-ready')
  @ApiOperation({ summary: 'Manually trigger Grooming Ready customer notification (with idempotency bypass option)' })
  @ApiResponse({ status: 200, description: 'Notification dispatched' })
  notifyReady(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Query('force') force?: string
  ) {
    return this.groomingNotificationService.sendGroomingReadyNotification(
      tenantId,
      id,
      force === 'true'
    );
  }
}
