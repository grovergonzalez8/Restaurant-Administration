import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryItemEntity } from 'src/core/entities/inventory-item.entity';
import { KitchenOrderEntity } from 'src/core/entities/kitchen-order.entity';
import { MenuItemEntity } from 'src/core/entities/menu-item.entity';
import { OrderEntity } from 'src/core/entities/order.entity';
import { TableEntity } from 'src/core/entities/table.entity';
import { PaymentEntity } from 'src/core/entities/payment.entity';
import { ReservationEntity } from 'src/core/entities/reservation.entity';
import { CashSessionEntity } from 'src/core/entities/cash-session.entity';
import { AuthModule } from '../auth/auth.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([TableEntity, OrderEntity, KitchenOrderEntity, MenuItemEntity, InventoryItemEntity, PaymentEntity, ReservationEntity, CashSessionEntity]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
