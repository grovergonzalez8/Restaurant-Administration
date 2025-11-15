import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateOrderDto } from 'src/core/dtos/orders/create-order.dto';
import { UpdateOrderDto } from 'src/core/dtos/orders/update-order-status.dto';
import { MenuItemEntity } from 'src/core/entities/menu-item.entity';
import { OrderItemEntity } from 'src/core/entities/order-item.entity';
import { OrderEntity } from 'src/core/entities/order.entity';
import { TableEntity } from 'src/core/entities/table.entity';
import { Repository } from 'typeorm';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(OrderEntity) private ordersRepo: Repository<OrderEntity>,
        @InjectRepository(OrderItemEntity) private orderItemsRepo: Repository<OrderItemEntity>,
        @InjectRepository(MenuItemEntity) private menuRepo: Repository<MenuItemEntity>,
        @InjectRepository(TableEntity) private tablesRepo: Repository<TableEntity>
    ) {}

    findAll(): Promise<OrderEntity[]> {
        return this.ordersRepo.find();
    }

    async findOne(id: string): Promise<OrderEntity> {
        const order = await this.ordersRepo.findOne({ where: { id } });
        if (!order) {
            throw new NotFoundException('Orden no encontrada');
        }
        return order;
    }

    async create(dto: CreateOrderDto): Promise<OrderEntity> {
        const table = await this.tablesRepo.findOne({ where: { id: dto.tableId } });
        if (!table) {
            throw new NotFoundException('Mesa no encontrada');
        }

        const order = new OrderEntity();
        order.table = table;
        order.status = dto.status;
        order.items = [];

        let total = 0;

        for (const item of dto.items) {
            const product = await this.menuRepo.findOne({ where: { id: item.menuItemId } });
            if (!product) {
                throw new NotFoundException(`Producto ${item.menuItemId} no encontrado`);
            }

            const orderItem = new OrderItemEntity();
            orderItem.menuItem = product;
            orderItem.quantity = item.quantity;
            orderItem.unitPrice = product.price;
            orderItem.subtotal = product.price * item.quantity;

            total += orderItem.subtotal;

            order.items.push(orderItem);
        }

        order.total = total;

        return this.ordersRepo.save(order);
    }

    async update(id: string, dto: UpdateOrderDto): Promise<OrderEntity> {
        const order = await this.findOne(id);

        Object.assign(order, dto);

        return this.ordersRepo.save(order);
    }

    async remove(id: string): Promise<void> {
        const result = await this.ordersRepo.delete(id);

        if(result.affected === 0) {
            throw new NotFoundException('Order no encontrada');
        }
    }
}
