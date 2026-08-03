import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from 'src/core/dtos/orders/create-order.dto';
import { UpdateOrderDto } from 'src/core/dtos/orders/update-order-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserEntity } from 'src/core/entities/user.entity';
import { AddOrderItemDto } from 'src/core/dtos/orders/add-order-item.dto';
import { UpdateOrderItemDto } from 'src/core/dtos/orders/update-order-item.dto';

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
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: { user: UserEntity },
  ) {
    return this.ordersService.findOne(id, request.user);
  }

  @Post()
  @Roles('admin', 'waiter')
  create(@Body() dto: CreateOrderDto, @Req() request: { user: UserEntity }) {
    return this.ordersService.create(dto, request.user);
  }

  @Put(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.ordersService.update(id, dto);
  }

  @Post(':id/items')
  @Roles('admin', 'waiter')
  addItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddOrderItemDto,
    @Req() request: { user: UserEntity },
  ) {
    return this.ordersService.addItem(id, dto, request.user);
  }

  @Put(':id/items/:itemId')
  @Roles('admin', 'waiter')
  updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateOrderItemDto,
    @Req() request: { user: UserEntity },
  ) {
    return this.ordersService.updateItem(id, itemId, dto, request.user);
  }

  @Delete(':id/items/:itemId')
  @Roles('admin', 'waiter')
  removeItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Req() request: { user: UserEntity },
  ) {
    return this.ordersService.removeItem(id, itemId, request.user);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}
