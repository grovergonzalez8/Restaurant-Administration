import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from 'src/core/dtos/orders/create-order.dto';
import { UpdateOrderDto } from 'src/core/dtos/orders/update-order-status.dto';

@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @Get()
    findAll() {
        return this.ordersService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.ordersService.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateOrderDto) {
        return this.ordersService.create(dto);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
        return this.ordersService.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.ordersService.remove(id);
    }
}
