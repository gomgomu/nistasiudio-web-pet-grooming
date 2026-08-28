import { Module } from '@nestjs/common';
import { ObservabilityService } from './observability.service';
import { ObservabilityController } from './observability.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../notifications/queues/queue.module';

@Module({
  imports: [PrismaModule, QueueModule],
  controllers: [ObservabilityController],
  providers: [ObservabilityService],
  exports: [ObservabilityService],
})
export class ObservabilityModule {}
