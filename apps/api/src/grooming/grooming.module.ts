import { Module } from '@nestjs/common';
import { GroomingProfileController } from './grooming-profile.controller';
import { GroomingProfileService } from './grooming-profile.service';
import { GroomingQueueController } from './grooming-queue.controller';
import { GroomingQueueService } from './grooming-queue.service';
import { GroomingNotificationService } from './grooming-notification.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ServicesModule } from '../services/services.module';
import { LineModule } from '../line/line.module';

@Module({
  imports: [PrismaModule, ServicesModule, LineModule],
  controllers: [GroomingProfileController, GroomingQueueController],
  providers: [
    GroomingProfileService,
    GroomingQueueService,
    GroomingNotificationService,
  ],
  exports: [
    GroomingProfileService,
    GroomingQueueService,
    GroomingNotificationService,
  ],
})
export class GroomingModule {}
