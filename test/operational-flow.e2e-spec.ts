import { DataSource, EntityManager, Repository } from 'typeorm';
import { CashSessionEntity } from 'src/core/entities/cash-session.entity';
import { InventoryEntryEntity } from 'src/core/entities/inventory-entry.entity';
import { InventoryItemEntity } from 'src/core/entities/inventory-item.entity';
import { InventoryOutputEntity } from 'src/core/entities/inventory-output.entity';
import { KitchenOrderEntity } from 'src/core/entities/kitchen-order.entity';
import { MenuItemEntity } from 'src/core/entities/menu-item.entity';
import { OrderItemEntity } from 'src/core/entities/order-item.entity';
import { OrderEntity } from 'src/core/entities/order.entity';
import { PaymentEntity } from 'src/core/entities/payment.entity';
import { RecipeItemEntity } from 'src/core/entities/recipe-item.entity';
import { TableEntity } from 'src/core/entities/table.entity';
import { UserEntity } from 'src/core/entities/user.entity';
import { CashSessionStatus } from 'src/core/enums/cash-session-status.enum';
import { KitchenStatus } from 'src/core/enums/kitchen-status.enum';
import { MenuStatus } from 'src/core/enums/menu-status.enum';
import { OrderStatus } from 'src/core/enums/order-status.enum';
import { PaymentCheckoutState } from 'src/core/enums/payment-checkout-state.enum';
import { PaymentMethod } from 'src/core/enums/payment-method.enum';
import { TableStatus } from 'src/core/enums/table-status.enum';
import { CashSessionsService } from 'src/modules/cash-sessions/cash-sessions.service';
import { KitchenService } from 'src/modules/kitchen/kitchen.service';
import { OrdersService } from 'src/modules/orders/orders.service';
import { PaymentsService } from 'src/modules/payments/payments.service';
import { RealtimeGateway } from 'src/modules/realtime/realtime.gateway';

