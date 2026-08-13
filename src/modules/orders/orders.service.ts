import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { InventoryOutputReason } from 'src/core/enums/inventory-output-reason.enum';
import { InventoryEntryEntity } from 'src/core/entities/inventory-entry.entity';
import { RecipeItemEntity } from 'src/core/entities/recipe-item.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { AddOrderItemDto } from 'src/core/dtos/orders/add-order-item.dto';
import { UpdateOrderItemDto } from 'src/core/dtos/orders/update-order-item.dto';
import { ReservationEntity } from 'src/core/entities/reservation.entity';
import { ReservationStatus } from 'src/core/enums/reservation-status.enum';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity) private ordersRepo: Repository<OrderEntity>,
    @InjectRepository(MenuItemEntity)
    private menuRepo: Repository<MenuItemEntity>,
    @InjectRepository(TableEntity) private tablesRepo: Repository<TableEntity>,
    @InjectRepository(KitchenOrderEntity)
    private kitchenRepo: Repository<KitchenOrderEntity>,
    private readonly dataSource: DataSource,
    private readonly realtime: RealtimeGateway,
  ) {}

  findAll(): Promise<OrderEntity[]> {
    return this.ordersRepo.find();
  }

  findMine(userId: string): Promise<OrderEntity[]> {
    return this.ordersRepo.find({
      where: { createdBy: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, actor: UserEntity): Promise<OrderEntity> {
    const order = await this.ordersRepo.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }
    if (
      !['admin', 'kitchen'].includes(actor.role?.name) &&
      order.createdBy?.id !== actor.id
    ) {
      throw new ForbiddenException('No puedes consultar esta orden');
    }
    return order;
  }

  async create(
    dto: CreateOrderDto,
    createdBy?: UserEntity,
  ): Promise<OrderEntity> {
    const savedOrder = await this.dataSource.transaction(async (manager) => {
      const tables = manager.getRepository(TableEntity);
      const menu = manager.getRepository(MenuItemEntity);
      const recipes = manager.getRepository(RecipeItemEntity);
      const inventory = manager.getRepository(InventoryItemEntity);
      const outputs = manager.getRepository(InventoryOutputEntity);
      const table = await tables.findOne({
        where: { id: dto.tableId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!table) throw new NotFoundException('Mesa no encontrada');
      if (
        [TableStatus.OUT_OF_SERVICE, TableStatus.OCCUPIED].includes(
          table.status,
        )
      ) {
        throw new ConflictException(
          'La mesa no está disponible para una nueva orden',
        );
      }

      const reservations = dto.reservationId
        ? manager.getRepository(ReservationEntity)
        : null;
      const reservation = reservations
        ? await reservations.findOne({
            where: { id: dto.reservationId, table: { id: table.id } },
            lock: { mode: 'pessimistic_write' },
            loadEagerRelations: false,
          })
        : null;
      if (dto.reservationId && !reservation) {
        throw new NotFoundException('Reserva no encontrada para esta mesa');
      }
      if (reservation?.status !== ReservationStatus.CONFIRMED && reservation) {
        throw new ConflictException(
          'Solo una reserva confirmada puede iniciar una orden',
        );
      }

      const order = manager.create(OrderEntity, {
        table,
        createdBy,
        items: [],
      });
      const consumption = new Map<string, number>();

      for (const item of dto.items) {
        const product = await menu.findOne({ where: { id: item.menuItemId } });
        if (!product)
          throw new NotFoundException(
            `Producto ${item.menuItemId} no encontrado`,
          );
        if (product.status !== MenuStatus.AVAIBLE)
          throw new ConflictException(
            `Producto ${product.name} no está disponible`,
          );
        const orderItem = manager.create(OrderItemEntity, {
          menuItem: product,
          quantity: item.quantity,
          unitPrice: product.price,
          subtotal: Number(product.price) * item.quantity,
        });
        order.items.push(orderItem);
        const ingredients = await recipes.find({
          where: { menuItem: { id: product.id } },
        });
        for (const ingredient of ingredients) {
          const required = Number(ingredient.quantity) * item.quantity;
          consumption.set(
            ingredient.inventoryItem.id,
            (consumption.get(ingredient.inventoryItem.id) ?? 0) + required,
          );
        }
      }

      for (const [itemId, required] of consumption) {
        const stockItem = await inventory.findOne({
          where: { id: itemId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!stockItem || Number(stockItem.quantity) < required) {
          throw new ConflictException(
            'Stock insuficiente para preparar la orden',
          );
        }
        stockItem.quantity = Number(stockItem.quantity) - required;
        await inventory.save(stockItem);
        await outputs.save(
          outputs.create({
            item: stockItem,
            quantity: required,
            reason: InventoryOutputReason.CONSUMPTION,
            note: 'Salida automática por orden',
          }),
        );
      }

      order.total = order.items.reduce(
        (total, item) => total + Number(item.subtotal),
        0,
      );
      const savedOrder = await manager.save(OrderEntity, order);
      table.status = TableStatus.OCCUPIED;
      await tables.save(table);
      await manager.save(
        KitchenOrderEntity,
        manager.create(KitchenOrderEntity, {
          order: savedOrder,
          status: KitchenStatus.PENDING,
        }),
      );
      if (reservation && reservations) {
        reservation.status = ReservationStatus.COMPLETED;
        await reservations.save(reservation);
      }
      return savedOrder;
    });
    this.realtime.emit('order.created', savedOrder);
    return savedOrder;
  }

  private async restoreInventory(
    manager: EntityManager,
    order: OrderEntity,
    note: string,
  ) {
    const recipes = manager.getRepository(RecipeItemEntity);
    const inventory = manager.getRepository(InventoryItemEntity);
    const entries = manager.getRepository(InventoryEntryEntity);
    const restoration = new Map<string, number>();
    for (const orderItem of order.items) {
      const ingredients = await recipes.find({
        where: { menuItem: { id: orderItem.menuItem.id } },
      });
      for (const ingredient of ingredients) {
        const amount = Number(ingredient.quantity) * orderItem.quantity;
        restoration.set(
          ingredient.inventoryItem.id,
          (restoration.get(ingredient.inventoryItem.id) ?? 0) + amount,
        );
      }
    }
    for (const [itemId, amount] of restoration) {
      const item = await inventory.findOne({
        where: { id: itemId },
        lock: { mode: 'pessimistic_write' },
      });
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
      relations: {
        table: true,
        createdBy: { role: true },
        items: { menuItem: true },
      },
      loadEagerRelations: false,
    });
  }

  private assertEditable(order: OrderEntity, actor: UserEntity) {
    if (
      ![OrderStatus.PENDING, OrderStatus.IN_PROGRESS].includes(order.status)
    ) {
      throw new ConflictException('La orden ya no admite cambios');
    }
    if (actor.role?.name !== 'admin' && order.createdBy?.id !== actor.id) {
      throw new ForbiddenException('No puedes modificar esta orden');
    }
  }

  private async adjustInventory(
    manager: EntityManager,
    menuItemId: string,
    quantityDelta: number,
    note: string,
  ) {
    if (!quantityDelta) return;
    const recipes = manager.getRepository(RecipeItemEntity);
    const inventory = manager.getRepository(InventoryItemEntity);
    const outputs = manager.getRepository(InventoryOutputEntity);
    const entries = manager.getRepository(InventoryEntryEntity);
    const ingredients = await recipes.find({
      where: { menuItem: { id: menuItemId } },
    });
    for (const ingredient of ingredients) {
      const amount = Number(ingredient.quantity) * Math.abs(quantityDelta);
      const item = await inventory.findOne({
        where: { id: ingredient.inventoryItem.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!item) throw new NotFoundException('Insumo de receta no encontrado');
      if (quantityDelta > 0) {
        if (Number(item.quantity) < amount) {
          throw new ConflictException(`Stock insuficiente de ${item.name}`);
        }
        item.quantity = Number(item.quantity) - amount;
        await inventory.save(item);
        await outputs.save(
          outputs.create({
            item,
            quantity: amount,
            reason: InventoryOutputReason.CONSUMPTION,
            note,
          }),
        );
      } else {
        item.quantity = Number(item.quantity) + amount;
        await inventory.save(item);
        await entries.save(entries.create({ item, quantity: amount, note }));
      }
    }
  }

  private async saveOrderTotal(manager: EntityManager, order: OrderEntity) {
    const items = await manager
      .getRepository(OrderItemEntity)
      .find({ where: { order: { id: order.id } } });
    order.total = items.reduce(
      (total, item) => total + Number(item.subtotal),
      0,
    );
    await manager.getRepository(OrderEntity).save(order);
    return manager
      .getRepository(OrderEntity)
      .findOneOrFail({ where: { id: order.id } });
  }

  async addItem(id: string, dto: AddOrderItemDto, actor: UserEntity) {
    const order = await this.dataSource.transaction(async (manager) => {
      const current = await this.findLockedOrder(manager, id);
      this.assertEditable(current, actor);
      const product = await manager
        .getRepository(MenuItemEntity)
        .findOne({ where: { id: dto.menuItemId } });
      if (!product)
        throw new NotFoundException('Producto de menú no encontrado');
      if (product.status !== MenuStatus.AVAIBLE)
        throw new ConflictException('Producto no disponible');
      await this.adjustInventory(
        manager,
        product.id,
        dto.quantity,
        `Producto agregado a orden ${id}`,
      );
      const items = manager.getRepository(OrderItemEntity);
      const existing = current.items.find(
        (item) => item.menuItem.id === product.id,
      );
      if (existing) {
        existing.quantity += dto.quantity;
        existing.subtotal = Number(existing.unitPrice) * existing.quantity;
        await items.save(existing);
      } else {
        await items.save(
          items.create({
            order: current,
            menuItem: product,
            quantity: dto.quantity,
            unitPrice: product.price,
            subtotal: Number(product.price) * dto.quantity,
          }),
        );
      }
      return this.saveOrderTotal(manager, current);
    });
    this.realtime.emit('order.updated', order);
    return order;
  }

  async updateItem(
    id: string,
    itemId: string,
    dto: UpdateOrderItemDto,
    actor: UserEntity,
  ) {
    const order = await this.dataSource.transaction(async (manager) => {
      const current = await this.findLockedOrder(manager, id);
      this.assertEditable(current, actor);
      const item = current.items.find((candidate) => candidate.id === itemId);
      if (!item)
        throw new NotFoundException('Producto de la orden no encontrado');
      const delta = dto.quantity - item.quantity;
      await this.adjustInventory(
        manager,
        item.menuItem.id,
        delta,
        `Cantidad modificada en orden ${id}`,
      );
      item.quantity = dto.quantity;
      item.subtotal = Number(item.unitPrice) * dto.quantity;
      await manager.getRepository(OrderItemEntity).save(item);
      return this.saveOrderTotal(manager, current);
    });
    this.realtime.emit('order.updated', order);
    return order;
  }

  async removeItem(id: string, itemId: string, actor: UserEntity) {
    const order = await this.dataSource.transaction(async (manager) => {
      const current = await this.findLockedOrder(manager, id);
      this.assertEditable(current, actor);
      const item = current.items.find((candidate) => candidate.id === itemId);
      if (!item)
        throw new NotFoundException('Producto de la orden no encontrado');
      if (current.items.length === 1)
        throw new ConflictException(
          'La orden debe mantener al menos un producto',
        );
      await this.adjustInventory(
        manager,
        item.menuItem.id,
        -item.quantity,
        `Producto eliminado de orden ${id}`,
      );
      await manager.getRepository(OrderItemEntity).delete(item.id);
      return this.saveOrderTotal(manager, current);
    });
    this.realtime.emit('order.updated', order);
    return order;
  }

  async update(id: string, dto: UpdateOrderDto): Promise<OrderEntity> {
    const updatedOrder = await this.dataSource.transaction(async (manager) => {
      const tables = manager.getRepository(TableEntity);
      const orders = manager.getRepository(OrderEntity);
      const order = await this.findLockedOrder(manager, id);
      const transitions: Record<OrderStatus, OrderStatus[]> = {
        [OrderStatus.PENDING]: [OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED],
        [OrderStatus.IN_PROGRESS]: [OrderStatus.READY, OrderStatus.CANCELLED],
        [OrderStatus.READY]: [OrderStatus.CANCELLED],
        [OrderStatus.COMPLETED]: [],
        [OrderStatus.CANCELLED]: [],
      };
      if (
        dto.status !== order.status &&
        !transitions[order.status].includes(dto.status)
      ) {
        throw new ConflictException(
          'Transición de orden no válida; el cobro completa la orden',
        );
      }
      if (
        dto.status === OrderStatus.CANCELLED &&
        order.status !== OrderStatus.CANCELLED
      ) {
        await this.restoreInventory(
          manager,
          order,
          `Reposición por cancelación de orden ${order.id}`,
        );
      }
      order.status = dto.status;
      if ([OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(dto.status)) {
        order.table.status = TableStatus.FREE;
        await tables.save(order.table);
      }
      return orders.save(order);
    });
    this.realtime.emit('order.updated', updatedOrder);
    return updatedOrder;
  }

  async remove(id: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const tables = manager.getRepository(TableEntity);
      const orders = manager.getRepository(OrderEntity);
      const order = await this.findLockedOrder(manager, id);
      if (order.status === OrderStatus.COMPLETED)
        throw new ConflictException('No se puede eliminar una orden cobrada');
      if (order.status !== OrderStatus.CANCELLED) {
        await this.restoreInventory(
          manager,
          order,
          `Reposición por eliminación de orden ${order.id}`,
        );
      }
      order.table.status = TableStatus.FREE;
      await tables.save(order.table);
      await orders.delete(id);
    });
    this.realtime.emit('order.deleted', { id });
  }
}
