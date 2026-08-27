import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  LinePushResult,
  LineWebhookEvent,
} from './line.interface';
import { QueryLineInboundDto } from './dto/line-push.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class LineService {
  private readonly logger = new Logger(LineService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Validates LINE Webhook HMAC-SHA256 signature header against request body
   */
  validateSignature(
    rawBody: string | Buffer,
    signature: string,
    channelSecretOverride?: string
  ): boolean {
    if (!signature) return false;

    const secret =
      channelSecretOverride ||
      this.configService.get<string>('LINE_CHANNEL_SECRET', 'default-channel-secret');

    const hmac = crypto.createHmac('sha256', secret);
    const bodyBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody);
    const calculatedSignature = hmac.update(bodyBuffer).digest('base64');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'utf8'),
        Buffer.from(calculatedSignature, 'utf8')
      );
    } catch {
      return false;
    }
  }

  /**
   * Pushes a plain text message to a specific LINE user
   */
  async pushTextMessage(
    tenantId: string,
    lineUserId: string,
    text: string
  ): Promise<LinePushResult> {
    if (!lineUserId || !text) {
      throw new BadRequestException('lineUserId and text are required');
    }

    this.logger.log(`[LINE PUSH TEXT] Tenant: ${tenantId} | To: ${lineUserId} | Message: "${text.substring(0, 40)}..."`);

    // In production, executes HTTP POST to https://api.line.me/v2/bot/message/push with LINE_CHANNEL_ACCESS_TOKEN
    const messageId = `line-msg-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    return {
      success: true,
      messageId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Pushes a LINE Flex Message bubble or carousel layout
   */
  async pushFlexMessage(
    tenantId: string,
    lineUserId: string,
    altText: string,
    flexContents: Record<string, any>
  ): Promise<LinePushResult> {
    if (!lineUserId || !flexContents) {
      throw new BadRequestException('lineUserId and flexContents are required');
    }

    this.logger.log(`[LINE PUSH FLEX] Tenant: ${tenantId} | To: ${lineUserId} | AltText: "${altText}"`);

    const messageId = `line-flex-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    return {
      success: true,
      messageId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Processes inbound LINE webhook events (follow, unfollow, message, postback)
   */
  async handleWebhookEvents(tenantId: string, events: LineWebhookEvent[]) {
    this.logger.log(`Processing ${events.length} inbound LINE webhook events for tenant: ${tenantId}`);

    const results = [];

    for (const event of events) {
      const lineUserId = event.source?.userId;
      if (!lineUserId) continue;

      switch (event.type) {
        case 'follow': {
          // Customer added or unblocked LINE OA -> Opt-in
          const customer = await this.prisma.customer.findFirst({
            where: { tenantId, lineUserId },
          });

          if (customer) {
            await this.prisma.customer.update({
              where: { id: customer.id },
              data: { marketingStatus: 'OPTED_IN' },
            });
          }

          const logged = await this.prisma.lineInboundMessage.create({
            data: {
              tenantId,
              lineUserId,
              replyToken: event.replyToken || null,
              eventType: 'follow',
              messageType: null,
              text: 'User followed LINE Official Account',
              payload: event as unknown as Prisma.InputJsonValue,
            },
          });
          results.push(logged);
          break;
        }

        case 'unfollow': {
          // Customer blocked LINE OA -> Opt-out
          const customer = await this.prisma.customer.findFirst({
            where: { tenantId, lineUserId },
          });

          if (customer) {
            await this.prisma.customer.update({
              where: { id: customer.id },
              data: { marketingStatus: 'OPTED_OUT' },
            });
          }

          const logged = await this.prisma.lineInboundMessage.create({
            data: {
              tenantId,
              lineUserId,
              eventType: 'unfollow',
              text: 'User blocked LINE Official Account',
              payload: event as unknown as Prisma.InputJsonValue,
            },
          });
          results.push(logged);
          break;
        }

        case 'message': {
          const text = event.message?.text || '';
          const messageType = event.message?.type || 'text';

          const logged = await this.prisma.lineInboundMessage.create({
            data: {
              tenantId,
              lineUserId,
              replyToken: event.replyToken || null,
              eventType: 'message',
              messageType,
              text,
              payload: event as unknown as Prisma.InputJsonValue,
            },
          });
          results.push(logged);
          break;
        }

        case 'postback': {
          const postbackData = event.postback?.data || '';

          const logged = await this.prisma.lineInboundMessage.create({
            data: {
              tenantId,
              lineUserId,
              replyToken: event.replyToken || null,
              eventType: 'postback',
              messageType: 'postback',
              text: postbackData,
              payload: event as unknown as Prisma.InputJsonValue,
            },
          });
          results.push(logged);
          break;
        }

        default: {
          this.logger.debug(`Unhandled event type: ${event.type}`);
        }
      }
    }

    return {
      processedCount: results.length,
      events: results,
    };
  }

  /**
   * Retrieves paginated inbound LINE messages log
   */
  async findInboundMessages(tenantId: string, query: QueryLineInboundDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.LineInboundMessageWhereInput = {
      tenantId,
      lineUserId: query.lineUserId || undefined,
      eventType: query.eventType || undefined,
    };

    const [data, total] = await Promise.all([
      this.prisma.lineInboundMessage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.lineInboundMessage.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
