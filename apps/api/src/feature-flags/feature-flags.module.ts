import { Module } from '@nestjs/common';
import { FeatureFlagsController } from './feature-flags.controller';
import { FeatureFlagsService } from './feature-flags.service';
import { FeatureFlagsGuard } from './guards/feature-flags.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [PrismaModule, SubscriptionsModule],
  controllers: [FeatureFlagsController],
  providers: [FeatureFlagsService, FeatureFlagsGuard],
  exports: [FeatureFlagsService, FeatureFlagsGuard],
})
export class FeatureFlagsModule {}
