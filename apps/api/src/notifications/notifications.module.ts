import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { QueueModule } from './queues/queue.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [PrismaModule, QueueModule, EmailModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService, QueueModule, EmailModule],
})
export class NotificationsModule {}
