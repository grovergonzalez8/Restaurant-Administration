import { ConflictException } from '@nestjs/common';
import { KitchenService } from './kitchen.service';
import { KitchenStatus } from 'src/core/enums/kitchen-status.enum';
import { OrderStatus } from 'src/core/enums/order-status.enum';

describe('KitchenService lifecycle', () => {
  const kitchenRepository = { findOne: jest.fn(), save: jest.fn() };
  const orderRepository = {};
  const realtime = { emit: jest.fn() };
  const ordersService = { update: jest.fn() };
  const service = new KitchenService(
    kitchenRepository as any,
    orderRepository as any,
    realtime as any,
    ordersService as any,
  );

  beforeEach(() => jest.clearAllMocks());

  it('marks the related order in progress', async () => {
    const kitchenOrder = {
      id: 'kitchen-1',
      status: KitchenStatus.PENDING,
      order: { id: 'order-1' },
    };
    kitchenRepository.findOne.mockResolvedValue(kitchenOrder);
    kitchenRepository.save.mockResolvedValue(kitchenOrder);

    await service.updateStatus('kitchen-1', {
      status: KitchenStatus.IN_PROGRESS,
    });

    expect(ordersService.update).toHaveBeenCalledWith('order-1', {
      status: OrderStatus.IN_PROGRESS,
    });
    expect(kitchenOrder.status).toBe(KitchenStatus.IN_PROGRESS);
  });

  it('rejects invalid transitions', async () => {
    kitchenRepository.findOne.mockResolvedValue({
      id: 'kitchen-1',
      status: KitchenStatus.READY,
      order: { id: 'order-1' },
    });

    await expect(
      service.updateStatus('kitchen-1', { status: KitchenStatus.IN_PROGRESS }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
