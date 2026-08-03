import { UserEntity } from 'src/core/entities/user.entity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

describe('OrdersController', () => {
  const orders = { findOne: jest.fn() };
  const controller = new OrdersController(orders as unknown as OrdersService);

  beforeEach(() => jest.clearAllMocks());

  it('passes the authenticated user when reading an order', async () => {
    const user = { id: 'waiter-1' } as UserEntity;
    orders.findOne.mockResolvedValue({ id: 'order-1' });

    await controller.findOne('order-1', { user });

    expect(orders.findOne).toHaveBeenCalledWith('order-1', user);
  });
});
