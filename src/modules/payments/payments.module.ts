import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentEntity } from 'src/core/entities/payment.entity';
import { AuthModule } from '../auth/auth.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([PaymentEntity])],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
