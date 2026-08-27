import { Module } from '@nestjs/common';
import { UsageMeteringController } from './usage-metering.controller';
import { UsageMeteringService } from './usage-metering.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [PrismaModule, SubscriptionsModule],
  controllers: [UsageMeteringController],
  providers: [UsageMeteringService],
  exports: [UsageMeteringService],
})
export class UsageMeteringModule {}
