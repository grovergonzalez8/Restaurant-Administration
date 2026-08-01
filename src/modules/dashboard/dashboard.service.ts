import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InventoryItemEntity } from 'src/core/entities/inventory-item.entity';
import { KitchenOrderEntity } from 'src/core/entities/kitchen-order.entity';
import { MenuItemEntity } from 'src/core/entities/menu-item.entity';
import { OrderEntity } from 'src/core/entities/order.entity';
import { TableEntity } from 'src/core/entities/table.entity';
import { KitchenStatus } from 'src/core/enums/kitchen-status.enum';
import { MenuStatus } from 'src/core/enums/menu-status.enum';
import { OrderStatus } from 'src/core/enums/order-status.enum';
import { TableStatus } from 'src/core/enums/table-status.enum';
import { Repository } from 'typeorm';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(TableEntity) private readonly tables: Repository<TableEntity>,
    @InjectRepository(OrderEntity) private readonly orders: Repository<OrderEntity>,
    @InjectRepository(KitchenOrderEntity) private readonly kitchen: Repository<KitchenOrderEntity>,
    @InjectRepository(MenuItemEntity) private readonly menu: Repository<MenuItemEntity>,
    @InjectRepository(InventoryItemEntity) private readonly inventory: Repository<InventoryItemEntity>,
  ) {}

  async summary() {
    const [tables, orders, kitchenOrders, menuItems, inventoryItems] = await Promise.all([
      this.tables.find(),
      this.orders.find(),
      this.kitchen.find(),
      this.menu.find(),
      this.inventory.find(),
    ]);
    const count = <T>(items: T[], condition: (item: T) => boolean) => items.filter(condition).length;

    return {
      tables: {
        total: tables.length,
        free: count(tables, (table) => table.status === TableStatus.FREE),
        occupied: count(tables, (table) => table.status === TableStatus.OCCUPIED),
        reserved: count(tables, (table) => table.status === TableStatus.RESERVED),
      },
      orders: {
        total: orders.length,
        active: count(orders, (order) => [OrderStatus.PENDING, OrderStatus.IN_PROGRESS].includes(order.status)),
        completed: count(orders, (order) => order.status === OrderStatus.COMPLETED),
      },
      kitchen: {
        pending: count(kitchenOrders, (order) => order.status === KitchenStatus.PENDING),
        inProgress: count(kitchenOrders, (order) => order.status === KitchenStatus.IN_PROGRESS),
        ready: count(kitchenOrders, (order) => order.status === KitchenStatus.READY),
      },
      menu: {
        total: menuItems.length,
        available: count(menuItems, (item) => item.status === MenuStatus.AVAIBLE),
        unavailable: count(menuItems, (item) => item.status !== MenuStatus.AVAIBLE),
      },
      lowStock: inventoryItems
        .filter((item) => Number(item.quantity) <= Number(item.minStock))
        .map((item) => ({ id: item.id, name: item.name, quantity: Number(item.quantity), unit: item.unit })),
    };
  }
}
