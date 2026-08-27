import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { QUEUE_NOTIFICATION, JOB_SEND_NOTIFICATION } from './queue.constants';

export interface SendNotificationJobData {
  notificationId: string;
  tenantId: string;
  customerId: string;
  channel: string;
  type: string;
  title: string;
  message: string;
  payload?: Record<string, any>;
}

@Processor(QUEUE_NOTIFICATION)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<SendNotificationJobData>): Promise<any> {
    if (job.name !== JOB_SEND_NOTIFICATION) {
      this.logger.warn(`Unknown job name: ${job.name}`);
      return;
    }

    const { notificationId, tenantId, customerId, channel, type, title, message } = job.data;
    this.logger.log(`Processing notification [${notificationId}] for customer [${customerId}] via [${channel}]`);

    try {
      // 1. Mark notification as PROCESSING
      await this.prisma.notification.updateMany({
        where: { id: notificationId, tenantId },
        data: { status: 'PROCESSING' },
      });

      // 2. Dispatch simulated multi-channel delivery
      // (LINE Messaging API / SMS Gateway / Email Adapter)
      const dispatchResult = await this.deliverMessage(channel, {
        title,
        message,
        customerId,
      });

      // 3. Mark notification as SENT / DELIVERED
      await this.prisma.notification.updateMany({
        where: { id: notificationId, tenantId },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          error: null,
        },
      });

      this.logger.log(`Notification [${notificationId}] sent successfully via ${channel}`);
      return dispatchResult;
    } catch (err: any) {
      this.logger.error(`Failed to send notification [${notificationId}]: ${err.message}`, err.stack);

      await this.prisma.notification.updateMany({
        where: { id: notificationId, tenantId },
        data: {
          status: 'FAILED',
          error: err.message || 'Delivery failure',
          retryCount: { increment: 1 },
        },
      });

      throw err;
    }
  }

  private async deliverMessage(channel: string, payload: { title: string; message: string; customerId: string }) {
    // Delivery simulated with latency
    await new Promise((resolve) => setTimeout(resolve, 50));
    return {
      channel,
      status: 'DELIVERED',
      deliveredAt: new Date().toISOString(),
      recipient: payload.customerId,
    };
  }
}
