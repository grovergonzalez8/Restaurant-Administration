import 'reflect-metadata';
import { validate } from 'class-validator';
import { CreateOrderDto } from './create-order.dto';
import { OrderStatus } from 'src/core/enums/order-status.enum';

describe('CreateOrderDto', () => {
  const dto = (status: OrderStatus) =>
    Object.assign(new CreateOrderDto(), {
      tableId: '123e4567-e89b-12d3-a456-426614174000',
      items: [
        {
          menuItemId: '123e4567-e89b-12d3-a456-426614174001',
          quantity: 1,
        },
      ],
      status,
    });

  it('accepts the pending status sent by the waiter frontend', async () => {
    const errors = await validate(dto(OrderStatus.PENDING));

    expect(errors.find((error) => error.property === 'status')).toBeUndefined();
  });

  it('rejects creating an order in a later lifecycle state', async () => {
    const errors = await validate(dto(OrderStatus.IN_PROGRESS));

    expect(errors.find((error) => error.property === 'status')).toBeDefined();
  });
});
