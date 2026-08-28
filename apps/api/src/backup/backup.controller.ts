import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { BackupService } from './backup.service';
import { TriggerBackupDto } from './dto/trigger-backup.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('SaaS Backup & Disaster Recovery')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('saas-admin/backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post('trigger')
  @ApiOperation({ summary: 'Trigger an on-demand database backup' })
  @ApiResponse({ status: 201, description: 'Backup successfully initiated' })
  triggerBackup(@Body() dto: TriggerBackupDto, @Req() req: any) {
    const userId = req.user?.id;
    const tenantId = req.user?.tenantId;
    return this.backupService.triggerBackup(dto, userId, tenantId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get list of backup archives and metadata' })
  @ApiResponse({ status: 200, description: 'List of backup history records' })
  getBackupHistory() {
    return this.backupService.getBackupHistory();
  }

  @Get('verify/:filename')
  @ApiOperation({ summary: 'Verify SHA-256 integrity of a backup archive' })
  @ApiParam({ name: 'filename', description: 'Name of the backup archive file' })
  @ApiResponse({ status: 200, description: 'Integrity check results' })
  verifyBackup(@Param('filename') filename: string) {
    return this.backupService.verifyBackupIntegrity(filename);
  }

  @Get('tenant-export/:tenantId')
  @ApiOperation({ summary: 'Export isolated tenant data for PDPA compliance or migration' })
  @ApiParam({ name: 'tenantId', description: 'Tenant UUID' })
  @ApiResponse({ status: 200, description: 'Tenant data export package' })
  exportTenantData(@Param('tenantId') tenantId: string, @Req() req: any) {
    const userId = req.user?.id;
    return this.backupService.exportTenantData(tenantId, userId);
  }
}