describe('Restaurant operational flow (integration)', () => {
  it('completes order, kitchen, payment, receipt and cash closing', async () => {
    const now = new Date('2026-08-03T12:00:00Z');
    const waiter = {
      id: 'waiter-1',
      role: { name: 'waiter' },
    } as UserEntity;
    const table = {
      id: 'table-1',
      number: 4,
      status: TableStatus.FREE,
    } as TableEntity;
    const product = {
      id: 'menu-1',
      name: 'Silpancho',
      price: 25,
      status: MenuStatus.AVAIBLE,
    } as MenuItemEntity;
    const stock = {
      id: 'stock-1',
      name: 'Carne',
      quantity: 10,
      unit: 'kg',
    } as InventoryItemEntity;
    const recipe = {
      id: 'recipe-1',
      menuItem: product,
      inventoryItem: stock,
      quantity: 2,
    };
    let order: OrderEntity | null = null;
    let kitchenTicket: KitchenOrderEntity | null = null;
    let cashSession: CashSessionEntity | null = null;
    let payment: PaymentEntity | null = null;

    const ordersRepository = {
      find: jest.fn(() => Promise.resolve(order ? [order] : [])),
      findOne: jest.fn(() => Promise.resolve(order)),
      findOneOrFail: jest.fn(() => {
        if (!order) return Promise.reject(new Error('Order missing'));
        return Promise.resolve(order);
      }),
      save: jest.fn((value: OrderEntity) => {
        order = value;
        return Promise.resolve(value);
      }),
    };
    const kitchenRepository = {
      find: jest.fn(() =>
        Promise.resolve(kitchenTicket ? [kitchenTicket] : []),
      ),
      findOne: jest.fn(() => Promise.resolve(kitchenTicket)),
      save: jest.fn((value: KitchenOrderEntity) => {
        kitchenTicket = value;
        return Promise.resolve(value);
      }),
    };
    const sessionsRepository = {
      findOne: jest.fn((options: { where?: { id?: string } }) => {
        if (!cashSession) return Promise.resolve(null);
        const requestedId = options.where?.id;
        return Promise.resolve(
          !requestedId || requestedId === cashSession.id ? cashSession : null,
        );
      }),
      findOneOrFail: jest.fn(() => {
        if (!cashSession)
          return Promise.reject(new Error('Cash session missing'));
        return Promise.resolve(cashSession);
      }),
      create: jest.fn((value: Partial<CashSessionEntity>) => ({
        id: 'session-1',
        status: CashSessionStatus.OPEN,
        openedAt: now,
        ...value,
      })),
      save: jest.fn((value: CashSessionEntity) => {
        cashSession = value;
        return Promise.resolve(value);
      }),
    };
    const paymentsRepository = {
      find: jest.fn(() => Promise.resolve(payment ? [payment] : [])),
      findOne: jest.fn(() => Promise.resolve(payment)),
      create: jest.fn((value: Partial<PaymentEntity>) => ({
        id: 'payment-1',
        createdAt: now,
        ...value,
      })),
      save: jest.fn((value: PaymentEntity) => {
        payment = value;
        return Promise.resolve(value);
      }),
    };
    const tablesRepository = {
      findOne: jest.fn(() => Promise.resolve(table)),
      save: jest.fn((value: TableEntity) => Promise.resolve(value)),
    };
    const usersRepository = {
      findOne: jest.fn(() => Promise.resolve(waiter)),
    };
    const menuRepository = {
      findOne: jest.fn(() => Promise.resolve(product)),
    };
    const recipesRepository = {
      find: jest.fn(() => Promise.resolve([recipe])),
    };
    const inventoryRepository = {
      findOne: jest.fn(() => Promise.resolve(stock)),
      save: jest.fn((value: InventoryItemEntity) => Promise.resolve(value)),
    };
    const outputsRepository = {
      create: jest.fn((value: object) => value),
      save: jest.fn((value: object) => Promise.resolve(value)),
    };
    const entriesRepository = {
      create: jest.fn((value: object) => value),
      save: jest.fn((value: object) => Promise.resolve(value)),
    };
    const manager = {
      getRepository: jest.fn((entity: unknown) => {
        if (entity === OrderEntity) return ordersRepository;
        if (entity === KitchenOrderEntity) return kitchenRepository;
        if (entity === CashSessionEntity) return sessionsRepository;
        if (entity === PaymentEntity) return paymentsRepository;
        if (entity === TableEntity) return tablesRepository;
        if (entity === UserEntity) return usersRepository;
        if (entity === MenuItemEntity) return menuRepository;
        if (entity === RecipeItemEntity) return recipesRepository;
        if (entity === InventoryItemEntity) return inventoryRepository;
        if (entity === InventoryOutputEntity) return outputsRepository;
        if (entity === InventoryEntryEntity) return entriesRepository;
        throw new Error(`Unexpected repository: ${String(entity)}`);
      }),
      create: jest.fn((entity: unknown, value: object) => {
        if (entity === OrderEntity) {
          return {
            id: 'order-1',
            status: OrderStatus.PENDING,
            total: 0,
            createdAt: now,
            updatedAt: now,
            ...value,
          };
        }
        if (entity === OrderItemEntity) {
          return { id: 'order-item-1', ...value };
        }
        if (entity === KitchenOrderEntity) {
          return {
            id: 'kitchen-1',
            status: KitchenStatus.PENDING,
            createdAt: now,
            updatedAt: now,
            ...value,
          };
        }
        return value;
      }),
      save: jest.fn((entity: unknown, value: unknown) => {
        if (entity === OrderEntity) {
          order = value as OrderEntity;
          return Promise.resolve(order);
        }
        if (entity === KitchenOrderEntity) {
          kitchenTicket = value as KitchenOrderEntity;
          return Promise.resolve(kitchenTicket);
        }
        return Promise.resolve(value);
      }),
    } as unknown as EntityManager;
    const dataSource = {
      transaction: jest.fn(
        (callback: (entityManager: EntityManager) => unknown) =>
          Promise.resolve(callback(manager)),
      ),
    } as unknown as DataSource;
    const realtimeMock = { emit: jest.fn() };
    const realtime = realtimeMock as unknown as RealtimeGateway;
    const orders = new OrdersService(
      ordersRepository as unknown as Repository<OrderEntity>,
      menuRepository as unknown as Repository<MenuItemEntity>,
      tablesRepository as unknown as Repository<TableEntity>,
      kitchenRepository as unknown as Repository<KitchenOrderEntity>,
      dataSource,
      realtime,
    );
    const kitchen = new KitchenService(
      kitchenRepository as unknown as Repository<KitchenOrderEntity>,
      ordersRepository as unknown as Repository<OrderEntity>,
      realtime,
      orders,
    );
    const cashSessions = new CashSessionsService(
      sessionsRepository as unknown as Repository<CashSessionEntity>,
      paymentsRepository as unknown as Repository<PaymentEntity>,
      dataSource,
    );
    const payments = new PaymentsService(
      paymentsRepository as unknown as Repository<PaymentEntity>,
      ordersRepository as unknown as Repository<OrderEntity>,
      kitchenRepository as unknown as Repository<KitchenOrderEntity>,
      sessionsRepository as unknown as Repository<CashSessionEntity>,
      dataSource,
      realtime,
    );

    const createdOrder = await orders.create(
      {
        tableId: table.id,
        items: [{ menuItemId: product.id, quantity: 2 }],
      },
      waiter,
    );
    expect(createdOrder.status).toBe(OrderStatus.PENDING);
    expect(createdOrder.total).toBe(50);
    expect(table.status).toBe(TableStatus.OCCUPIED);
    expect(stock.quantity).toBe(6);
    expect(kitchenTicket?.status).toBe(KitchenStatus.PENDING);

    await kitchen.updateStatus('kitchen-1', {
      status: KitchenStatus.IN_PROGRESS,
    });
    await kitchen.updateStatus('kitchen-1', { status: KitchenStatus.READY });
    expect(order?.status).toBe(OrderStatus.READY);

    const openedSession = await cashSessions.open(
      { openingBalance: 100 },
      waiter,
    );
    expect(openedSession.status).toBe(CashSessionStatus.OPEN);

    const checkout = await payments.checkout(createdOrder.id, waiter);
    expect(checkout.state).toBe(PaymentCheckoutState.READY_TO_PAY);

    const savedPayment = await payments.create(
      {
        orderId: createdOrder.id,
        method: PaymentMethod.CASH,
        receivedAmount: 60,
      },
      waiter,
    );
    expect(savedPayment.amount).toBe(50);
    expect(savedPayment.changeAmount).toBe(10);
    expect(order?.status).toBe(OrderStatus.COMPLETED);
    expect(table.status).toBe(TableStatus.FREE);

    const receipt = await payments.findReceipt(createdOrder.id, waiter);
    expect(receipt.receivedAmount).toBe(60);
    expect(receipt.changeAmount).toBe(10);

    const summary = await cashSessions.summary(openedSession.id, waiter);
    expect(summary.totalSales).toBe(50);
    expect(summary.expectedCash).toBe(150);

    const closedSession = await cashSessions.close(
      openedSession.id,
      { closingBalance: 150 },
      waiter,
    );
    expect(closedSession.status).toBe(CashSessionStatus.CLOSED);
    expect(closedSession.difference).toBe(0);
    expect(realtimeMock.emit).toHaveBeenCalledWith(
      'payment.created',
      savedPayment,
    );
  });
});
