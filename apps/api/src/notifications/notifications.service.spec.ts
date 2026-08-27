import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  CreateNotificationDto,
  CreateNotificationTemplateDto,
} from './dto/create-notification.dto';

describe('NotificationsService (PF-044)', () => {
  let service: NotificationsService;
  let prisma: any;

  const mockTenantId = 'tenant-uuid-1';
  const mockCustomerId = 'customer-uuid-1';

  beforeEach(async () => {
    prisma = {
      customer: {
        findFirst: jest.fn(),
      },
      notification: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      notificationTemplate: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      notificationPreference: {
        findFirst: jest.fn(),
        upsert: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('renderTemplate', () => {
    it('interpolates placeholders with provided parameter values', () => {
      const template = 'เรียนคุณ {{customerName}} นัดหมายน้อง {{petName}} เวลา {{time}}';
      const params = { customerName: 'สุภาพร', petName: 'โมจิ', time: '14:00' };

      const result = service.renderTemplate(template, params);

      expect(result).toBe('เรียนคุณ สุภาพร นัดหมายน้อง โมจิ เวลา 14:00');
    });

    it('replaces unsupplied placeholders with empty string', () => {
      const template = 'สวัสดีคุณ {{customerName}} น้อง {{petName}}';
      const params = { customerName: 'สุภาพร' };

      const result = service.renderTemplate(template, params);

      expect(result).toBe('สวัสดีคุณ สุภาพร น้อง ');
    });
  });

  describe('createNotification', () => {
    it('creates notification with template and variable interpolation', async () => {
      prisma.customer.findFirst.mockResolvedValue({
        id: mockCustomerId,
        tenantId: mockTenantId,
        notificationPreferences: {
          allowLine: true,
          allowSms: true,
          allowMarketing: true,
          allowReminders: true,
        },
      });

      prisma.notificationTemplate.findFirst.mockResolvedValue({
        id: 'tpl-1',
        code: 'APPT_REMINDER_1D',
        title: 'เตือนนัดหมายน้อง {{petName}}',
        content: 'เรียนคุณ {{customerName}} พรุ่งนี้นัดหมายที่ {{branchName}}',
        lineFlexJson: null,
      });

      prisma.notification.create.mockResolvedValue({
        id: 'notif-1',
        title: 'เตือนนัดหมายน้อง โมจิ',
        message: 'เรียนคุณ สุภาพร พรุ่งนี้นัดหมายที่ สาขาทองหล่อ',
        status: 'PENDING',
      });

      const dto: CreateNotificationDto = {
        customerId: mockCustomerId,
        type: 'APPOINTMENT_REMINDER',
        channel: 'LINE',
        templateCode: 'APPT_REMINDER_1D',
        templateParams: {
          customerName: 'สุภาพร',
          petName: 'โมจิ',
          branchName: 'สาขาทองหล่อ',
        },
      };

      const result = await service.createNotification(mockTenantId, dto);

      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'เตือนนัดหมายน้อง โมจิ',
            message: 'เรียนคุณ สุภาพร พรุ่งนี้นัดหมายที่ สาขาทองหล่อ',
            channel: 'LINE',
            status: 'PENDING',
          }),
        })
      );
      expect(result.id).toBe('notif-1');
    });

    it('rejects notification when customer has opted out of LINE channel', async () => {
      prisma.customer.findFirst.mockResolvedValue({
        id: mockCustomerId,
        tenantId: mockTenantId,
        notificationPreferences: {
          allowLine: false, // Opted out of LINE
          allowSms: true,
        },
      });

      const dto: CreateNotificationDto = {
        customerId: mockCustomerId,
        type: 'APPOINTMENT_REMINDER',
        channel: 'LINE',
        title: 'Title',
        message: 'Message',
      };

      await expect(
        service.createNotification(mockTenantId, dto)
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects marketing campaign notification when customer opted out of marketing', async () => {
      prisma.customer.findFirst.mockResolvedValue({
        id: mockCustomerId,
        tenantId: mockTenantId,
        notificationPreferences: {
          allowLine: true,
          allowMarketing: false, // Opted out of marketing
        },
      });

      const dto: CreateNotificationDto = {
        customerId: mockCustomerId,
        type: 'MARKETING_CAMPAIGN',
        channel: 'LINE',
        title: 'Promotion',
        message: 'Special Discount',
      };

      await expect(
        service.createNotification(mockTenantId, dto)
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when customer does not exist', async () => {
      prisma.customer.findFirst.mockResolvedValue(null);

      const dto: CreateNotificationDto = {
        customerId: 'unknown-customer',
        type: 'APPOINTMENT_REMINDER',
        channel: 'LINE',
        title: 'Title',
        message: 'Message',
      };

      await expect(
        service.createNotification(mockTenantId, dto)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createTemplate', () => {
    it('creates custom template when code is unique', async () => {
      prisma.notificationTemplate.findFirst.mockResolvedValue(null);
      prisma.notificationTemplate.create.mockResolvedValue({
        id: 'tpl-new',
        code: 'CUSTOM_CODE',
        name: 'Custom Template',
      });

      const dto: CreateNotificationTemplateDto = {
        code: 'CUSTOM_CODE',
        name: 'Custom Template',
        type: 'APPOINTMENT_REMINDER',
        channel: 'LINE',
        title: 'Custom Title',
        content: 'Custom Content {{name}}',
      };

      const result = await service.createTemplate(mockTenantId, dto);

      expect(result.id).toBe('tpl-new');
    });

    it('throws ConflictException when template code already exists in tenant', async () => {
      prisma.notificationTemplate.findFirst.mockResolvedValue({
        id: 'tpl-dup',
        code: 'DUPLICATE_CODE',
      });

      const dto: CreateNotificationTemplateDto = {
        code: 'DUPLICATE_CODE',
        name: 'Dup Template',
        type: 'APPOINTMENT_REMINDER',
        title: 'Title',
        content: 'Content',
      };

      await expect(
        service.createTemplate(mockTenantId, dto)
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateCustomerPreferences', () => {
    it('upserts customer notification preferences', async () => {
      prisma.customer.findFirst.mockResolvedValue({ id: mockCustomerId, tenantId: mockTenantId });
      prisma.notificationPreference.upsert.mockResolvedValue({
        id: 'pref-1',
        customerId: mockCustomerId,
        allowLine: true,
        allowMarketing: false,
      });

      const result = await service.updateCustomerPreferences(
        mockTenantId,
        mockCustomerId,
        { allowMarketing: false }
      );

      expect(prisma.notificationPreference.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { customerId: mockCustomerId },
          update: expect.objectContaining({ allowMarketing: false }),
        })
      );
      expect(result.allowMarketing).toBe(false);
    });
  });

  describe('seedDefaultTemplates', () => {
    it('seeds standard Thai templates', async () => {
      prisma.notificationTemplate.findFirst.mockResolvedValue(null);
      prisma.notificationTemplate.create.mockResolvedValue({ id: 'tpl-seeded' });

      const results = await service.seedDefaultTemplates(mockTenantId);

      expect(results.length).toBeGreaterThan(0);
      expect(prisma.notificationTemplate.create).toHaveBeenCalled();
    });
  });
});
