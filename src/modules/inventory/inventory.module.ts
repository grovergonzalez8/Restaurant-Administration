import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryItemEntity } from 'src/core/entities/inventory-item.entity';
import { InventoryEntryEntity } from 'src/core/entities/inventory-entry.entity';
import { InventoryOutputEntity } from 'src/core/entities/inventory-output.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryItemEntity, InventoryEntryEntity, InventoryOutputEntity])],
  providers: [InventoryService],
  controllers: [InventoryController]
})
export class InventoryModule {}
