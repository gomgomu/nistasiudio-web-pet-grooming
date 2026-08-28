import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import {
  QUEUE_NOTIFICATION,
  QUEUE_REMINDER,
  QUEUE_CAMPAIGN,
} from './queue.constants';
import { QueueService } from './queue.service';
import { NotificationProcessor } from './notification.processor';
import { ReminderProcessor } from './reminder.processor';
import { CampaignProcessor } from './campaign.processor';

@Module({
  imports: [
    PrismaModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isTls = configService.get<boolean>('redis.tls', false);
        return {
          connection: {
            host: configService.get<string>('redis.host', 'localhost'),
            port: configService.get<number>('redis.port', 6379),
            password: configService.get<string>('redis.password') || undefined,
            ...(isTls ? { tls: { rejectUnauthorized: false } } : {}),
            lazyConnect: true,
            enableOfflineQueue: false,
            maxRetriesPerRequest: null,
            retryStrategy: (times: number) => {
              if (times > 5) {
                return null;
              }
              return Math.min(times * 500, 2000);
            },
          },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: QUEUE_NOTIFICATION },
      { name: QUEUE_REMINDER },
      { name: QUEUE_CAMPAIGN }
    ),
  ],
  providers: [
    QueueService,
    NotificationProcessor,
    ReminderProcessor,
    CampaignProcessor,
  ],
  exports: [QueueService, BullModule],
})
export class QueueModule {}
