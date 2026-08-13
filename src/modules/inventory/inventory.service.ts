import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateInventoryEntryDto } from 'src/core/dtos/inventory/create-inventory-entry.dto';
import { CreateInventoryItemDto } from 'src/core/dtos/inventory/create-inventory-item.dto';
import { CreateInvnetoryOutputDto } from 'src/core/dtos/inventory/create-inventory-output.dto';
import { UpdateInventoryItemDto } from 'src/core/dtos/inventory/update-inventory-item.dto';
import { InventoryEntryEntity } from 'src/core/entities/inventory-entry.entity';
import { InventoryItemEntity } from 'src/core/entities/inventory-item.entity';
import { InventoryOutputEntity } from 'src/core/entities/inventory-output.entity';
import { InventoryOutputReason } from 'src/core/enums/inventory-output-reason.enum';
import { DataSource, Repository } from 'typeorm';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryItemEntity)
    private readonly itemRepository: Repository<InventoryItemEntity>,
    @InjectRepository(InventoryEntryEntity)
    private readonly entryRepository: Repository<InventoryEntryEntity>,
    @InjectRepository(InventoryOutputEntity)
    private readonly outputRepository: Repository<InventoryOutputEntity>,
    private readonly dataSource: DataSource,
    private readonly realtime: RealtimeGateway,
  ) {}

  findAllItems() {
    return this.itemRepository.find();
  }

  async findLowStock() {
    const items = await this.itemRepository.find();
    return items.filter(
      (item) => Number(item.quantity) <= Number(item.minStock),
    );
  }

  async findItem(id: string) {
    const item = await this.itemRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('Item no encontrado');
    }
    return item;
  }

  async createItem(dto: CreateInventoryItemDto) {
    const result = await this.dataSource.transaction(async (manager) => {
      const items = manager.getRepository(InventoryItemEntity);
      const entries = manager.getRepository(InventoryEntryEntity);
      const item = await items.save(items.create(dto));
      const entry =
        dto.quantity > 0
          ? await entries.save(
              entries.create({
                item,
                quantity: dto.quantity,
                note: 'Stock inicial',
              }),
            )
          : null;
      return { item, entry };
    });
    if (result.entry) this.realtime.emit('inventory.entry', result.entry);
    this.realtime.emit('inventory.created', result.item);
    return result.item;
  }

  async updateItem(id: string, dto: UpdateInventoryItemDto) {
    const result = await this.dataSource.transaction(async (manager) => {
      const items = manager.getRepository(InventoryItemEntity);
      const entries = manager.getRepository(InventoryEntryEntity);
      const outputs = manager.getRepository(InventoryOutputEntity);
      const item = await items.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!item) throw new NotFoundException('Item no encontrado');
      const previousQuantity = Number(item.quantity);
      const { quantity, ...details } = dto;
      Object.assign(item, details);
      let event: 'inventory.entry' | 'inventory.output' | null = null;
      let movement: InventoryEntryEntity | InventoryOutputEntity | null = null;
      if (quantity !== undefined && quantity !== previousQuantity) {
        const difference = quantity - previousQuantity;
        item.quantity = quantity;
        if (difference > 0) {
          event = 'inventory.entry';
          movement = await entries.save(
            entries.create({
              item,
              quantity: difference,
              note: 'Ajuste manual de inventario',
            }),
          );
        } else {
          event = 'inventory.output';
          movement = await outputs.save(
            outputs.create({
              item,
              quantity: Math.abs(difference),
              reason: InventoryOutputReason.ADJUSTMENT,
              note: 'Ajuste manual de inventario',
            }),
          );
        }
      }
      return { item: await items.save(item), event, movement };
    });
    if (result.event && result.movement) {
      this.realtime.emit(result.event, result.movement);
    }
    this.realtime.emit('inventory.updated', result.item);
    return result.item;
  }

  async removeItem(id: string) {
    const result = await this.itemRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Item no encontrado');
    }
  }

  findAllEntries() {
    return this.entryRepository.find();
  }

  async createEntry(dto: CreateInventoryEntryDto) {
    const entry = await this.dataSource.transaction(async (manager) => {
      const items = manager.getRepository(InventoryItemEntity);
      const item = await items.findOne({
        where: { id: dto.itemId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!item) throw new NotFoundException('Item no encontrado');
      item.quantity = Number(item.quantity) + dto.quantity;
      await items.save(item);
      return manager.save(
        InventoryEntryEntity,
        manager.create(InventoryEntryEntity, {
          item,
          quantity: dto.quantity,
          note: dto.note,
        }),
      );
    });
    this.realtime.emit('inventory.entry', entry);
    return entry;
  }

  findAllOutputs() {
    return this.outputRepository.find();
  }

  async createOutput(dto: CreateInvnetoryOutputDto) {
    const output = await this.dataSource.transaction(async (manager) => {
      const items = manager.getRepository(InventoryItemEntity);
      const item = await items.findOne({
        where: { id: dto.itemId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!item) throw new NotFoundException('Item no encontrado');
      if (Number(item.quantity) < dto.quantity) {
        throw new BadRequestException('Stock insuficiente en inventario');
      }
      item.quantity = Number(item.quantity) - dto.quantity;
      await items.save(item);
      return manager.save(
        InventoryOutputEntity,
        manager.create(InventoryOutputEntity, {
          item,
          quantity: dto.quantity,
          reason: dto.reason,
          note: dto.note,
        }),
      );
    });
    this.realtime.emit('inventory.output', output);
    return output;
  }
}
