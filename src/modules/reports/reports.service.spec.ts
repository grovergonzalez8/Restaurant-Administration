import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InventoryEntryEntity } from 'src/core/entities/inventory-entry.entity';
import { InventoryOutputEntity } from 'src/core/entities/inventory-output.entity';
import { PaymentEntity } from 'src/core/entities/payment.entity';
import { PaymentMethod } from 'src/core/enums/payment-method.enum';
import { InventoryOutputReason } from 'src/core/enums/inventory-output-reason.enum';
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
    const otherItem = { id: 'stock-2', name: 'Sal', unit: 'g' };
    entries.find.mockResolvedValue([
      { item, quantity: '5.10' },
      {
        item: { id: 'stock-duplicate', name: 'Carne', unit: 'kg' },
        quantity: '0.20',
      },
      { item: otherItem, quantity: '500.00' },
    ]);
    outputs.find.mockResolvedValue([
      { item, quantity: '1.20' },
      { item, quantity: '0.10' },
    ]);

    const report = await service.inventory({});

    expect(report).toEqual({
      movements: { entries: 3, outputs: 2 },
      items: [
        {
          name: 'Carne',
          unit: 'kg',
          entries: 5.3,
          outputs: 1.3,
          net: 4,
        },
        {
          name: 'Sal',
          unit: 'g',
          entries: 500,
          outputs: 0,
          net: 500,
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

  it('aggregates only waste outputs by inventory item', async () => {
    const wasteOutputs = [
      {
        item: { id: 'stock-1', name: 'Tomate', unit: 'kg' },
        quantity: '1.20',
      },
      {
        item: { id: 'stock-1', name: 'Tomate', unit: 'kg' },
        quantity: '0.35',
      },
      {
        item: { id: 'stock-2', name: 'Leche', unit: 'l' },
        quantity: '0.50',
      },
    ];
    outputs.find.mockImplementation(
      (options: { where: { reason: InventoryOutputReason } }) => {
        expect(options.where.reason).toBe(InventoryOutputReason.WASTE);
        return Promise.resolve(wasteOutputs);
      },
    );

    const report = await service.waste({
      from: '2026-08-01',
      to: '2026-08-13',
    });

    expect(report).toEqual({
      movements: 3,
      items: [
        {
          id: 'stock-2',
          name: 'Leche',
          unit: 'l',
          quantity: 0.5,
          movements: 1,
        },
        {
          id: 'stock-1',
          name: 'Tomate',
          unit: 'kg',
          quantity: 1.55,
          movements: 2,
        },
      ],
    });
  });
});
