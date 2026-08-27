import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
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
import { NotificationsService } from './notifications.service';
import {
  CreateNotificationDto,
  CreateNotificationTemplateDto,
  UpdateNotificationTemplateDto,
  UpdateNotificationPreferenceDto,
  QueryNotificationsDto,
} from './dto/create-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { NotificationChannel, NotificationType } from '@petflow/types';

@ApiTags('Notifications & Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create and schedule a notification with PDPA preference verification' })
  @ApiResponse({ status: 201, description: 'Notification created' })
  createNotification(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateNotificationDto
  ) {
    return this.notificationsService.createNotification(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated notification dispatch history' })
  @ApiResponse({ status: 200, description: 'Paginated notification logs' })
  findAllNotifications(
    @CurrentTenant() tenantId: string,
    @Query() query: QueryNotificationsDto
  ) {
    return this.notificationsService.findAllNotifications(tenantId, query);
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get all notification templates for tenant' })
  @ApiResponse({ status: 200, description: 'Template list' })
  findAllTemplates(
    @CurrentTenant() tenantId: string,
    @Query('channel') channel?: NotificationChannel,
    @Query('type') type?: NotificationType
  ) {
    return this.notificationsService.findAllTemplates(tenantId, channel, type);
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create a custom notification template' })
  @ApiResponse({ status: 201, description: 'Template created' })
  createTemplate(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateNotificationTemplateDto
  ) {
    return this.notificationsService.createTemplate(tenantId, dto);
  }

  @Post('templates/seed')
  @ApiOperation({ summary: 'Seed standard Thai notification templates for the tenant' })
  @ApiResponse({ status: 201, description: 'Default templates seeded' })
  seedDefaultTemplates(@CurrentTenant() tenantId: string) {
    return this.notificationsService.seedDefaultTemplates(tenantId);
  }

  @Patch('templates/:id')
  @ApiOperation({ summary: 'Update an existing notification template' })
  @ApiResponse({ status: 200, description: 'Template updated' })
  updateTemplate(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateNotificationTemplateDto
  ) {
    return this.notificationsService.updateTemplate(tenantId, id, dto);
  }

  @Get('preferences/:customerId')
  @ApiOperation({ summary: 'Get customer notification preferences' })
  @ApiResponse({ status: 200, description: 'Customer preferences' })
  getCustomerPreferences(
    @CurrentTenant() tenantId: string,
    @Param('customerId') customerId: string
  ) {
    return this.notificationsService.getCustomerPreferences(tenantId, customerId);
  }

  @Put('preferences/:customerId')
  @ApiOperation({ summary: 'Update customer notification preferences' })
  @ApiResponse({ status: 200, description: 'Customer preferences updated' })
  updateCustomerPreferences(
    @CurrentTenant() tenantId: string,
    @Param('customerId') customerId: string,
    @Body() dto: UpdateNotificationPreferenceDto
  ) {
    return this.notificationsService.updateCustomerPreferences(
      tenantId,
      customerId,
      dto
    );
  }
}
