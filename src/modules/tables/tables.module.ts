import { Module } from '@nestjs/common';
import { TablesController } from './tables.controller';
import { TablesService } from './tables.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TableEntity } from 'src/core/entities/table.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TableEntity])
  ],
  controllers: [TablesController],
  providers: [TablesService]
})
export class TablesModule {}
