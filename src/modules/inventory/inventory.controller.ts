import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto } from 'src/core/dtos/inventory/create-inventory-item.dto';
import { UpdateInventoryItemDto } from 'src/core/dtos/inventory/update-inventory-item.dto';
import { CreateInventoryEntryDto } from 'src/core/dtos/inventory/create-inventory-entry.dto';
import { CreateInvnetoryOutputDto } from 'src/core/dtos/inventory/create-inventory-output.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserEntity } from 'src/core/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('items')
  @Roles('admin', 'kitchen')
  findAllItems() {
    return this.inventoryService.findAllItems();
  }

  @Get('low-stock')
  @Roles('admin', 'kitchen')
  findLowStock() {
    return this.inventoryService.findLowStock();
  }

  @Get('items/:id')
  @Roles('admin', 'kitchen')
  findItem(@Param('id') id: string) {
    return this.inventoryService.findItem(id);
  }

  @Post('items')
  @Roles('admin')
  createItem(
    @Body() dto: CreateInventoryItemDto,
    @Req() request: { user: UserEntity },
  ) {
    return this.inventoryService.createItem(dto, request.user);
  }

  @Put('items/:id')
  @Roles('admin')
  updateItem(
    @Param('id') id: string,
    @Body() dto: UpdateInventoryItemDto,
    @Req() request: { user: UserEntity },
  ) {
    return this.inventoryService.updateItem(id, dto, request.user);
  }

  @Delete('items/:id')
  @Roles('admin')
  removeItem(@Param('id') id: string) {
    return this.inventoryService.removeItem(id);
  }

  @Post('entries')
  @Roles('admin')
  createEntry(
    @Body() dto: CreateInventoryEntryDto,
    @Req() request: { user: UserEntity },
  ) {
    return this.inventoryService.createEntry(dto, request.user);
  }

  @Get('entries')
  @Roles('admin', 'kitchen')
  findAllEntries() {
    return this.inventoryService.findAllEntries();
  }

  @Post('outputs')
  @Roles('admin', 'kitchen')
  createOutput(
    @Body() dto: CreateInvnetoryOutputDto,
    @Req() request: { user: UserEntity },
  ) {
    return this.inventoryService.createOutput(dto, request.user);
  }

  @Get('outputs')
  @Roles('admin', 'kitchen')
  findAllOutputs() {
    return this.inventoryService.findAllOutputs();
  }
}
