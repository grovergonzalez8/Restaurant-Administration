import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource, EntityManager } from 'typeorm';
import { InventoryItemEntity } from 'src/core/entities/inventory-item.entity';
import { InventoryOutputEntity } from 'src/core/entities/inventory-output.entity';
import { KitchenOrderEntity } from 'src/core/entities/kitchen-order.entity';
import { MenuItemEntity } from 'src/core/entities/menu-item.entity';
import { OrderItemEntity } from 'src/core/entities/order-item.entity';
import { OrderEntity } from 'src/core/entities/order.entity';
import { RecipeItemEntity } from 'src/core/entities/recipe-item.entity';
import { ReservationEntity } from 'src/core/entities/reservation.entity';
import { TableEntity } from 'src/core/entities/table.entity';
import { UserEntity } from 'src/core/entities/user.entity';
import { MenuStatus } from 'src/core/enums/menu-status.enum';
import { ReservationStatus } from 'src/core/enums/reservation-status.enum';
import { TableStatus } from 'src/core/enums/table-status.enum';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/roles.guard';
import { OrdersController } from 'src/modules/orders/orders.controller';
import { OrdersService } from 'src/modules/orders/orders.service';
import { RealtimeGateway } from 'src/modules/realtime/realtime.gateway';
import { ReservationsController } from 'src/modules/reservations/reservations.controller';
import { ReservationsService } from 'src/modules/reservations/reservations.service';

describe('Expired reservation handoff (e2e)', () => {
  let app: INestApplication<App>;
  const table = {
    id: '11111111-1111-4111-8111-111111111111',
    number: 4,
    status: TableStatus.FREE,
  } as TableEntity;
  const reservation = {
    id: '22222222-2222-4222-8222-222222222222',
    customerName: 'Ana Pérez',
    phone: '70000000',
    guests: 2,
    reservationAt: new Date(Date.now() - 60_000),
    status: ReservationStatus.CONFIRMED,
    table,
  } as ReservationEntity;
  const menuItem = {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Silpancho',
    price: 25,
    status: MenuStatus.AVAIBLE,
  } as MenuItemEntity;
  const waiter = {
    id: '44444444-4444-4444-8444-444444444444',
    role: { name: 'waiter' },
  } as UserEntity;

  const reservations = {
    find: jest.fn((options?: { where?: { reservationAt?: unknown } }) =>
      Promise.resolve(options?.where?.reservationAt ? [] : [reservation]),
    ),
    findOne: jest.fn(() => Promise.resolve(reservation)),
    save: jest.fn((value: ReservationEntity) => Promise.resolve(value)),
  };
  const tables = {
    findOne: jest.fn(() => Promise.resolve(table)),
    save: jest.fn((value: TableEntity) => Promise.resolve(value)),
  };
  const menu = {
    findOne: jest.fn(() => Promise.resolve(menuItem)),
  };
  const recipes = { find: jest.fn(() => Promise.resolve([])) };
  const inventory = { findOne: jest.fn(), save: jest.fn() };
  const outputs = { create: jest.fn(), save: jest.fn() };
  const orders = { find: jest.fn(), findOne: jest.fn() };
  const kitchen = { findOne: jest.fn() };
  const manager = {
    getRepository: jest.fn((entity: unknown) => {
      if (entity === TableEntity) return tables;
      if (entity === ReservationEntity) return reservations;
      if (entity === MenuItemEntity) return menu;
      if (entity === RecipeItemEntity) return recipes;
      if (entity === InventoryItemEntity) return inventory;
      if (entity === InventoryOutputEntity) return outputs;
      throw new Error(`Unexpected repository: ${String(entity)}`);
    }),
    create: jest.fn((entity: unknown, value: Record<string, unknown>) => {
      if (entity === OrderEntity) {
        return {
          id: '55555555-5555-4555-8555-555555555555',
          total: 0,
          ...value,
        };
      }
      if (entity === OrderItemEntity) {
        return { id: '66666666-6666-4666-8666-666666666666', ...value };
      }
      return value;
    }),
    save: jest.fn((_entity: unknown, value: unknown) => Promise.resolve(value)),
  } as unknown as EntityManager;
  const dataSource = {
    transaction: jest.fn((callback: (manager: EntityManager) => unknown) =>
      Promise.resolve(callback(manager)),
    ),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ReservationsController, OrdersController],
      providers: [
        ReservationsService,
        OrdersService,
        {
          provide: getRepositoryToken(ReservationEntity),
          useValue: reservations,
        },
        { provide: getRepositoryToken(TableEntity), useValue: tables },
        { provide: getRepositoryToken(OrderEntity), useValue: orders },
        { provide: getRepositoryToken(MenuItemEntity), useValue: menu },
        { provide: getRepositoryToken(KitchenOrderEntity), useValue: kitchen },
        { provide: DataSource, useValue: dataSource },
        { provide: RealtimeGateway, useValue: { emit: jest.fn() } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate(context: ExecutionContext) {
          const http = context.switchToHttp();
          http.getRequest<{ user: UserEntity }>().user = waiter;
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();
  });

  afterAll(async () => app.close());

  it('keeps the reservation visible and completes it when its order starts', async () => {
    const activeReservations = await request(app.getHttpServer())
      .get('/reservations/upcoming')
      .expect(200);

    expect(activeReservations.body).toEqual([
      expect.objectContaining({
        id: reservation.id,
        status: ReservationStatus.CONFIRMED,
      }),
    ]);

    const response = await request(app.getHttpServer())
      .post('/orders')
      .send({
        tableId: table.id,
        reservationId: reservation.id,
        items: [{ menuItemId: menuItem.id, quantity: 2 }],
      })
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: '55555555-5555-4555-8555-555555555555',
        total: 50,
      }),
    );
    expect(reservation.status).toBe(ReservationStatus.COMPLETED);
    expect(table.status).toBe(TableStatus.OCCUPIED);
  });
});
