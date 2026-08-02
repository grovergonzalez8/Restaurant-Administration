import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationEntity } from 'src/core/entities/reservation.entity';
import { TableEntity } from 'src/core/entities/table.entity';
import { AuthModule } from '../auth/auth.module';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([ReservationEntity, TableEntity])],
  controllers: [ReservationsController],
  providers: [ReservationsService],
})
export class ReservationsModule {}
