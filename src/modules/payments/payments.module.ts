import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentEntity } from 'src/core/entities/payment.entity';
import { AuthModule } from '../auth/auth.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { CashSessionEntity } from 'src/core/entities/cash-session.entity';
import { OrderEntity } from 'src/core/entities/order.entity';
import { KitchenOrderEntity } from 'src/core/entities/kitchen-order.entity';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      PaymentEntity,
      CashSessionEntity,
      OrderEntity,
      KitchenOrderEntity,
    ]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
