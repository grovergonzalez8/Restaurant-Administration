import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryEntryEntity } from 'src/core/entities/inventory-entry.entity';
import { InventoryOutputEntity } from 'src/core/entities/inventory-output.entity';
import { OrderItemEntity } from 'src/core/entities/order-item.entity';
import { PaymentEntity } from 'src/core/entities/payment.entity';
import { AuthModule } from '../auth/auth.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([PaymentEntity, OrderItemEntity, InventoryEntryEntity, InventoryOutputEntity])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
