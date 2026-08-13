import { Repository } from 'typeorm';
import { KitchenOrderEntity } from 'src/core/entities/kitchen-order.entity';
import { OrderEntity } from 'src/core/entities/order.entity';
import { KitchenStatus } from 'src/core/enums/kitchen-status.enum';
import { OrdersService } from '../orders/orders.service';
import { KitchenService } from './kitchen.service';

describe('KitchenService', () => {
  const repository = { find: jest.fn() };
  const service = new KitchenService(
    repository as unknown as Repository<KitchenOrderEntity>,
    {} as Repository<OrderEntity>,
    { emit: jest.fn() },
    { update: jest.fn() } as unknown as OrdersService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('loads pending and in-progress tickets oldest first', async () => {
    const tickets = [{ id: 'ticket-1', status: KitchenStatus.PENDING }];
    repository.find.mockResolvedValue(tickets);

    await expect(service.findActive()).resolves.toBe(tickets);
    expect(repository.find).toHaveBeenCalledWith({
      where: [
        { status: KitchenStatus.PENDING },
        { status: KitchenStatus.IN_PROGRESS },
      ],
      order: { createdAt: 'ASC' },
    });
  });
});
