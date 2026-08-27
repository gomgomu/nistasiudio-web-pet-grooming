import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SecurityService } from './security.service';
import { CheckPasswordDto } from './dto/check-password.dto';
import { ValidateUploadDto } from './dto/validate-upload.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import {
  PasswordStrengthResult,
  FileUploadValidationResult,
  SecurityOverviewReport,
} from '@petflow/types';

@ApiTags('Security & Hardening')
@Controller('security')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Post('check-password')
  @ApiOperation({ summary: 'Evaluate password strength and compliance with security policy' })
  @ApiResponse({ status: 200, description: 'Password validation analysis' })
  checkPassword(@Body() dto: CheckPasswordDto): PasswordStrengthResult {
    return this.securityService.validatePasswordStrength(dto.password);
  }

  @Post('validate-upload')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Validate file upload metadata, extension, MIME type, and size' })
  @ApiResponse({ status: 200, description: 'Upload validation decision' })
  validateUpload(@Body() dto: ValidateUploadDto): FileUploadValidationResult {
    return this.securityService.validateFileMimeAndExtension(
      dto.fileName,
      dto.mimeType,
      dto.fileSizeBytes
    );
  }

  @Get('overview')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get tenant security overview posture' })
  @ApiResponse({ status: 200, description: 'Tenant security metrics' })
  getOverview(@CurrentTenant() tenantId: string): Promise<SecurityOverviewReport> {
    return this.securityService.getTenantSecurityOverview(tenantId);
  }
}
