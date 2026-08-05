import { Module } from '@nestjs/common';
import { TablesController } from './tables.controller';
import { TablesService } from './tables.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TableEntity } from 'src/core/entities/table.entity';
import { ReservationEntity } from 'src/core/entities/reservation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TableEntity, ReservationEntity])],
  controllers: [TablesController],
  providers: [TablesService],
})
export class TablesModule {}
