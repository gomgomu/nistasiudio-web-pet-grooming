import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { QUEUE_REMINDER, JOB_DISPATCH_REMINDER } from './queue.constants';

export interface DispatchReminderJobData {
  reminderId: string;
  tenantId: string;
  customerId: string;
  reminderType: 'APPOINTMENT' | 'VACCINE' | 'GROOMING' | 'FOLLOW_UP';
  title: string;
  message: string;
  appointmentId?: string;
  payload?: Record<string, any>;
}

@Processor(QUEUE_REMINDER)
export class ReminderProcessor extends WorkerHost {
  private readonly logger = new Logger(ReminderProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<DispatchReminderJobData>): Promise<any> {
    if (job.name !== JOB_DISPATCH_REMINDER) {
      this.logger.warn(`Unknown job name: ${job.name}`);
      return;
    }

    const { reminderId, tenantId, customerId, reminderType, title, message, appointmentId, payload } = job.data;
    this.logger.log(`Processing ${reminderType} reminder [${reminderId}] for customer [${customerId}]`);

    // 1. Verify customer preferences
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId },
      include: { notificationPreferences: true },
    });

    if (!customer) {
      this.logger.warn(`Customer [${customerId}] not found. Skipping reminder.`);
      return { skipped: true, reason: 'CUSTOMER_NOT_FOUND' };
    }

    if (customer.notificationPreferences && !customer.notificationPreferences.allowReminders) {
      this.logger.log(`Customer [${customerId}] opted out of reminders. Skipping.`);
      return { skipped: true, reason: 'OPTED_OUT' };
    }

    // 2. Create notification record
    const notification = await this.prisma.notification.create({
      data: {
        tenantId,
        customerId,
        appointmentId: appointmentId || null,
        channel: 'LINE',
        type: `${reminderType}_REMINDER`,
        status: 'SENT',
        title,
        message,
        payload: payload || undefined,
        sentAt: new Date(),
      },
    });

    this.logger.log(`Reminder [${reminderId}] dispatched as notification [${notification.id}]`);
    return { success: true, notificationId: notification.id };
  }
}
