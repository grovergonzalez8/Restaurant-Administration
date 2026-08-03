import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PaymentEntity } from 'src/core/entities/payment.entity';
import { UserEntity } from 'src/core/entities/user.entity';
import { PaymentMethod } from 'src/core/enums/payment-method.enum';
import { OrderEntity } from 'src/core/entities/order.entity';
import { KitchenOrderEntity } from 'src/core/entities/kitchen-order.entity';
import { CashSessionEntity } from 'src/core/entities/cash-session.entity';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { PaymentsService } from './payments.service';

describe('PaymentsService receipt', () => {
  const payments = { findOne: jest.fn() };
  const service = new PaymentsService(
    payments as unknown as Repository<PaymentEntity>,
    {} as Repository<OrderEntity>,
    {} as Repository<KitchenOrderEntity>,
    {} as Repository<CashSessionEntity>,
    {} as DataSource,
    {} as RealtimeGateway,
  );
  const waiter = {
    id: 'user-1',
    role: { name: 'waiter' },
  } as UserEntity;

  beforeEach(() => jest.clearAllMocks());

  it('returns a structured receipt with numeric totals', async () => {
    payments.findOne.mockResolvedValue({
      id: 'payment-1',
      createdAt: new Date('2026-08-02T12:00:00Z'),
      method: PaymentMethod.CARD,
      amount: '25.50',
      createdBy: waiter,
      cashSession: { id: 'session-1' },
      order: {
        id: 'order-1',
        createdAt: new Date('2026-08-02T11:00:00Z'),
        createdBy: waiter,
        table: { number: 4 },
        total: '25.50',
        items: [
          {
            id: 'item-1',
            menuItem: { name: 'Silpancho' },
            quantity: 1,
            unitPrice: '25.50',
            subtotal: '25.50',
          },
        ],
      },
    });

    const receipt = await service.findReceipt('order-1', waiter);

    expect(receipt.amount).toBe(25.5);
    expect(receipt.order.tableNumber).toBe(4);
    expect(receipt.order.items[0]).toEqual(
      expect.objectContaining({ name: 'Silpancho', subtotal: 25.5 }),
    );
  });

  it('rejects a waiter unrelated to the payment and order', async () => {
    payments.findOne.mockResolvedValue({
      id: 'payment-1',
      createdBy: { id: 'user-2' },
      order: { createdBy: { id: 'user-2' } },
    });

    await expect(service.findReceipt('order-1', waiter)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('reports when the order has no payment', async () => {
    payments.findOne.mockResolvedValue(null);

    await expect(service.findReceipt('order-1', waiter)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
