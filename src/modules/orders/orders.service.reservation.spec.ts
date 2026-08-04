import { ConflictException } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { InventoryItemEntity } from 'src/core/entities/inventory-item.entity';
import { InventoryOutputEntity } from 'src/core/entities/inventory-output.entity';
import { KitchenOrderEntity } from 'src/core/entities/kitchen-order.entity';
import { MenuItemEntity } from 'src/core/entities/menu-item.entity';
import { OrderEntity } from 'src/core/entities/order.entity';
import { RecipeItemEntity } from 'src/core/entities/recipe-item.entity';
import { ReservationEntity } from 'src/core/entities/reservation.entity';
import { TableEntity } from 'src/core/entities/table.entity';
import { UserEntity } from 'src/core/entities/user.entity';
import { MenuStatus } from 'src/core/enums/menu-status.enum';
import { ReservationStatus } from 'src/core/enums/reservation-status.enum';
import { TableStatus } from 'src/core/enums/table-status.enum';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { OrdersService } from './orders.service';

describe('OrdersService reservation handoff', () => {
  const table = { id: 'table-1', status: TableStatus.FREE } as TableEntity;
  const reservation = {
    id: 'reservation-1',
    status: ReservationStatus.CONFIRMED,
  } as ReservationEntity;
  const tables = { findOne: jest.fn(), save: jest.fn() };
  const reservations = { findOne: jest.fn(), save: jest.fn() };
  const menu = { findOne: jest.fn() };
  const recipes = { find: jest.fn() };
  const inventory = { findOne: jest.fn(), save: jest.fn() };
  const outputs = { create: jest.fn(), save: jest.fn() };
  const manager = {
    getRepository: jest.fn((entity: unknown) => {
      if (entity === TableEntity) return tables;
      if (entity === ReservationEntity) return reservations;
      if (entity === MenuItemEntity) return menu;
      if (entity === RecipeItemEntity) return recipes;
      if (entity === InventoryItemEntity) return inventory;
      if (entity === InventoryOutputEntity) return outputs;
      throw new Error('Unexpected repository');
    }),
    create: jest.fn((_entity: unknown, value: object) => ({ ...value })),
    save: jest.fn((entity: unknown, value: Record<string, unknown>) =>
      Promise.resolve(
        entity === OrderEntity ? { id: 'order-1', ...value } : value,
      ),
    ),
  } as unknown as EntityManager;
  const dataSource = {
    transaction: jest.fn((callback: (manager: EntityManager) => unknown) =>
      callback(manager),
    ),
  } as unknown as DataSource;
  const realtime = { emit: jest.fn() };
  const service = new OrdersService(
    {} as Repository<OrderEntity>,
    {} as Repository<MenuItemEntity>,
    {} as Repository<TableEntity>,
    {} as Repository<KitchenOrderEntity>,
    dataSource,
    realtime as unknown as RealtimeGateway,
  );
  const waiter = { id: 'waiter-1' } as UserEntity;

  beforeEach(() => {
    jest.clearAllMocks();
    table.status = TableStatus.FREE;
    reservation.status = ReservationStatus.CONFIRMED;
    tables.findOne.mockResolvedValue(table);
    reservations.findOne.mockResolvedValue(reservation);
    menu.findOne.mockResolvedValue({
      id: 'menu-1',
      name: 'Hamburguesa',
      price: 25,
      status: MenuStatus.AVAIBLE,
    });
    recipes.find.mockResolvedValue([]);
  });

  it('creates the order and completes its confirmed reservation atomically', async () => {
    const order = await service.create(
      {
        tableId: table.id,
        reservationId: reservation.id,
        items: [{ menuItemId: 'menu-1', quantity: 2 }],
      },
      waiter,
    );

    expect(order.id).toBe('order-1');
    expect(reservations.findOne).toHaveBeenCalledWith({
      where: { id: reservation.id, table: { id: table.id } },
      lock: { mode: 'pessimistic_write' },
      loadEagerRelations: false,
    });
    expect(reservation.status).toBe(ReservationStatus.COMPLETED);
    expect(reservations.save).toHaveBeenCalledWith(reservation);
    expect(table.status).toBe(TableStatus.OCCUPIED);
    expect(realtime.emit).toHaveBeenCalledWith('order.created', order);
  });

  it('rejects a reservation that is no longer confirmed', async () => {
    reservation.status = ReservationStatus.COMPLETED;

    await expect(
      service.create({
        tableId: table.id,
        reservationId: reservation.id,
        items: [{ menuItemId: 'menu-1', quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(menu.findOne).not.toHaveBeenCalled();
  });
});
