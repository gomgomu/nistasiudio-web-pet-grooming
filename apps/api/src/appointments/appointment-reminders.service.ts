import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../notifications/queues/queue.service';
import { LineService } from '../line/line.service';

export interface ReminderScheduleResult {
  appointmentId: string;
  scheduled24h: boolean;
  scheduled2h: boolean;
  scheduledAt24h?: string;
  scheduledAt2h?: string;
  reason?: string;
}

@Injectable()
export class AppointmentRemindersService {
  private readonly logger = new Logger(AppointmentRemindersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
    private readonly lineService: LineService
  ) {}

  /**
   * Formats Thai date/time string e.g. "26 ส.ค. 2026 เวลา 14:00 น."
   */
  private formatThaiDateTime(date: Date): string {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${d.toLocaleDateString('th-TH', { dateStyle: 'medium' })} เวลา ${hours}:${minutes} น.`;
  }

  /**
   * Schedules automated 24-hour and 2-hour appointment reminders
   */
  async scheduleAppointmentReminders(
    tenantId: string,
    appointmentId: string
  ): Promise<ReminderScheduleResult> {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, tenantId },
      include: {
        customer: {
          include: { notificationPreferences: true },
        },
        pet: true,
        service: true,
        branch: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (['CANCELLED', 'NO_SHOW', 'COMPLETED'].includes(appointment.status)) {
      return {
        appointmentId,
        scheduled24h: false,
        scheduled2h: false,
        reason: `Cannot schedule reminders for appointment with status ${appointment.status}`,
      };
    }

    const customer = appointment.customer;
    if (customer.notificationPreferences && !customer.notificationPreferences.allowReminders) {
      return {
        appointmentId,
        scheduled24h: false,
        scheduled2h: false,
        reason: 'Customer has opted out of reminders',
      };
    }

    const now = new Date();
    const startTime = new Date(appointment.startAt);
    const target24h = new Date(startTime.getTime() - 24 * 60 * 60 * 1000);
    const target2h = new Date(startTime.getTime() - 2 * 60 * 60 * 1000);

    let scheduled24h = false;
    let scheduled2h = false;

    const formattedTime = this.formatThaiDateTime(startTime);
    const petName = appointment.pet?.name || 'สัตว์เลี้ยง';
    const customerName = `${customer.firstName} ${customer.lastName}`;
    const branchName = appointment.branch?.name || 'คลินิก';
    const serviceName = appointment.service?.name || 'บริการ';

    // 1. Schedule 24h Reminder if target time is in the future
    if (target24h > now) {
      const existing24h = await this.prisma.notification.findFirst({
        where: {
          tenantId,
          appointmentId,
          type: 'APPOINTMENT_REMINDER_24H',
          status: { not: 'CANCELLED' },
        },
      });

      if (!existing24h) {
        const title = `เตือนนัดหมายล่วงหน้า 1 วัน: น้อง ${petName} 🐾`;
        const message = `เรียนคุณ ${customerName} พรุ่งนี้ (${formattedTime}) มีนัดหมายพาน้อง ${petName} มารับบริการ (${serviceName}) ที่ ${branchName} นะคะ หากต้องการเลื่อนนัดหมาย กรุณาแจ้งล่วงหน้าค่ะ`;

        const notif = await this.prisma.notification.create({
          data: {
            tenantId,
            customerId: customer.id,
            appointmentId,
            channel: customer.lineUserId ? 'LINE' : 'SMS',
            type: 'APPOINTMENT_REMINDER_24H',
            status: 'PENDING',
            title,
            message,
            scheduledAt: target24h,
          },
        });

        const delayMs = Math.max(0, target24h.getTime() - now.getTime());
        await this.queueService.enqueueReminder(
          {
            reminderId: notif.id,
            tenantId,
            customerId: customer.id,
            appointmentId,
            reminderType: 'APPOINTMENT',
            title,
            message,
          },
          delayMs
        );

        scheduled24h = true;
      }
    }

    // 2. Schedule 2h Reminder if target time is in the future
    if (target2h > now) {
      const existing2h = await this.prisma.notification.findFirst({
        where: {
          tenantId,
          appointmentId,
          type: 'APPOINTMENT_REMINDER_2H',
          status: { not: 'CANCELLED' },
        },
      });

      if (!existing2h) {
        const title = `เตือนนัดหมายอีก 2 ชั่วโมง: น้อง ${petName} 🐶`;
        const message = `เรียนคุณ ${customerName} อีก 2 ชั่วโมง (${formattedTime}) มีนัดหมายพาน้อง ${petName} มารับบริการ (${serviceName}) ที่ ${branchName} นะคะ เดินทางปลอดภัยค่ะ ✨`;

        const notif = await this.prisma.notification.create({
          data: {
            tenantId,
            customerId: customer.id,
            appointmentId,
            channel: customer.lineUserId ? 'LINE' : 'SMS',
            type: 'APPOINTMENT_REMINDER_2H',
            status: 'PENDING',
            title,
            message,
            scheduledAt: target2h,
          },
        });

        const delayMs = Math.max(0, target2h.getTime() - now.getTime());
        await this.queueService.enqueueReminder(
          {
            reminderId: notif.id,
            tenantId,
            customerId: customer.id,
            appointmentId,
            reminderType: 'APPOINTMENT',
            title,
            message,
          },
          delayMs
        );

        scheduled2h = true;
      }
    }

    return {
      appointmentId,
      scheduled24h,
      scheduled2h,
      scheduledAt24h: scheduled24h ? target24h.toISOString() : undefined,
      scheduledAt2h: scheduled2h ? target2h.toISOString() : undefined,
    };
  }

  /**
   * Cancels pending reminders when appointment is cancelled or rescheduled
   */
  async cancelAppointmentReminders(tenantId: string, appointmentId: string) {
    const updated = await this.prisma.notification.updateMany({
      where: {
        tenantId,
        appointmentId,
        status: 'PENDING',
      },
      data: {
        status: 'CANCELLED',
      },
    });

    this.logger.log(`Cancelled ${updated.count} pending reminders for appointment [${appointmentId}]`);
    return { cancelledCount: updated.count };
  }

  /**
   * Immediately dispatches an ad-hoc reminder
   */
  async sendImmediateReminder(
    tenantId: string,
    appointmentId: string,
    interval: '24h' | '2h' = '24h'
  ) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, tenantId },
      include: {
        customer: true,
        pet: true,
        service: true,
        branch: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const customer = appointment.customer;
    const formattedTime = this.formatThaiDateTime(new Date(appointment.startAt));
    const petName = appointment.pet?.name || 'สัตว์เลี้ยง';
    const title = `แจ้งเตือนนัดหมาย: น้อง ${petName} 🐾`;
    const message = `เรียนคุณ ${customer.firstName} ขอแจ้งเตือนนัดหมาย (${formattedTime}) พาน้อง ${petName} มารับบริการที่ ${appointment.branch?.name || 'คลินิก'} ค่ะ`;

    if (customer.lineUserId) {
      await this.lineService.pushTextMessage(tenantId, customer.lineUserId, message);
    }

    const notification = await this.prisma.notification.create({
      data: {
        tenantId,
        customerId: customer.id,
        appointmentId,
        channel: customer.lineUserId ? 'LINE' : 'SMS',
        type: interval === '2h' ? 'APPOINTMENT_REMINDER_2H' : 'APPOINTMENT_REMINDER_24H',
        status: 'SENT',
        title,
        message,
        sentAt: new Date(),
      },
    });

    return notification;
  }

  /**
   * Retrieves all notification history for an appointment
   */
  async getAppointmentReminders(tenantId: string, appointmentId: string) {
    return this.prisma.notification.findMany({
      where: { tenantId, appointmentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Batch dispatch runner for upcoming appointments needing reminders
   */
  async dispatchDueBatch(tenantId: string) {
    const now = new Date();
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const upcomingAppointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        status: { in: ['CONFIRMED', 'PENDING'] },
        startAt: {
          gte: now,
          lte: in25Hours,
        },
      },
      select: { id: true },
    });

    const results = [];
    for (const appt of upcomingAppointments) {
      const res = await this.scheduleAppointmentReminders(tenantId, appt.id);
      results.push(res);
    }

    return {
      checkedCount: upcomingAppointments.length,
      results,
    };
  }
}
