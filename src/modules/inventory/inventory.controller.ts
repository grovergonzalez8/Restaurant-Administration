import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto } from 'src/core/dtos/inventory/create-inventory-item.dto';
import { UpdateInventoryItemDto } from 'src/core/dtos/inventory/update-inventory-item.dto';
import { CreateInventoryEntryDto } from 'src/core/dtos/inventory/create-inventory-entry.dto';
import { CreateInvnetoryOutputDto } from 'src/core/dtos/inventory/create-inventory-output.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) {}

    @Get('items')
    @Roles('admin', 'kitchen')
    findAllItems() {
        return this.inventoryService.findAllItems();
    }

    @Get('items/:id')
    @Roles('admin', 'kitchen')
    findItem(@Param('id') id: string) {
        return this.inventoryService.findItem(id);
    }

    @Post('items')
    @Roles('admin')
    createItem(@Body() dto: CreateInventoryItemDto) {
        return this.inventoryService.createItem(dto);
    }

    @Put('items/:id')
    @Roles('admin')
    updateItem(@Param('id') id: string, @Body() dto: UpdateInventoryItemDto) {
        return this.inventoryService.updateItem(id, dto);
    }

    @Delete('items/:id')
    @Roles('admin')
    removeItem(@Param('id') id: string) {
        return this.inventoryService.removeItem(id);
    }

    @Post('entries')
    @Roles('admin')
    createEntry(@Body() dto: CreateInventoryEntryDto) {
        return this.inventoryService.createEntry(dto);
    }

    @Get('entries')
    @Roles('admin', 'kitchen')
    findAllEntries() {
        return this.inventoryService.findAllEntries();
    }

    @Post('outputs')
    @Roles('admin', 'kitchen')
    createOutput(@Body() dto: CreateInvnetoryOutputDto) {
        return this.inventoryService.createOutput(dto);
    }

    @Get('outputs')
    @Roles('admin', 'kitchen')
    findAllOutputs() {
        return this.inventoryService.findAllOutputs();
    }
}
