import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  Query,
  UseGuards,
  UnauthorizedException,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LineService } from './line.service';
import {
  PushLineMessageDto,
  QueryLineInboundDto,
} from './dto/line-push.dto';
import { LineWebhookPayload } from './line.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@ApiTags('LINE Official Account Integration')
@Controller('line')
export class LineController {
  constructor(private readonly lineService: LineService) {}

  @Post('webhook')
  @ApiOperation({ summary: 'Receive and process inbound LINE Webhook events (Signature Verified)' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handleWebhook(
    @Headers('x-line-signature') signature: string,
    @Body() payload: LineWebhookPayload,
    @Req() req: any
  ) {
    const rawBody = req.rawBody ? req.rawBody : JSON.stringify(payload);

    // Validate LINE HMAC-SHA256 signature if signature header is provided
    if (signature) {
      const isValid = this.lineService.validateSignature(rawBody, signature);
      if (!isValid) {
        throw new UnauthorizedException('Invalid LINE webhook signature');
      }
    }

    // Default tenant for single webhook ingress or mapped from header/payload
    const tenantId = req.headers['x-tenant-id'] || 'default-tenant-id';
    return this.lineService.handleWebhookEvents(tenantId, payload.events || []);
  }

  @Post('push')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Push text or Flex Message to a LINE user' })
  @ApiResponse({ status: 201, description: 'Message dispatched to LINE' })
  async pushMessage(
    @CurrentTenant() tenantId: string,
    @Body() dto: PushLineMessageDto
  ) {
    if (dto.flexContents) {
      return this.lineService.pushFlexMessage(
        tenantId,
        dto.lineUserId,
        dto.altText || 'ข้อความแจ้งเตือนจาก PetFlow',
        dto.flexContents
      );
    }

    return this.lineService.pushTextMessage(
      tenantId,
      dto.lineUserId,
      dto.text || ''
    );
  }

  @Get('inbound')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get logged inbound LINE messages and customer interaction history' })
  @ApiResponse({ status: 200, description: 'Inbound message log' })
  async findInboundMessages(
    @CurrentTenant() tenantId: string,
    @Query() query: QueryLineInboundDto
  ) {
    return this.lineService.findInboundMessages(tenantId, query);
  }
}
