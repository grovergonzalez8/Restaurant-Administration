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
import { InventoryItemEntity } from 'src/core/entities/inventory-item.entity';
import { InventoryOutputEntity } from 'src/core/entities/inventory-output.entity';
import { InventoryEntryEntity } from 'src/core/entities/inventory-entry.entity';
import { RecipeItemEntity } from 'src/core/entities/recipe-item.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(OrderEntity) private ordersRepo: Repository<OrderEntity>,
        @InjectRepository(MenuItemEntity) private menuRepo: Repository<MenuItemEntity>,
        @InjectRepository(TableEntity) private tablesRepo: Repository<TableEntity>,
        @InjectRepository(KitchenOrderEntity) private kitchenRepo: Repository<KitchenOrderEntity>,
        private readonly dataSource: DataSource,
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
        return this.dataSource.transaction(async (manager) => {
            const tables = manager.getRepository(TableEntity);
            const menu = manager.getRepository(MenuItemEntity);
            const recipes = manager.getRepository(RecipeItemEntity);
            const inventory = manager.getRepository(InventoryItemEntity);
            const outputs = manager.getRepository(InventoryOutputEntity);
            const table = await tables.findOne({ where: { id: dto.tableId }, lock: { mode: 'pessimistic_write' } });
            if (!table) throw new NotFoundException('Mesa no encontrada');
            if ([TableStatus.OUT_OF_SERVICE, TableStatus.OCCUPIED].includes(table.status)) {
                throw new ConflictException('La mesa no está disponible para una nueva orden');
            }

            const order = manager.create(OrderEntity, { table, createdBy, items: [] });
            if (dto.status) order.status = dto.status;
            const consumption = new Map<string, number>();

            for (const item of dto.items) {
                const product = await menu.findOne({ where: { id: item.menuItemId } });
                if (!product) throw new NotFoundException(`Producto ${item.menuItemId} no encontrado`);
                if (product.status !== MenuStatus.AVAIBLE) throw new ConflictException(`Producto ${product.name} no está disponible`);
                const orderItem = manager.create(OrderItemEntity, {
                    menuItem: product,
                    quantity: item.quantity,
                    unitPrice: product.price,
                    subtotal: Number(product.price) * item.quantity,
                });
                order.items.push(orderItem);
                const ingredients = await recipes.find({ where: { menuItem: { id: product.id } } });
                for (const ingredient of ingredients) {
                    const required = Number(ingredient.quantity) * item.quantity;
                    consumption.set(ingredient.inventoryItem.id, (consumption.get(ingredient.inventoryItem.id) ?? 0) + required);
                }
            }

            for (const [itemId, required] of consumption) {
                const stockItem = await inventory.findOne({ where: { id: itemId }, lock: { mode: 'pessimistic_write' } });
                if (!stockItem || Number(stockItem.quantity) < required) {
                    throw new ConflictException('Stock insuficiente para preparar la orden');
                }
                stockItem.quantity = Number(stockItem.quantity) - required;
                await inventory.save(stockItem);
                await outputs.save(outputs.create({ item: stockItem, quantity: required, note: 'Salida automática por orden' }));
            }

            order.total = order.items.reduce((total, item) => total + Number(item.subtotal), 0);
            const savedOrder = await manager.save(OrderEntity, order);
            table.status = TableStatus.OCCUPIED;
            await tables.save(table);
            await manager.save(KitchenOrderEntity, manager.create(KitchenOrderEntity, { order: savedOrder, status: KitchenStatus.PENDING }));
            return savedOrder;
        });
    }

    private async restoreInventory(manager: EntityManager, order: OrderEntity, note: string) {
        const recipes = manager.getRepository(RecipeItemEntity);
        const inventory = manager.getRepository(InventoryItemEntity);
        const entries = manager.getRepository(InventoryEntryEntity);
        const restoration = new Map<string, number>();
        for (const orderItem of order.items) {
            const ingredients = await recipes.find({ where: { menuItem: { id: orderItem.menuItem.id } } });
            for (const ingredient of ingredients) {
                const amount = Number(ingredient.quantity) * orderItem.quantity;
                restoration.set(ingredient.inventoryItem.id, (restoration.get(ingredient.inventoryItem.id) ?? 0) + amount);
            }
        }
        for (const [itemId, amount] of restoration) {
            const item = await inventory.findOne({ where: { id: itemId }, lock: { mode: 'pessimistic_write' } });
            if (!item) continue;
            item.quantity = Number(item.quantity) + amount;
            await inventory.save(item);
            await entries.save(entries.create({ item, quantity: amount, note }));
        }
    }

    private async findLockedOrder(manager: EntityManager, id: string) {
        const orders = manager.getRepository(OrderEntity);
        const locked = await orders.findOne({
            where: { id },
            lock: { mode: 'pessimistic_write' },
            loadEagerRelations: false,
        });
        if (!locked) throw new NotFoundException('Orden no encontrada');
        return orders.findOneOrFail({
            where: { id },
            relations: { table: true, items: { menuItem: true } },
            loadEagerRelations: false,
        });
    }

    async update(id: string, dto: UpdateOrderDto): Promise<OrderEntity> {
        return this.dataSource.transaction(async (manager) => {
            const tables = manager.getRepository(TableEntity);
            const orders = manager.getRepository(OrderEntity);
            const order = await this.findLockedOrder(manager, id);
            if (dto.status === OrderStatus.CANCELLED && order.status !== OrderStatus.CANCELLED) {
                await this.restoreInventory(manager, order, `Reposición por cancelación de orden ${order.id}`);
            }
            order.status = dto.status;
            if ([OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(dto.status)) {
                order.table.status = TableStatus.FREE;
                await tables.save(order.table);
            }
            return orders.save(order);
        });
    }

    async remove(id: string): Promise<void> {
        await this.dataSource.transaction(async (manager) => {
            const tables = manager.getRepository(TableEntity);
            const orders = manager.getRepository(OrderEntity);
            const order = await this.findLockedOrder(manager, id);
            if (order.status === OrderStatus.COMPLETED) throw new ConflictException('No se puede eliminar una orden cobrada');
            if (order.status !== OrderStatus.CANCELLED) {
                await this.restoreInventory(manager, order, `Reposición por eliminación de orden ${order.id}`);
            }
            order.table.status = TableStatus.FREE;
            await tables.save(order.table);
            await orders.delete(id);
        });
    }
}
