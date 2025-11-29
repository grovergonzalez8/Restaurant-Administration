import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto } from 'src/core/dtos/inventory/create-inventory-item.dto';
import { UpdateInventoryItemDto } from 'src/core/dtos/inventory/update-inventory-item.dto';
import { CreateInventoryEntryDto } from 'src/core/dtos/inventory/create-inventory-entry.dto';
import { CreateInvnetoryOutputDto } from 'src/core/dtos/inventory/create-inventory-output.dto';

@Controller('inventory')
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) {}

    @Get('items')
    findAllItems() {
        return this.inventoryService.findAllItems();
    }

    @Get('items/:id')
    findItem(@Param('id') id: string) {
        return this.inventoryService.findItem(id);
    }

    @Post('items')
    createItem(@Body() dto: CreateInventoryItemDto) {
        return this.inventoryService.createItem(dto);
    }

    @Put('items/:id')
    updateItem(@Param('id') id: string, @Body() dto: UpdateInventoryItemDto) {
        return this.inventoryService.updateItem(id, dto);
    }

    @Delete('items/:id')
    removeItem(@Param('id') id: string) {
        return this.inventoryService.removeItem(id);
    }

    @Post('entries')
    createEntry(@Body() dto: CreateInventoryEntryDto) {
        return this.inventoryService.createEntry(dto);
    }

    @Get('entries')
    findAllEntries() {
        return this.inventoryService.findAllEntries();
    }

    @Post('outputs')
    createOutput(@Body() dto: CreateInvnetoryOutputDto) {
        return this.inventoryService.createOutput(dto);
    }

    @Get('outputs')
    findAllOutputs() {
        return this.inventoryService.findAllOutputs();
    }
}
