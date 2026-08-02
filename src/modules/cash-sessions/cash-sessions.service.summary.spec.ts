import { DataSource, Repository } from 'typeorm';
import { CashSessionEntity } from 'src/core/entities/cash-session.entity';
import { PaymentEntity } from 'src/core/entities/payment.entity';
import { UserEntity } from 'src/core/entities/user.entity';
import { CashSessionStatus } from 'src/core/enums/cash-session-status.enum';
import { PaymentMethod } from 'src/core/enums/payment-method.enum';
import { CashSessionsService } from './cash-sessions.service';

describe('CashSessionsService summary', () => {
  const sessions = { findOne: jest.fn() };
  const payments = { find: jest.fn() };
  const service = new CashSessionsService(
    sessions as unknown as Repository<CashSessionEntity>,
    payments as unknown as Repository<PaymentEntity>,
    {} as DataSource,
  );

  beforeEach(() => jest.clearAllMocks());

  it('calculates sales by method and expected cash', async () => {
    sessions.findOne.mockResolvedValue({
      id: 'session-1',
      openedBy: { id: 'user-1' },
      openingBalance: 100,
      status: CashSessionStatus.OPEN,
    });
    payments.find.mockResolvedValue([
      { method: PaymentMethod.CASH, amount: 40 },
      { method: PaymentMethod.CARD, amount: 60 },
      { method: PaymentMethod.QR, amount: 20 },
    ]);

    const summary = await service.summary('session-1', {
      id: 'user-1',
    } as UserEntity);

    expect(summary.totalSales).toBe(120);
    expect(summary.expectedCash).toBe(140);
    expect(summary.byMethod[PaymentMethod.CARD]).toBe(60);
  });
});
