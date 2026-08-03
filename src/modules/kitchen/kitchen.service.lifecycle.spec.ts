import { ConflictException } from '@nestjs/common';
import { KitchenService } from './kitchen.service';
import { KitchenStatus } from 'src/core/enums/kitchen-status.enum';
import { OrderStatus } from 'src/core/enums/order-status.enum';
import { Repository } from 'typeorm';
import { KitchenOrderEntity } from 'src/core/entities/kitchen-order.entity';
import { OrderEntity } from 'src/core/entities/order.entity';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { OrdersService } from '../orders/orders.service';

describe('KitchenService lifecycle', () => {
  const kitchenRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const orderRepository = {};
  const realtime = { emit: jest.fn() };
  const ordersService = { update: jest.fn() };
  const service = new KitchenService(
    kitchenRepository as unknown as Repository<KitchenOrderEntity>,
    orderRepository as Repository<OrderEntity>,
    realtime as unknown as RealtimeGateway,
    ordersService as unknown as OrdersService,
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

  it('marks the related order ready for payment', async () => {
    const kitchenOrder = {
      id: 'kitchen-1',
      status: KitchenStatus.IN_PROGRESS,
      order: { id: 'order-1' },
    };
    kitchenRepository.findOne.mockResolvedValue(kitchenOrder);
    kitchenRepository.save.mockResolvedValue(kitchenOrder);

    await service.updateStatus('kitchen-1', {
      status: KitchenStatus.READY,
    });

    expect(ordersService.update).toHaveBeenCalledWith('order-1', {
      status: OrderStatus.READY,
    });
    expect(kitchenOrder.status).toBe(KitchenStatus.READY);
  });

  it('repairs ready tickets whose order remained in progress', async () => {
    kitchenRepository.find.mockResolvedValue([
      {
        status: KitchenStatus.READY,
        order: { id: 'order-1', status: OrderStatus.IN_PROGRESS },
      },
    ]);

    await service.onModuleInit();

    expect(ordersService.update).toHaveBeenCalledWith('order-1', {
      status: OrderStatus.READY,
    });
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
