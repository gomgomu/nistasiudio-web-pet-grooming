import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  QUEUE_NOTIFICATION,
  QUEUE_REMINDER,
  QUEUE_CAMPAIGN,
  JOB_SEND_NOTIFICATION,
  JOB_DISPATCH_REMINDER,
  JOB_PROCESS_CAMPAIGN,
} from './queue.constants';
import { SendNotificationJobData } from './notification.processor';
import { DispatchReminderJobData } from './reminder.processor';
import { ProcessCampaignJobData } from './campaign.processor';

export interface QueueHealthMetrics {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue(QUEUE_NOTIFICATION) private readonly notificationQueue: Queue,
    @InjectQueue(QUEUE_REMINDER) private readonly reminderQueue: Queue,
    @InjectQueue(QUEUE_CAMPAIGN) private readonly campaignQueue: Queue
  ) {}

  /**
   * Enqueues an immediate or delayed transactional notification with retry backoff
   */
  async enqueueNotification(
    data: SendNotificationJobData,
    delayMs?: number
  ) {
    this.logger.log(`Enqueueing notification [${data.notificationId}] (delay: ${delayMs || 0}ms)`);

    return this.notificationQueue.add(JOB_SEND_NOTIFICATION, data, {
      delay: delayMs || 0,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });
  }

  /**
   * Enqueues a scheduled reminder for appointment, vaccine, or grooming follow-up
   */
  async enqueueReminder(
    data: DispatchReminderJobData,
    delayMs?: number
  ) {
    this.logger.log(`Enqueueing reminder [${data.reminderId}] for customer [${data.customerId}]`);

    return this.reminderQueue.add(JOB_DISPATCH_REMINDER, data, {
      delay: delayMs || 0,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 3000,
      },
      removeOnComplete: true,
    });
  }

  /**
   * Enqueues a batch marketing campaign dispatch
   */
  async enqueueCampaign(data: ProcessCampaignJobData) {
    this.logger.log(`Enqueueing campaign [${data.campaignId}] with ${data.recipientIds.length} recipients`);

    return this.campaignQueue.add(JOB_PROCESS_CAMPAIGN, data, {
      attempts: 2,
      removeOnComplete: true,
    });
  }

  /**
   * Retrieves real-time queue health counts across all 3 BullMQ queues
   */
  async getQueueMetrics(): Promise<QueueHealthMetrics[]> {
    const queues = [
      { name: QUEUE_NOTIFICATION, queue: this.notificationQueue },
      { name: QUEUE_REMINDER, queue: this.reminderQueue },
      { name: QUEUE_CAMPAIGN, queue: this.campaignQueue },
    ];

    const results: QueueHealthMetrics[] = [];

    for (const item of queues) {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        item.queue.getWaitingCount().catch(() => 0),
        item.queue.getActiveCount().catch(() => 0),
        item.queue.getCompletedCount().catch(() => 0),
        item.queue.getFailedCount().catch(() => 0),
        item.queue.getDelayedCount().catch(() => 0),
      ]);

      results.push({
        name: item.name,
        waiting,
        active,
        completed,
        failed,
        delayed,
      });
    }

    return results;
  }
}
