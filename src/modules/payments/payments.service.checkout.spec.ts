import { ForbiddenException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CashSessionEntity } from 'src/core/entities/cash-session.entity';
import { KitchenOrderEntity } from 'src/core/entities/kitchen-order.entity';
import { OrderEntity } from 'src/core/entities/order.entity';
import { PaymentEntity } from 'src/core/entities/payment.entity';
import { UserEntity } from 'src/core/entities/user.entity';
import { CashSessionStatus } from 'src/core/enums/cash-session-status.enum';
import { KitchenStatus } from 'src/core/enums/kitchen-status.enum';
import { OrderStatus } from 'src/core/enums/order-status.enum';
import { PaymentCheckoutState } from 'src/core/enums/payment-checkout-state.enum';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { PaymentsService } from './payments.service';

describe('PaymentsService checkout', () => {
  const payments = { findOne: jest.fn() };
  const orders = { findOne: jest.fn() };
  const kitchen = { findOne: jest.fn() };
  const sessions = { findOne: jest.fn() };
  const service = new PaymentsService(
    payments as unknown as Repository<PaymentEntity>,
    orders as unknown as Repository<OrderEntity>,
    kitchen as unknown as Repository<KitchenOrderEntity>,
    sessions as unknown as Repository<CashSessionEntity>,
    {} as DataSource,
    {} as RealtimeGateway,
  );
  const waiter = {
    id: 'waiter-1',
    role: { name: 'waiter' },
  } as UserEntity;
  const order = {
    id: 'order-1',
    status: OrderStatus.READY,
    total: 50,
    table: { number: 3 },
    createdBy: waiter,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    orders.findOne.mockResolvedValue(order);
    kitchen.findOne.mockResolvedValue({ status: KitchenStatus.READY });
    payments.findOne.mockResolvedValue(null);
  });

  it('guides the waiter to open cash before payment', async () => {
    sessions.findOne.mockResolvedValue(null);

    const result = await service.checkout(order.id, waiter);

    expect(result.state).toBe(PaymentCheckoutState.OPEN_CASH_SESSION);
    expect(result.canPay).toBe(false);
    expect(result.methods).toEqual([]);
  });

  it('keeps payment blocked while kitchen is preparing', async () => {
    orders.findOne.mockResolvedValue({
      ...order,
      status: OrderStatus.IN_PROGRESS,
    });
    kitchen.findOne.mockResolvedValue({ status: KitchenStatus.IN_PROGRESS });
    sessions.findOne.mockResolvedValue({ id: 'session-1' });

    const result = await service.checkout(order.id, waiter);

    expect(result.state).toBe(PaymentCheckoutState.WAITING_KITCHEN);
    expect(result.methods).toEqual([]);
  });

  it('returns payment methods only when checkout is ready', async () => {
    sessions.findOne.mockResolvedValue({
      id: 'session-1',
      status: CashSessionStatus.OPEN,
      openingBalance: 100,
    });

    const result = await service.checkout(order.id, waiter);

    expect(result.state).toBe(PaymentCheckoutState.READY_TO_PAY);
    expect(result.canPay).toBe(true);
    expect(result.methods).toEqual(['CASH', 'CARD', 'QR']);
  });

  it('rejects checkout for another waiter order', async () => {
    orders.findOne.mockResolvedValue({
      ...order,
      createdBy: { id: 'waiter-2' },
    });

    await expect(service.checkout(order.id, waiter)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
