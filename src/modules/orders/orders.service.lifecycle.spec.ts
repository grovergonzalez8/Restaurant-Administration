import { ConflictException } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { KitchenOrderEntity } from 'src/core/entities/kitchen-order.entity';
import { MenuItemEntity } from 'src/core/entities/menu-item.entity';
import { OrderEntity } from 'src/core/entities/order.entity';
import { TableEntity } from 'src/core/entities/table.entity';
import { OrderStatus } from 'src/core/enums/order-status.enum';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { OrdersService } from './orders.service';

describe('OrdersService lifecycle', () => {
  const orders = {
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    save: jest.fn(),
  };
  const tables = { save: jest.fn() };
  const manager = {
    getRepository: jest.fn((entity: unknown) => {
      if (entity === OrderEntity) return orders;
      if (entity === TableEntity) return tables;
      throw new Error('Unexpected repository');
    }),
  } as unknown as EntityManager;
  const dataSource = {
    transaction: jest.fn((callback: (manager: EntityManager) => unknown) =>
      callback(manager),
    ),
  } as unknown as DataSource;
  const service = new OrdersService(
    {} as Repository<OrderEntity>,
    {} as Repository<MenuItemEntity>,
    {} as Repository<TableEntity>,
    {} as Repository<KitchenOrderEntity>,
    dataSource,
    { emit: jest.fn() } as unknown as RealtimeGateway,
  );

  beforeEach(() => jest.clearAllMocks());

  it('rejects completing an order without payment', async () => {
    const order = {
      id: 'order-1',
      status: OrderStatus.IN_PROGRESS,
      table: { id: 'table-1' },
      items: [],
    };
    orders.findOne.mockResolvedValue({ id: order.id });
    orders.findOneOrFail.mockResolvedValue(order);

    await expect(
      service.update(order.id, { status: OrderStatus.COMPLETED }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(orders.save).not.toHaveBeenCalled();
  });

  it('allows kitchen to move a pending order into progress', async () => {
    const order = {
      id: 'order-1',
      status: OrderStatus.PENDING,
      table: { id: 'table-1' },
      items: [],
    };
    orders.findOne.mockResolvedValue({ id: order.id });
    orders.findOneOrFail.mockResolvedValue(order);
    orders.save.mockResolvedValue(order);

    const result = await service.update(order.id, {
      status: OrderStatus.IN_PROGRESS,
    });

    expect(result.status).toBe(OrderStatus.IN_PROGRESS);
    expect(orders.save).toHaveBeenCalledWith(order);
  });
});
