import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [PrismaModule],
  controllers: [InvoicesController, PaymentsController],
  providers: [InvoicesService, PaymentsService],
  exports: [InvoicesService, PaymentsService],
})
export class PosModule {}
