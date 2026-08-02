import { Module } from '@nestjs/common';
import { KitchenService } from './kitchen.service';
import { KitchenController } from './kitchen.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KitchenOrderEntity } from 'src/core/entities/kitchen-order.entity';
import { OrderEntity } from 'src/core/entities/order.entity';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    OrdersModule,
    TypeOrmModule.forFeature([KitchenOrderEntity, OrderEntity]),
  ],
  providers: [KitchenService],
  controllers: [KitchenController],
})
export class KitchenModule {}
