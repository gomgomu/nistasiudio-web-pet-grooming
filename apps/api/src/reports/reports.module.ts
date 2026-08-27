import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { NoShowReportService } from './no-show-report.service';
import { OwnerDashboardService } from './owner-dashboard.service';
import { RevenueRecoveryService } from './revenue-recovery.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RetentionModule } from '../retention/retention.module';
import { LineModule } from '../line/line.module';

@Module({
  imports: [PrismaModule, RetentionModule, LineModule],
  controllers: [ReportsController],
  providers: [NoShowReportService, OwnerDashboardService, RevenueRecoveryService],
  exports: [NoShowReportService, OwnerDashboardService, RevenueRecoveryService],
})
export class ReportsModule {}


