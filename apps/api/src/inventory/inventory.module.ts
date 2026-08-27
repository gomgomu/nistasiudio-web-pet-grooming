import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InventoryAlertsService } from './inventory-alerts.service';
import { InventoryAlertsController } from './inventory-alerts.controller';
import { InventoryCostService } from './inventory-cost.service';
import { InventoryCostController } from './inventory-cost.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    ProductsController,
    InventoryController,
    InventoryAlertsController,
    InventoryCostController,
  ],
  providers: [
    ProductsService,
    InventoryService,
    InventoryAlertsService,
    InventoryCostService,
  ],
  exports: [
    ProductsService,
    InventoryService,
    InventoryAlertsService,
    InventoryCostService,
  ],
})
export class InventoryModule {}
