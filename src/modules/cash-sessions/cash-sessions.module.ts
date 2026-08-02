import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashSessionEntity } from 'src/core/entities/cash-session.entity';
import { PaymentEntity } from 'src/core/entities/payment.entity';
import { AuthModule } from '../auth/auth.module';
import { CashSessionsController } from './cash-sessions.controller';
import { CashSessionsService } from './cash-sessions.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([CashSessionEntity, PaymentEntity])],
  controllers: [CashSessionsController],
  providers: [CashSessionsService],
})
export class CashSessionsModule {}
