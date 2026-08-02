import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from 'src/core/entities/order.entity';
import { OrderItemEntity } from 'src/core/entities/order-item.entity';
import { MenuItemEntity } from 'src/core/entities/menu-item.entity';
import { TableEntity } from 'src/core/entities/table.entity';
import { KitchenOrderEntity } from 'src/core/entities/kitchen-order.entity';
import { InventoryItemEntity } from 'src/core/entities/inventory-item.entity';
import { InventoryOutputEntity } from 'src/core/entities/inventory-output.entity';
import { InventoryEntryEntity } from 'src/core/entities/inventory-entry.entity';
import { RecipeItemEntity } from 'src/core/entities/recipe-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderEntity,
      OrderItemEntity,
      MenuItemEntity,
      TableEntity,
      KitchenOrderEntity,
      RecipeItemEntity,
      InventoryItemEntity,
      InventoryOutputEntity,
      InventoryEntryEntity,
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
