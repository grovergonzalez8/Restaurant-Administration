import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InventoryEntryEntity } from 'src/core/entities/inventory-entry.entity';
import { InventoryOutputEntity } from 'src/core/entities/inventory-output.entity';
import { PaymentEntity } from 'src/core/entities/payment.entity';
import { PaymentMethod } from 'src/core/enums/payment-method.enum';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  const payments = { find: jest.fn() };
  const entries = { find: jest.fn() };
  const outputs = { find: jest.fn() };
  const service = new ReportsService(
    payments as unknown as Repository<PaymentEntity>,
    entries as unknown as Repository<InventoryEntryEntity>,
    outputs as unknown as Repository<InventoryOutputEntity>,
  );

  beforeEach(() => jest.clearAllMocks());

  it('calculates sales and average ticket from payments', async () => {
    payments.find.mockResolvedValue([
      { method: PaymentMethod.CASH, amount: '20.00' },
      { method: PaymentMethod.QR, amount: '30.00' },
    ]);

    const report = await service.sales({
      from: '2026-08-01',
      to: '2026-08-02',
    });

    expect(report).toEqual({
      payments: 2,
      total: 50,
      averageTicket: 25,
      byMethod: { CASH: 20, CARD: 0, QR: 30 },
    });
  });

  it('uses paid orders to aggregate top products', async () => {
    payments.find.mockResolvedValue([
      {
        order: {
          items: [
            {
              menuItem: { id: 'menu-1', name: 'Silpancho' },
              quantity: 2,
              subtotal: '50.00',
            },
          ],
        },
      },
    ]);

    const report = await service.topProducts({});

    expect(report).toEqual([
      { id: 'menu-1', name: 'Silpancho', quantity: 2, sales: 50 },
    ]);
  });

  it('groups inventory movements without mixing units', async () => {
    const item = { id: 'stock-1', name: 'Carne', unit: 'kg' };
    entries.find.mockResolvedValue([{ item, quantity: '5.00' }]);
    outputs.find.mockResolvedValue([{ item, quantity: '1.50' }]);

    const report = await service.inventory({});

    expect(report).toEqual({
      entries: 5,
      outputs: 1.5,
      movements: { entries: 1, outputs: 1 },
      items: [
        {
          id: 'stock-1',
          name: 'Carne',
          unit: 'kg',
          entries: 5,
          outputs: 1.5,
          net: 3.5,
        },
      ],
    });
  });

  it('rejects an inverted period', async () => {
    await expect(
      service.sales({ from: '2026-08-03', to: '2026-08-01' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(payments.find).not.toHaveBeenCalled();
  });
});
