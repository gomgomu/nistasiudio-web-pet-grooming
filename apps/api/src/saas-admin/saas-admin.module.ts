import { Module } from '@nestjs/common';
import { SaaSAdminController } from './saas-admin.controller';
import { SaaSAdminService } from './saas-admin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [PrismaModule, SubscriptionsModule],
  controllers: [SaaSAdminController],
  providers: [SaaSAdminService],
  exports: [SaaSAdminService],
})
export class SaaSAdminModule {}
