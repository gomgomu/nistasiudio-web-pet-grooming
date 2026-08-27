import { Test, TestingModule } from '@nestjs/testing';
import { GroomingNotificationService } from './grooming-notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { LineService } from '../line/line.service';
import { NotFoundException } from '@nestjs/common';

describe('GroomingNotificationService (PF-049)', () => {
  let service: GroomingNotificationService;
  let prisma: any;
  let lineService: any;

  const mockTenantId = 'tenant-uuid-1';
  const mockQueueItemId = 'queue-uuid-1';
  const mockCustomerId = 'customer-uuid-1';

  beforeEach(async () => {
    prisma = {
      groomingQueueItem: {
        findFirst: jest.fn(),
      },
      notification: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
      },
    };

    lineService = {
      pushTextMessage: jest.fn().mockResolvedValue({ success: true }),
      pushFlexMessage: jest.fn().mockResolvedValue({ success: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroomingNotificationService,
        { provide: PrismaService, useValue: prisma },
        { provide: LineService, useValue: lineService },
      ],
    }).compile();

    service = module.get<GroomingNotificationService>(GroomingNotificationService);
  });

  describe('sendGroomingReadyNotification', () => {
    it('sends LINE Flex Card with after-photo when customer has lineUserId', async () => {
      prisma.groomingQueueItem.findFirst.mockResolvedValue({
        id: mockQueueItemId,
        tenantId: mockTenantId,
        customer: {
          id: mockCustomerId,
          firstName: 'สุภาพร',
          lastName: 'ใจดี',
          lineUserId: 'U1234567890',
          notificationPreferences: { allowReminders: true },
        },
        pet: { id: 'pet-1', name: 'โมจิ' },
        service: { name: 'อาบน้ำตัดขน สไตล์เกาหลี' },
        branch: { name: 'สาขาทองหล่อ' },
        photos: [
          { type: 'AFTER', photoUrl: 'https://storage.petflow.th/photos/after-1.jpg' },
        ],
      });

      prisma.notification.findFirst.mockResolvedValue(null);
      prisma.notification.create.mockResolvedValue({ id: 'notif-ready-1' });

      const result = await service.sendGroomingReadyNotification(
        mockTenantId,
        mockQueueItemId
      );

      expect(result.sent).toBe(true);
      expect(result.channel).toBe('LINE');
      expect(lineService.pushFlexMessage).toHaveBeenCalledWith(
        mockTenantId,
        'U1234567890',
        expect.stringContaining('โมจิ'),
        expect.objectContaining({ type: 'bubble' })
      );
      expect(prisma.notification.create).toHaveBeenCalled();
    });

    it('sends plain text LINE message when no photo is attached', async () => {
      prisma.groomingQueueItem.findFirst.mockResolvedValue({
        id: mockQueueItemId,
        tenantId: mockTenantId,
        customer: {
          id: mockCustomerId,
          firstName: 'สมชาย',
          lastName: 'ใจดี',
          lineUserId: 'U1234567890',
          notificationPreferences: { allowReminders: true },
        },
        pet: { id: 'pet-2', name: 'บัดดี้' },
        service: { name: 'กรูมมิ่ง' },
        branch: { name: 'สาขาเอกมัย' },
        photos: [],
      });

      prisma.notification.findFirst.mockResolvedValue(null);
      prisma.notification.create.mockResolvedValue({ id: 'notif-ready-2' });

      const result = await service.sendGroomingReadyNotification(
        mockTenantId,
        mockQueueItemId
      );

      expect(result.sent).toBe(true);
      expect(lineService.pushTextMessage).toHaveBeenCalledWith(
        mockTenantId,
        'U1234567890',
        expect.stringContaining('บัดดี้')
      );
    });

    it('enforces idempotency and skips duplicate dispatch if already sent', async () => {
      prisma.groomingQueueItem.findFirst.mockResolvedValue({
        id: mockQueueItemId,
        tenantId: mockTenantId,
        customer: {
          id: mockCustomerId,
          firstName: 'สุภาพร',
          notificationPreferences: { allowReminders: true },
        },
        pet: { name: 'โมจิ' },
      });

      prisma.notification.findFirst.mockResolvedValue({ id: 'existing-ready-notif' });

      const result = await service.sendGroomingReadyNotification(
        mockTenantId,
        mockQueueItemId,
        false
      );

      expect(result.sent).toBe(false);
      expect(result.reason).toContain('Idempotent');
      expect(lineService.pushFlexMessage).not.toHaveBeenCalled();
      expect(lineService.pushTextMessage).not.toHaveBeenCalled();
      expect(prisma.notification.create).not.toHaveBeenCalled();
    });

    it('allows force re-dispatch when force=true', async () => {
      prisma.groomingQueueItem.findFirst.mockResolvedValue({
        id: mockQueueItemId,
        tenantId: mockTenantId,
        customer: {
          id: mockCustomerId,
          firstName: 'สุภาพร',
          lineUserId: 'U1234567890',
          notificationPreferences: { allowReminders: true },
        },
        pet: { name: 'โมจิ' },
        photos: [],
      });

      prisma.notification.create.mockResolvedValue({ id: 'notif-forced-1' });

      const result = await service.sendGroomingReadyNotification(
        mockTenantId,
        mockQueueItemId,
        true // force
      );

      expect(result.sent).toBe(true);
      expect(lineService.pushTextMessage).toHaveBeenCalled();
    });

    it('skips dispatch when customer opted out of reminders', async () => {
      prisma.groomingQueueItem.findFirst.mockResolvedValue({
        id: mockQueueItemId,
        tenantId: mockTenantId,
        customer: {
          id: mockCustomerId,
          firstName: 'สุภาพร',
          notificationPreferences: { allowReminders: false },
        },
      });

      const result = await service.sendGroomingReadyNotification(
        mockTenantId,
        mockQueueItemId
      );

      expect(result.sent).toBe(false);
      expect(result.reason).toContain('opted out');
    });

    it('throws NotFoundException if queue item does not exist', async () => {
      prisma.groomingQueueItem.findFirst.mockResolvedValue(null);

      await expect(
        service.sendGroomingReadyNotification(mockTenantId, 'unknown')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getQueueNotificationHistory', () => {
    it('returns notifications for queue item', async () => {
      prisma.notification.findMany.mockResolvedValue([{ id: 'notif-1' }]);

      const history = await service.getQueueNotificationHistory(
        mockTenantId,
        mockQueueItemId
      );

      expect(history).toHaveLength(1);
    });
  });
});
