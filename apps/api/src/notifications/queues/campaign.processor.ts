import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { QUEUE_CAMPAIGN, JOB_PROCESS_CAMPAIGN } from './queue.constants';

export interface ProcessCampaignJobData {
  campaignId: string;
  tenantId: string;
  recipientIds: string[];
}

@Processor(QUEUE_CAMPAIGN)
export class CampaignProcessor extends WorkerHost {
  private readonly logger = new Logger(CampaignProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<ProcessCampaignJobData>): Promise<any> {
    if (job.name !== JOB_PROCESS_CAMPAIGN) {
      this.logger.warn(`Unknown job name: ${job.name}`);
      return;
    }

    const { campaignId, tenantId, recipientIds } = job.data;
    this.logger.log(`Processing campaign [${campaignId}] with [${recipientIds.length}] recipients`);

    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, tenantId },
    });

    if (!campaign) {
      this.logger.warn(`Campaign [${campaignId}] not found.`);
      return { skipped: true, reason: 'CAMPAIGN_NOT_FOUND' };
    }

    let sentCount = 0;
    let skippedCount = 0;

    for (const recipientId of recipientIds) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: recipientId, tenantId },
        include: { notificationPreferences: true },
      });

      if (!customer || (customer.notificationPreferences && !customer.notificationPreferences.allowMarketing)) {
        skippedCount++;
        continue;
      }

      await this.prisma.campaignRecipient.updateMany({
        where: { campaignId, customerId: recipientId },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      sentCount++;
    }

    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'COMPLETED' },
    });

    this.logger.log(`Campaign [${campaignId}] completed. Sent: ${sentCount}, Skipped: ${skippedCount}`);
    return {
      campaignId,
      totalRecipients: recipientIds.length,
      sentCount,
      skippedCount,
    };
  }
}
