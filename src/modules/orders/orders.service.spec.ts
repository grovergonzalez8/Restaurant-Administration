import { ForbiddenException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { KitchenOrderEntity } from 'src/core/entities/kitchen-order.entity';
import { MenuItemEntity } from 'src/core/entities/menu-item.entity';
import { OrderEntity } from 'src/core/entities/order.entity';
import { TableEntity } from 'src/core/entities/table.entity';
import { UserEntity } from 'src/core/entities/user.entity';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { OrdersService } from './orders.service';

describe('OrdersService access', () => {
  const orders = { find: jest.fn(), findOne: jest.fn() };
  const service = new OrdersService(
    orders as unknown as Repository<OrderEntity>,
    {} as Repository<MenuItemEntity>,
    {} as Repository<TableEntity>,
    {} as Repository<KitchenOrderEntity>,
    {} as DataSource,
    {} as RealtimeGateway,
  );
  const waiter = {
    id: 'waiter-1',
    role: { name: 'waiter' },
  } as UserEntity;

  beforeEach(() => jest.clearAllMocks());

  it('allows a waiter to read their own order', async () => {
    const order = { id: 'order-1', createdBy: { id: waiter.id } };
    orders.findOne.mockResolvedValue(order);

    await expect(service.findOne(order.id, waiter)).resolves.toBe(order);
  });

  it('rejects a waiter reading another waiter order', async () => {
    orders.findOne.mockResolvedValue({
      id: 'order-1',
      createdBy: { id: 'waiter-2' },
    });

    await expect(service.findOne('order-1', waiter)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('keeps global order access for kitchen staff', async () => {
    const order = { id: 'order-1', createdBy: { id: 'waiter-2' } };
    orders.findOne.mockResolvedValue(order);
    const kitchen = {
      id: 'kitchen-1',
      role: { name: 'kitchen' },
    } as UserEntity;

    await expect(service.findOne(order.id, kitchen)).resolves.toBe(order);
  });

  it('lists only the waiter orders newest first', async () => {
    orders.find.mockResolvedValue([]);

    await service.findMine(waiter.id);

    expect(orders.find).toHaveBeenCalledWith({
      where: { createdBy: { id: waiter.id } },
      order: { createdAt: 'DESC' },
    });
  });
});
