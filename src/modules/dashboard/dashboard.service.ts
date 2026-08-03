import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InventoryItemEntity } from 'src/core/entities/inventory-item.entity';
import { KitchenOrderEntity } from 'src/core/entities/kitchen-order.entity';
import { MenuItemEntity } from 'src/core/entities/menu-item.entity';
import { OrderEntity } from 'src/core/entities/order.entity';
import { TableEntity } from 'src/core/entities/table.entity';
import { PaymentEntity } from 'src/core/entities/payment.entity';
import { ReservationEntity } from 'src/core/entities/reservation.entity';
import { ReservationStatus } from 'src/core/enums/reservation-status.enum';
import { CashSessionEntity } from 'src/core/entities/cash-session.entity';
import { CashSessionStatus } from 'src/core/enums/cash-session-status.enum';
import { KitchenStatus } from 'src/core/enums/kitchen-status.enum';
import { MenuStatus } from 'src/core/enums/menu-status.enum';
import { OrderStatus } from 'src/core/enums/order-status.enum';
import { TableStatus } from 'src/core/enums/table-status.enum';
import { Repository } from 'typeorm';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(TableEntity)
    private readonly tables: Repository<TableEntity>,
    @InjectRepository(OrderEntity)
    private readonly orders: Repository<OrderEntity>,
    @InjectRepository(KitchenOrderEntity)
    private readonly kitchen: Repository<KitchenOrderEntity>,
    @InjectRepository(MenuItemEntity)
    private readonly menu: Repository<MenuItemEntity>,
    @InjectRepository(InventoryItemEntity)
    private readonly inventory: Repository<InventoryItemEntity>,
    @InjectRepository(PaymentEntity)
    private readonly payments: Repository<PaymentEntity>,
    @InjectRepository(ReservationEntity)
    private readonly reservations: Repository<ReservationEntity>,
    @InjectRepository(CashSessionEntity)
    private readonly cashSessions: Repository<CashSessionEntity>,
  ) {}

  async summary() {
    const [
      tables,
      orders,
      kitchenOrders,
      menuItems,
      inventoryItems,
      payments,
      reservations,
      cashSessions,
    ] = await Promise.all([
      this.tables.find(),
      this.orders.find(),
      this.kitchen.find(),
      this.menu.find(),
      this.inventory.find(),
      this.payments.find(),
      this.reservations.find(),
      this.cashSessions.find(),
    ]);
    const count = <T>(items: T[], condition: (item: T) => boolean) =>
      items.filter(condition).length;

    return {
      tables: {
        total: tables.length,
        free: count(tables, (table) => table.status === TableStatus.FREE),
        occupied: count(
          tables,
          (table) => table.status === TableStatus.OCCUPIED,
        ),
        reserved: count(
          tables,
          (table) => table.status === TableStatus.RESERVED,
        ),
      },
      orders: {
        total: orders.length,
        active: count(orders, (order) =>
          [
            OrderStatus.PENDING,
            OrderStatus.IN_PROGRESS,
            OrderStatus.READY,
          ].includes(order.status),
        ),
        completed: count(
          orders,
          (order) => order.status === OrderStatus.COMPLETED,
        ),
      },
      kitchen: {
        pending: count(
          kitchenOrders,
          (order) => order.status === KitchenStatus.PENDING,
        ),
        inProgress: count(
          kitchenOrders,
          (order) => order.status === KitchenStatus.IN_PROGRESS,
        ),
        ready: count(
          kitchenOrders,
          (order) => order.status === KitchenStatus.READY,
        ),
      },
      menu: {
        total: menuItems.length,
        available: count(
          menuItems,
          (item) => item.status === MenuStatus.AVAIBLE,
        ),
        unavailable: count(
          menuItems,
          (item) => item.status !== MenuStatus.AVAIBLE,
        ),
      },
      sales: {
        payments: payments.length,
        total: payments.reduce(
          (sum, payment) => sum + Number(payment.amount),
          0,
        ),
      },
      reservations: {
        pending: count(
          reservations,
          (reservation) => reservation.status === ReservationStatus.PENDING,
        ),
        confirmed: count(
          reservations,
          (reservation) => reservation.status === ReservationStatus.CONFIRMED,
        ),
      },
      cashSessions: {
        open: count(
          cashSessions,
          (session) => session.status === CashSessionStatus.OPEN,
        ),
      },
      lowStock: inventoryItems
        .filter((item) => Number(item.quantity) <= Number(item.minStock))
        .map((item) => ({
          id: item.id,
          name: item.name,
          quantity: Number(item.quantity),
          unit: item.unit,
        })),
    };
  }
}
