import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentRemindersService } from './appointment-reminders.service';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../notifications/queues/queue.service';
import { LineService } from '../line/line.service';
import { NotFoundException } from '@nestjs/common';

describe('AppointmentRemindersService (PF-048)', () => {
  let service: AppointmentRemindersService;
  let prisma: any;
  let queueService: any;
  let lineService: any;

  const mockTenantId = 'tenant-uuid-1';
  const mockAppointmentId = 'appt-uuid-1';
  const mockCustomerId = 'customer-uuid-1';

  beforeEach(async () => {
    prisma = {
      appointment: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      notification: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    queueService = {
      enqueueReminder: jest.fn().mockResolvedValue({ id: 'job-1' }),
    };

    lineService = {
      pushTextMessage: jest.fn().mockResolvedValue({ success: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentRemindersService,
        { provide: PrismaService, useValue: prisma },
        { provide: QueueService, useValue: queueService },
        { provide: LineService, useValue: lineService },
      ],
    }).compile();

    service = module.get<AppointmentRemindersService>(AppointmentRemindersService);
  });

  describe('scheduleAppointmentReminders', () => {
    it('schedules both 24h and 2h reminders for appointments 48h in future', async () => {
      const futureStart = new Date(Date.now() + 48 * 60 * 60 * 1000);

      prisma.appointment.findFirst.mockResolvedValue({
        id: mockAppointmentId,
        tenantId: mockTenantId,
        status: 'CONFIRMED',
        startAt: futureStart,
        customer: {
          id: mockCustomerId,
          firstName: 'สุภาพร',
          lastName: 'ใจดี',
          lineUserId: 'U12345',
          notificationPreferences: { allowReminders: true },
        },
        pet: { name: 'โมจิ' },
        service: { name: 'อาบน้ำตัดขน' },
        branch: { name: 'สาขาทองหล่อ' },
      });

      prisma.notification.findFirst.mockResolvedValue(null);
      prisma.notification.create
        .mockResolvedValueOnce({ id: 'notif-24h' })
        .mockResolvedValueOnce({ id: 'notif-2h' });

      const result = await service.scheduleAppointmentReminders(
        mockTenantId,
        mockAppointmentId
      );

      expect(result.scheduled24h).toBe(true);
      expect(result.scheduled2h).toBe(true);
      expect(prisma.notification.create).toHaveBeenCalledTimes(2);
      expect(queueService.enqueueReminder).toHaveBeenCalledTimes(2);
    });

    it('skips 24h reminder when appointment is booked 5h in advance', async () => {
      const futureStart = new Date(Date.now() + 5 * 60 * 60 * 1000);

      prisma.appointment.findFirst.mockResolvedValue({
        id: mockAppointmentId,
        tenantId: mockTenantId,
        status: 'CONFIRMED',
        startAt: futureStart,
        customer: {
          id: mockCustomerId,
          firstName: 'สมชาย',
          lastName: 'รักดี',
          notificationPreferences: { allowReminders: true },
        },
        pet: { name: 'บัดดี้' },
      });

      prisma.notification.findFirst.mockResolvedValue(null);
      prisma.notification.create.mockResolvedValueOnce({ id: 'notif-2h' });

      const result = await service.scheduleAppointmentReminders(
        mockTenantId,
        mockAppointmentId
      );

      expect(result.scheduled24h).toBe(false);
      expect(result.scheduled2h).toBe(true);
      expect(prisma.notification.create).toHaveBeenCalledTimes(1);
    });

    it('skips scheduling when customer has opted out of reminders', async () => {
      const futureStart = new Date(Date.now() + 48 * 60 * 60 * 1000);

      prisma.appointment.findFirst.mockResolvedValue({
        id: mockAppointmentId,
        tenantId: mockTenantId,
        status: 'CONFIRMED',
        startAt: futureStart,
        customer: {
          id: mockCustomerId,
          notificationPreferences: { allowReminders: false },
        },
      });

      const result = await service.scheduleAppointmentReminders(
        mockTenantId,
        mockAppointmentId
      );

      expect(result.scheduled24h).toBe(false);
      expect(result.scheduled2h).toBe(false);
      expect(result.reason).toContain('opted out');
    });

    it('skips scheduling when appointment is cancelled', async () => {
      prisma.appointment.findFirst.mockResolvedValue({
        id: mockAppointmentId,
        tenantId: mockTenantId,
        status: 'CANCELLED',
        customer: { id: mockCustomerId },
      });

      const result = await service.scheduleAppointmentReminders(
        mockTenantId,
        mockAppointmentId
      );

      expect(result.scheduled24h).toBe(false);
      expect(result.scheduled2h).toBe(false);
    });

    it('is idempotent and does not recreate already existing reminders', async () => {
      const futureStart = new Date(Date.now() + 48 * 60 * 60 * 1000);

      prisma.appointment.findFirst.mockResolvedValue({
        id: mockAppointmentId,
        tenantId: mockTenantId,
        status: 'CONFIRMED',
        startAt: futureStart,
        customer: {
          id: mockCustomerId,
          notificationPreferences: { allowReminders: true },
        },
      });

      // Existing 24h & 2h reminders found
      prisma.notification.findFirst.mockResolvedValue({ id: 'existing-notif' });

      const result = await service.scheduleAppointmentReminders(
        mockTenantId,
        mockAppointmentId
      );

      expect(result.scheduled24h).toBe(false);
      expect(result.scheduled2h).toBe(false);
      expect(prisma.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('cancelAppointmentReminders', () => {
    it('cancels all pending reminders for appointment', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.cancelAppointmentReminders(
        mockTenantId,
        mockAppointmentId
      );

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
          appointmentId: mockAppointmentId,
          status: 'PENDING',
        },
        data: { status: 'CANCELLED' },
      });
      expect(result.cancelledCount).toBe(2);
    });
  });

  describe('sendImmediateReminder', () => {
    it('dispatches immediate reminder via LINE and records notification', async () => {
      prisma.appointment.findFirst.mockResolvedValue({
        id: mockAppointmentId,
        tenantId: mockTenantId,
        startAt: new Date(),
        customer: {
          id: mockCustomerId,
          firstName: 'สุภาพร',
          lineUserId: 'U1234567890',
        },
        pet: { name: 'โมจิ' },
        branch: { name: 'สาขาทองหล่อ' },
      });

      prisma.notification.create.mockResolvedValue({ id: 'notif-imm-1', status: 'SENT' });

      const result = await service.sendImmediateReminder(
        mockTenantId,
        mockAppointmentId,
        '24h'
      );

      expect(lineService.pushTextMessage).toHaveBeenCalled();
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'SENT' }),
        })
      );
      expect(result.id).toBe('notif-imm-1');
    });

    it('throws NotFoundException if appointment does not exist', async () => {
      prisma.appointment.findFirst.mockResolvedValue(null);

      await expect(
        service.sendImmediateReminder(mockTenantId, 'unknown', '24h')
      ).rejects.toThrow(NotFoundException);
    });
  });
});
