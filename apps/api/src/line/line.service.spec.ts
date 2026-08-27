import { Test, TestingModule } from '@nestjs/testing';
import { LineService } from './line.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';

describe('LineService (PF-047)', () => {
  let service: LineService;
  let configService: any;
  let prisma: any;

  const mockTenantId = 'tenant-uuid-1';
  const mockSecret = 'test-channel-secret-12345';
  const mockLineUserId = 'U1234567890abcdef1234567890abcdef';

  beforeEach(async () => {
    configService = {
      get: jest.fn((key: string, defaultVal?: any) => {
        if (key === 'LINE_CHANNEL_SECRET') return mockSecret;
        return defaultVal;
      }),
    };

    prisma = {
      customer: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      lineInboundMessage: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LineService,
        { provide: ConfigService, useValue: configService },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<LineService>(LineService);
  });

  describe('validateSignature', () => {
    it('validates authentic HMAC-SHA256 signature', () => {
      const rawBody = JSON.stringify({ events: [{ type: 'message' }] });
      const validSignature = crypto
        .createHmac('sha256', mockSecret)
        .update(rawBody)
        .digest('base64');

      const isValid = service.validateSignature(rawBody, validSignature);
      expect(isValid).toBe(true);
    });

    it('rejects tampered body or incorrect signature', () => {
      const rawBody = JSON.stringify({ events: [{ type: 'message' }] });
      const tamperedSignature = 'invalid-tampered-signature-base64=';

      const isValid = service.validateSignature(rawBody, tamperedSignature);
      expect(isValid).toBe(false);
    });

    it('rejects empty signature', () => {
      const rawBody = JSON.stringify({ events: [] });
      const isValid = service.validateSignature(rawBody, '');
      expect(isValid).toBe(false);
    });
  });

  describe('pushTextMessage', () => {
    it('sends text push message and returns messageId', async () => {
      const result = await service.pushTextMessage(
        mockTenantId,
        mockLineUserId,
        'สวัสดีครับ น้องกรูมมิ่งเสร็จแล้วครับ'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('throws BadRequestException when parameters are missing', async () => {
      await expect(
        service.pushTextMessage(mockTenantId, '', 'text')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('pushFlexMessage', () => {
    it('sends Flex message bubble and returns messageId', async () => {
      const result = await service.pushFlexMessage(
        mockTenantId,
        mockLineUserId,
        'ใบเสร็จ e-Receipt',
        { type: 'bubble', body: { type: 'box', layout: 'vertical', contents: [] } }
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });
  });

  describe('handleWebhookEvents', () => {
    it('handles follow event: opts-in customer and logs inbound message', async () => {
      prisma.customer.findFirst.mockResolvedValue({ id: 'c1', tenantId: mockTenantId });
      prisma.lineInboundMessage.create.mockResolvedValue({ id: 'log-1' });

      const events: any[] = [
        {
          type: 'follow',
          source: { userId: mockLineUserId },
          replyToken: 'reply-token-1',
        },
      ];

      const result = await service.handleWebhookEvents(mockTenantId, events);

      expect(prisma.customer.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { marketingStatus: 'OPTED_IN' },
      });
      expect(prisma.lineInboundMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: 'follow',
            lineUserId: mockLineUserId,
          }),
        })
      );
      expect(result.processedCount).toBe(1);
    });

    it('handles unfollow event: opts-out customer and logs inbound message', async () => {
      prisma.customer.findFirst.mockResolvedValue({ id: 'c1', tenantId: mockTenantId });
      prisma.lineInboundMessage.create.mockResolvedValue({ id: 'log-2' });

      const events: any[] = [
        {
          type: 'unfollow',
          source: { userId: mockLineUserId },
        },
      ];

      await service.handleWebhookEvents(mockTenantId, events);

      expect(prisma.customer.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { marketingStatus: 'OPTED_OUT' },
      });
    });

    it('handles message event: logs inbound user text message', async () => {
      prisma.lineInboundMessage.create.mockResolvedValue({ id: 'log-3' });

      const events: any[] = [
        {
          type: 'message',
          source: { userId: mockLineUserId },
          message: { id: 'msg-1', type: 'text', text: 'สอบถามคิวตัดขนพรุ่งนี้ครับ' },
          replyToken: 'reply-token-msg',
        },
      ];

      await service.handleWebhookEvents(mockTenantId, events);

      expect(prisma.lineInboundMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: 'message',
            text: 'สอบถามคิวตัดขนพรุ่งนี้ครับ',
            replyToken: 'reply-token-msg',
          }),
        })
      );
    });
  });

  describe('findInboundMessages', () => {
    it('returns paginated inbound messages', async () => {
      prisma.lineInboundMessage.findMany.mockResolvedValue([
        { id: 'log-1', text: 'Hello LINE' },
      ]);
      prisma.lineInboundMessage.count.mockResolvedValue(1);

      const result = await service.findInboundMessages(mockTenantId, { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });
});
