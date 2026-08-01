import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from 'src/core/dtos/orders/create-order.dto';
import { UpdateOrderDto } from 'src/core/dtos/orders/update-order-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserEntity } from 'src/core/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @Get()
    @Roles('admin', 'kitchen')
    findAll() {
        return this.ordersService.findAll();
    }

    @Get('my')
    @Roles('waiter')
    findMine(@Req() request: { user: UserEntity }) {
        return this.ordersService.findMine(request.user.id);
    }

    @Get(':id')
    @Roles('admin', 'kitchen', 'waiter')
    findOne(@Param('id') id: string) {
        return this.ordersService.findOne(id);
    }

    @Post()
    @Roles('admin', 'waiter')
    create(@Body() dto: CreateOrderDto, @Req() request: { user: UserEntity }) {
        return this.ordersService.create(dto, request.user);
    }

    @Put(':id')
    @Roles('admin', 'kitchen')
    update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
        return this.ordersService.update(id, dto);
    }

    @Delete(':id')
    @Roles('admin')
    remove(@Param('id') id: string) {
        return this.ordersService.remove(id);
    }
}
