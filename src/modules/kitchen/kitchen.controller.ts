import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { KitchenService } from './kitchen.service';
import { CreateKitchenOrderDto } from 'src/core/dtos/kitchen/create-kitchen-order.dto';
import { UpdateKitchenStatusDto } from 'src/core/dtos/kitchen/update-kitchen-order.dto';

@Controller('kitchen')
export class KitchenController {
    constructor(private readonly kitchenService: KitchenService) {}

    @Post()
    create(@Body() dto: CreateKitchenOrderDto) {
        return this.kitchenService.create(dto);
    }

    @Get()
    findAll() {
        return this.kitchenService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.kitchenService.findOne(id);
    }

    @Put(':id/status')
    updateStatus(@Param('id') id: string, @Body() dto: UpdateKitchenStatusDto) {
        return this.kitchenService.updateStatus(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.kitchenService.remove(id);
    }
}
