import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LineService } from '../line/line.service';
import { Prisma } from '@prisma/client';

export interface GroomingReadyNotificationResult {
  sent: boolean;
  notificationId?: string;
  reason?: string;
  channel?: string;
}

@Injectable()
export class GroomingNotificationService {
  private readonly logger = new Logger(GroomingNotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly lineService: LineService
  ) {}

  /**
   * Idempotently sends a "Grooming Ready for Pickup" notification to customer
   */
  async sendGroomingReadyNotification(
    tenantId: string,
    queueItemId: string,
    force = false
  ): Promise<GroomingReadyNotificationResult> {
    const item = await this.prisma.groomingQueueItem.findFirst({
      where: { id: queueItemId, tenantId },
      include: {
        customer: {
          include: { notificationPreferences: true },
        },
        pet: true,
        service: true,
        branch: true,
        photos: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Grooming queue item not found');
    }

    const customer = item.customer;

    // 1. Check Customer Preferences (PDPA & Opt-out)
    if (customer.notificationPreferences && !customer.notificationPreferences.allowReminders) {
      this.logger.log(`Customer [${customer.id}] opted out of notifications. Skipping ready notification.`);
      return {
        sent: false,
        reason: 'Customer opted out of notifications',
      };
    }

    // 2. Idempotency Check: Verify if already sent for this queue item
    if (!force) {
      const existing = await this.prisma.notification.findFirst({
        where: {
          tenantId,
          customerId: customer.id,
          type: 'GROOMING_READY',
          status: { in: ['SENT', 'PENDING'] },
          payload: {
            path: ['queueItemId'],
            equals: queueItemId,
          },
        },
      });

      if (existing) {
        this.logger.log(`Ready notification already sent for queue item [${queueItemId}] (Notification: ${existing.id})`);
        return {
          sent: false,
          notificationId: existing.id,
          reason: 'Notification already sent (Idempotent)',
        };
      }
    }

    // 3. Format Notification Message & LINE Flex Card
    const petName = item.pet?.name || 'สัตว์เลี้ยง';
    const serviceName = item.service?.name || 'บริการกรูมมิ่ง';
    const branchName = item.branch?.name || 'สาขา';
    const customerName = `${customer.firstName} ${customer.lastName}`;

    const title = `น้อง ${petName} กรูมมิ่งเสร็จเรียบร้อยแล้วค่ะ 🐶✨`;
    const message = `คุณ ${customerName} คะ ตอนนี้น้อง ${petName} ทำบริการ (${serviceName}) เสร็จเรียบร้อยแล้วค่ะ พร้อมให้มารับกลับได้เลยที่ ${branchName} ขอบคุณค่ะ 🐾`;

    const afterPhoto = item.photos?.find((p) => p.type === 'AFTER') || item.photos?.[0];
    const photoUrl = afterPhoto?.photoUrl;

    const payload: Record<string, any> = {
      queueItemId,
      petId: item.petId,
      petName,
      serviceName,
      branchName,
      photoUrl,
    };

    let channel = 'SMS';

    // 4. Dispatch via LINE if lineUserId is registered
    if (customer.lineUserId) {
      channel = 'LINE';

      if (photoUrl) {
        // Send rich visual card
        const flexContents = {
          type: 'bubble',
          hero: {
            type: 'image',
            url: photoUrl,
            size: 'full',
            aspectRatio: '20:13',
            aspectMode: 'cover',
          },
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: `น้อง ${petName} กรูมมิ่งเสร็จแล้วค่ะ! ✨`,
                weight: 'bold',
                size: 'lg',
                color: '#1e293b',
              },
              {
                type: 'text',
                text: `บริการ: ${serviceName}`,
                size: 'sm',
                color: '#64748b',
                margin: 'md',
              },
              {
                type: 'text',
                text: `สถานที่: ${branchName}`,
                size: 'sm',
                color: '#64748b',
              },
              {
                type: 'text',
                text: 'สามารถมารับน้องกลับได้เลยนะคะ ขอบคุณที่ไว้วางใจค่ะ 🐾',
                size: 'xs',
                color: '#94a3b8',
                margin: 'lg',
                wrap: true,
              },
            ],
          },
        };

        await this.lineService.pushFlexMessage(
          tenantId,
          customer.lineUserId,
          title,
          flexContents
        );
      } else {
        await this.lineService.pushTextMessage(
          tenantId,
          customer.lineUserId,
          message
        );
      }
    }

    // 5. Store immutable Notification record
    const notification = await this.prisma.notification.create({
      data: {
        tenantId,
        customerId: customer.id,
        appointmentId: item.appointmentId || null,
        channel,
        type: 'GROOMING_READY',
        status: 'SENT',
        title,
        message,
        payload: payload as Prisma.InputJsonValue,
        sentAt: new Date(),
      },
    });

    this.logger.log(`Grooming ready notification dispatched [${notification.id}] via ${channel}`);

    return {
      sent: true,
      notificationId: notification.id,
      channel,
    };
  }

  /**
   * Retrieves notification history for a queue item
   */
  async getQueueNotificationHistory(tenantId: string, queueItemId: string) {
    return this.prisma.notification.findMany({
      where: {
        tenantId,
        payload: {
          path: ['queueItemId'],
          equals: queueItemId,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
