import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateInventoryEntryDto } from 'src/core/dtos/inventory/create-inventory-entry.dto';
import { CreateInventoryItemDto } from 'src/core/dtos/inventory/create-inventory-item.dto';
import { CreateInvnetoryOutputDto } from 'src/core/dtos/inventory/create-inventory-output.dto';
import { UpdateInventoryItemDto } from 'src/core/dtos/inventory/update-inventory-item.dto';
import { InventoryEntryEntity } from 'src/core/entities/inventory-entry.entity';
import { InventoryItemEntity } from 'src/core/entities/inventory-item.entity';
import { InventoryOutputEntity } from 'src/core/entities/inventory-output.entity';
import { Repository } from 'typeorm';

@Injectable()
export class InventoryService {
    constructor(
        @InjectRepository(InventoryItemEntity)
        private readonly itemRepository: Repository<InventoryItemEntity>,
        @InjectRepository(InventoryEntryEntity)
        private readonly entryRepository: Repository<InventoryEntryEntity>,
        @InjectRepository(InventoryOutputEntity)
        private readonly outputRepository: Repository<InventoryOutputEntity>
    ) { }

    findAllItems() {
        return this.itemRepository.find();    
    }

    async findItem(id: string) {
        const item = await this.itemRepository.findOne({ where: { id } });
        if (!item) {
            throw new NotFoundException('Item no encontrado');
        }
        return item;
    }

    createItem(dto: CreateInventoryItemDto) {
        const newItem = this.itemRepository.create(dto);
        return this.itemRepository.save(newItem);
    }

    async updateItem(id: string, dto: UpdateInventoryItemDto) {
        const item = await this.findItem(id);
        Object.assign(item, dto);
        return this.itemRepository.save(item);
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
        const item = await this.findItem(dto.itemId);
        const entry = this.entryRepository.create({
            item,
            quantity: dto.quantity,
            note: dto.note
        });
        item.quantity += dto.quantity;
        await this.itemRepository.save(item);
        return this.entryRepository.save(entry);
    }

    findAllOutputs() {
        return this.outputRepository.find();
    }

    async createOutput(dto: CreateInvnetoryOutputDto) {
        const item = await this.findItem(dto.itemId);
        if (item.quantity < dto.quantity) {
            throw new NotFoundException('Stock insuficiente en inventario');
        }
        const output = this.outputRepository.create({
            item,
            quantity: dto.quantity,
            note: dto.note
        });
        item.quantity -= dto.quantity;
        await this.itemRepository.save(item);
        return this.outputRepository.save(output);
    }
}