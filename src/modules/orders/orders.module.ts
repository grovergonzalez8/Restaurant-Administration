import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from 'src/core/entities/order.entity';
import { OrderItemEntity } from 'src/core/entities/order-item.entity';
import { MenuItemEntity } from 'src/core/entities/menu-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderEntity, OrderItemEntity, MenuItemEntity])
  ],
  controllers: [OrdersController],
  providers: [OrdersService]
})
export class OrdersModule {}
