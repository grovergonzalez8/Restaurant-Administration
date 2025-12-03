import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { KitchenService } from './kitchen.service';
import { CreateKitchenOrderDto } from 'src/core/dtos/kitchen/create-kitchen-order.dto';
import { UpdateKitchenStatusDto } from 'src/core/dtos/kitchen/update-kitchen-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('kitchen')
export class KitchenController {
    constructor(private readonly kitchenService: KitchenService) {}

    @Get()
    @Roles('kitchen', 'admin')
    findAll() {
        return this.kitchenService.findAll();
    }

    @Get(':id')
    @Roles('kitchen', 'admin')
    findOne(@Param('id') id: string) {
        return this.kitchenService.findOne(id);
    }


    @Post()
    @Roles('kitchen', 'admin')
    create(@Body() dto: CreateKitchenOrderDto) {
        return this.kitchenService.create(dto);
    }

    @Put(':id/status')
    @Roles('kitchen', 'admin')
    updateStatus(@Param('id') id: string, @Body() dto: UpdateKitchenStatusDto) {
        return this.kitchenService.updateStatus(id, dto);
    }

    @Delete(':id')
    @Roles('admin')
    remove(@Param('id') id: string) {
        return this.kitchenService.remove(id);
    }
}
