import { ConflictException } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { CashSessionEntity } from 'src/core/entities/cash-session.entity';
import { OrderEntity } from 'src/core/entities/order.entity';
import { PaymentEntity } from 'src/core/entities/payment.entity';
import { TableEntity } from 'src/core/entities/table.entity';
import { CashSessionStatus } from 'src/core/enums/cash-session-status.enum';
import { OrderStatus } from 'src/core/enums/order-status.enum';
import { PaymentMethod } from 'src/core/enums/payment-method.enum';
import { TableStatus } from 'src/core/enums/table-status.enum';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { PaymentsService } from './payments.service';

describe('PaymentsService cash session flow', () => {
  const sessions = { findOne: jest.fn() };
  const orders = {
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    save: jest.fn(),
  };
  const payments = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
  const tables = { findOne: jest.fn(), save: jest.fn() };
  const manager = {
    getRepository: jest.fn((entity: unknown) => {
      if (entity === CashSessionEntity) return sessions;
      if (entity === OrderEntity) return orders;
      if (entity === PaymentEntity) return payments;
      if (entity === TableEntity) return tables;
      throw new Error('Unexpected repository');
    }),
  } as unknown as EntityManager;
  const dataSource = {
    transaction: jest.fn((callback: (manager: EntityManager) => unknown) =>
      callback(manager),
    ),
  } as unknown as DataSource;
  const realtimeMock = { emit: jest.fn() };
  const realtime = realtimeMock as unknown as RealtimeGateway;
  const service = new PaymentsService(
    {} as Repository<PaymentEntity>,
    dataSource,
    realtime,
  );
  const user = { id: 'user-1' } as never;
  const dto = { orderId: 'order-1', method: PaymentMethod.CASH };

  beforeEach(() => jest.clearAllMocks());

  it('rejects payments without an open cash session', async () => {
    sessions.findOne.mockResolvedValue(null);

    await expect(service.create(dto, user)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('links payment to the open session and closes the order', async () => {
    const session = { id: 'session-1', status: CashSessionStatus.OPEN };
    const table = { id: 'table-1', status: TableStatus.OCCUPIED };
    const order = {
      id: 'order-1',
      status: OrderStatus.IN_PROGRESS,
      total: 42,
      table,
    };
    const payment = {
      id: 'payment-1',
      order,
      cashSession: session,
      amount: 42,
      method: PaymentMethod.CASH,
    };
    sessions.findOne.mockResolvedValue(session);
    orders.findOne.mockResolvedValue(order);
    orders.findOneOrFail.mockResolvedValue(order);
    payments.findOne.mockResolvedValue(null);
    payments.create.mockReturnValue(payment);
    payments.save.mockResolvedValue(payment);
    tables.findOne.mockResolvedValue(table);

    const result = await service.create(dto, user);

    expect(result.cashSession).toBe(session);
    expect(order.status).toBe(OrderStatus.COMPLETED);
    expect(table.status).toBe(TableStatus.FREE);
    expect(realtimeMock.emit).toHaveBeenCalledWith('payment.created', payment);
  });
});
