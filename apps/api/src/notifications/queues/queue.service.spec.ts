import { Test, TestingModule } from '@nestjs/testing';
import { QueueService } from './queue.service';
import { NotificationProcessor } from './notification.processor';
import { ReminderProcessor } from './reminder.processor';
import { CampaignProcessor } from './campaign.processor';
import { PrismaService } from '../../prisma/prisma.service';
import {
  QUEUE_NOTIFICATION,
  QUEUE_REMINDER,
  QUEUE_CAMPAIGN,
  JOB_SEND_NOTIFICATION,
  JOB_DISPATCH_REMINDER,
  JOB_PROCESS_CAMPAIGN,
} from './queue.constants';

describe('BullMQ Worker Engine (PF-045)', () => {
  let queueService: QueueService;
  let notifProcessor: NotificationProcessor;
  let reminderProcessor: ReminderProcessor;
  let campaignProcessor: CampaignProcessor;
  let prisma: any;

  let mockNotifQueue: any;
  let mockReminderQueue: any;
  let mockCampaignQueue: any;

  const mockTenantId = 'tenant-uuid-1';
  const mockCustomerId = 'customer-uuid-1';

  beforeEach(async () => {
    prisma = {
      notification: {
        updateMany: jest.fn(),
        create: jest.fn(),
      },
      customer: {
        findFirst: jest.fn(),
      },
      campaign: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      campaignRecipient: {
        updateMany: jest.fn(),
      },
    };

    mockNotifQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-notif-1' }),
      getWaitingCount: jest.fn().mockResolvedValue(2),
      getActiveCount: jest.fn().mockResolvedValue(1),
      getCompletedCount: jest.fn().mockResolvedValue(10),
      getFailedCount: jest.fn().mockResolvedValue(0),
      getDelayedCount: jest.fn().mockResolvedValue(0),
    };

    mockReminderQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-rem-1' }),
      getWaitingCount: jest.fn().mockResolvedValue(5),
      getActiveCount: jest.fn().mockResolvedValue(0),
      getCompletedCount: jest.fn().mockResolvedValue(20),
      getFailedCount: jest.fn().mockResolvedValue(0),
      getDelayedCount: jest.fn().mockResolvedValue(5),
    };

    mockCampaignQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-camp-1' }),
      getWaitingCount: jest.fn().mockResolvedValue(0),
      getActiveCount: jest.fn().mockResolvedValue(0),
      getCompletedCount: jest.fn().mockResolvedValue(1),
      getFailedCount: jest.fn().mockResolvedValue(0),
      getDelayedCount: jest.fn().mockResolvedValue(0),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        NotificationProcessor,
        ReminderProcessor,
        CampaignProcessor,
        { provide: PrismaService, useValue: prisma },
        { provide: `BullQueue_${QUEUE_NOTIFICATION}`, useValue: mockNotifQueue },
        { provide: `BullQueue_${QUEUE_REMINDER}`, useValue: mockReminderQueue },
        { provide: `BullQueue_${QUEUE_CAMPAIGN}`, useValue: mockCampaignQueue },
      ],
    }).compile();

    queueService = module.get<QueueService>(QueueService);
    notifProcessor = module.get<NotificationProcessor>(NotificationProcessor);
    reminderProcessor = module.get<ReminderProcessor>(ReminderProcessor);
    campaignProcessor = module.get<CampaignProcessor>(CampaignProcessor);
  });

  describe('QueueService', () => {
    it('enqueues notification job with exponential retry backoff', async () => {
      const result = await queueService.enqueueNotification({
        notificationId: 'notif-1',
        tenantId: mockTenantId,
        customerId: mockCustomerId,
        channel: 'LINE',
        type: 'APPOINTMENT_REMINDER',
        title: 'Title',
        message: 'Message',
      });

      expect(mockNotifQueue.add).toHaveBeenCalledWith(
        JOB_SEND_NOTIFICATION,
        expect.objectContaining({ notificationId: 'notif-1' }),
        expect.objectContaining({
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        })
      );
      expect(result.id).toBe('job-notif-1');
    });

    it('enqueues reminder job with delay', async () => {
      const result = await queueService.enqueueReminder(
        {
          reminderId: 'rem-1',
          tenantId: mockTenantId,
          customerId: mockCustomerId,
          reminderType: 'APPOINTMENT',
          title: 'Rem Title',
          message: 'Rem Message',
        },
        5000
      );

      expect(mockReminderQueue.add).toHaveBeenCalledWith(
        JOB_DISPATCH_REMINDER,
        expect.objectContaining({ reminderId: 'rem-1' }),
        expect.objectContaining({ delay: 5000 })
      );
      expect(result.id).toBe('job-rem-1');
    });

    it('enqueues campaign job', async () => {
      const result = await queueService.enqueueCampaign({
        campaignId: 'camp-1',
        tenantId: mockTenantId,
        recipientIds: ['c1', 'c2'],
      });

      expect(mockCampaignQueue.add).toHaveBeenCalledWith(
        JOB_PROCESS_CAMPAIGN,
        expect.objectContaining({ campaignId: 'camp-1' }),
        expect.any(Object)
      );
      expect(result.id).toBe('job-camp-1');
    });

    it('retrieves health metrics across all 3 queues', async () => {
      const metrics = await queueService.getQueueMetrics();

      expect(metrics).toHaveLength(3);
      expect(metrics[0].name).toBe('notification');
      expect(metrics[0].waiting).toBe(2);
      expect(metrics[1].name).toBe('reminder');
      expect(metrics[1].waiting).toBe(5);
    });
  });

  describe('NotificationProcessor', () => {
    it('transitions notification from PROCESSING to SENT upon successful delivery', async () => {
      const mockJob: any = {
        name: JOB_SEND_NOTIFICATION,
        data: {
          notificationId: 'notif-1',
          tenantId: mockTenantId,
          customerId: mockCustomerId,
          channel: 'LINE',
          type: 'APPOINTMENT_REMINDER',
          title: 'Title',
          message: 'Body',
        },
      };

      await notifProcessor.process(mockJob);

      expect(prisma.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'PROCESSING' },
        })
      );
      expect(prisma.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'SENT' }),
        })
      );
    });
  });

  describe('ReminderProcessor', () => {
    it('dispatches reminder as notification when customer has allowed reminders', async () => {
      prisma.customer.findFirst.mockResolvedValue({
        id: mockCustomerId,
        tenantId: mockTenantId,
        notificationPreferences: { allowReminders: true },
      });
      prisma.notification.create.mockResolvedValue({ id: 'notif-rem-created' });

      const mockJob: any = {
        name: JOB_DISPATCH_REMINDER,
        data: {
          reminderId: 'rem-1',
          tenantId: mockTenantId,
          customerId: mockCustomerId,
          reminderType: 'APPOINTMENT',
          title: 'Reminder Title',
          message: 'Reminder Message',
        },
      };

      const result = await reminderProcessor.process(mockJob);

      expect(result.success).toBe(true);
      expect(prisma.notification.create).toHaveBeenCalled();
    });

    it('skips reminder when customer has opted out of reminders', async () => {
      prisma.customer.findFirst.mockResolvedValue({
        id: mockCustomerId,
        tenantId: mockTenantId,
        notificationPreferences: { allowReminders: false },
      });

      const mockJob: any = {
        name: JOB_DISPATCH_REMINDER,
        data: {
          reminderId: 'rem-1',
          tenantId: mockTenantId,
          customerId: mockCustomerId,
          reminderType: 'APPOINTMENT',
          title: 'Reminder Title',
          message: 'Reminder Message',
        },
      };

      const result = await reminderProcessor.process(mockJob);

      expect(result.skipped).toBe(true);
      expect(prisma.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('CampaignProcessor', () => {
    it('processes campaign recipients, respects marketing consent, and marks campaign completed', async () => {
      prisma.campaign.findFirst.mockResolvedValue({
        id: 'camp-1',
        tenantId: mockTenantId,
      });

      prisma.customer.findFirst
        .mockResolvedValueOnce({
          id: 'c1',
          notificationPreferences: { allowMarketing: true },
        })
        .mockResolvedValueOnce({
          id: 'c2',
          notificationPreferences: { allowMarketing: false }, // Opted out
        });

      const mockJob: any = {
        name: JOB_PROCESS_CAMPAIGN,
        data: {
          campaignId: 'camp-1',
          tenantId: mockTenantId,
          recipientIds: ['c1', 'c2'],
        },
      };

      const result = await campaignProcessor.process(mockJob);

      expect(result.totalRecipients).toBe(2);
      expect(result.sentCount).toBe(1);
      expect(result.skippedCount).toBe(1);
      expect(prisma.campaign.update).toHaveBeenCalledWith({
        where: { id: 'camp-1' },
        data: { status: 'COMPLETED' },
      });
    });
  });
});
