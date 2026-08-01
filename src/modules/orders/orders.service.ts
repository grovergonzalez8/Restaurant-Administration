import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateOrderDto } from 'src/core/dtos/orders/create-order.dto';
import { UpdateOrderDto } from 'src/core/dtos/orders/update-order-status.dto';
import { MenuItemEntity } from 'src/core/entities/menu-item.entity';
import { OrderItemEntity } from 'src/core/entities/order-item.entity';
import { OrderEntity } from 'src/core/entities/order.entity';
import { TableEntity } from 'src/core/entities/table.entity';
import { KitchenOrderEntity } from 'src/core/entities/kitchen-order.entity';
import { UserEntity } from 'src/core/entities/user.entity';
import { KitchenStatus } from 'src/core/enums/kitchen-status.enum';
import { OrderStatus } from 'src/core/enums/order-status.enum';
import { TableStatus } from 'src/core/enums/table-status.enum';
import { MenuStatus } from 'src/core/enums/menu-status.enum';
import { Repository } from 'typeorm';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(OrderEntity) private ordersRepo: Repository<OrderEntity>,
        @InjectRepository(OrderItemEntity) private orderItemsRepo: Repository<OrderItemEntity>,
        @InjectRepository(MenuItemEntity) private menuRepo: Repository<MenuItemEntity>,
        @InjectRepository(TableEntity) private tablesRepo: Repository<TableEntity>,
        @InjectRepository(KitchenOrderEntity) private kitchenRepo: Repository<KitchenOrderEntity>,
    ) {}

    findAll(): Promise<OrderEntity[]> {
        return this.ordersRepo.find();
    }

    findMine(userId: string): Promise<OrderEntity[]> {
        return this.ordersRepo.find({ where: { createdBy: { id: userId } } });
    }

    async findOne(id: string): Promise<OrderEntity> {
        const order = await this.ordersRepo.findOne({ where: { id } });
        if (!order) {
            throw new NotFoundException('Orden no encontrada');
        }
        return order;
    }

    async create(dto: CreateOrderDto, createdBy?: UserEntity): Promise<OrderEntity> {
        const table = await this.tablesRepo.findOne({ where: { id: dto.tableId } });
        if (!table) {
            throw new NotFoundException('Mesa no encontrada');
        }
        if (table.status === TableStatus.OUT_OF_SERVICE || table.status === TableStatus.OCCUPIED) {
            throw new ConflictException('La mesa no está disponible para una nueva orden');
        }

        const order = new OrderEntity();
        order.table = table;
        order.createdBy = createdBy;
        if (dto.status) {
            order.status = dto.status;
        }
        order.items = [];

        let total = 0;

        for (const item of dto.items) {
            const product = await this.menuRepo.findOne({ where: { id: item.menuItemId } });
            if (!product) {
                throw new NotFoundException(`Producto ${item.menuItemId} no encontrado`);
            }
            if (product.status !== MenuStatus.AVAIBLE) {
                throw new ConflictException(`Producto ${product.name} no está disponible`);
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

        const savedOrder = await this.ordersRepo.save(order);
        table.status = TableStatus.OCCUPIED;
        await this.tablesRepo.save(table);
        await this.kitchenRepo.save(this.kitchenRepo.create({
            order: savedOrder,
            status: KitchenStatus.PENDING,
        }));
        return savedOrder;
    }

    async update(id: string, dto: UpdateOrderDto): Promise<OrderEntity> {
        const order = await this.findOne(id);

        order.status = dto.status;
        if ([OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(dto.status)) {
            order.table.status = TableStatus.FREE;
            await this.tablesRepo.save(order.table);
        }

        return this.ordersRepo.save(order);
    }

    async remove(id: string): Promise<void> {
        const order = await this.findOne(id);
        order.table.status = TableStatus.FREE;
        await this.tablesRepo.save(order.table);
        const result = await this.ordersRepo.delete(id);

        if(result.affected === 0) {
            throw new NotFoundException('Order no encontrada');
        }
    }
}
