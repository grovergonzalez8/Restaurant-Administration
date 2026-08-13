import { Repository } from 'typeorm';
import { CashSessionEntity } from 'src/core/entities/cash-session.entity';
import { InventoryItemEntity } from 'src/core/entities/inventory-item.entity';
import { KitchenOrderEntity } from 'src/core/entities/kitchen-order.entity';
import { MenuItemEntity } from 'src/core/entities/menu-item.entity';
import { OrderEntity } from 'src/core/entities/order.entity';
import { PaymentEntity } from 'src/core/entities/payment.entity';
import { ReservationEntity } from 'src/core/entities/reservation.entity';
import { TableEntity } from 'src/core/entities/table.entity';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  const repository = <T>(items: T[]) =>
    ({ find: jest.fn().mockResolvedValue(items) }) as unknown as Repository<T>;

  it('prioritizes exhausted stock and exposes the replenishment shortage', async () => {
    const service = new DashboardService(
      repository<TableEntity>([]),
      repository<OrderEntity>([]),
      repository<KitchenOrderEntity>([]),
      repository<MenuItemEntity>([]),
      repository<InventoryItemEntity>([
        { id: 'low', name: 'Arroz', quantity: 2, minStock: 5, unit: 'kg' },
        { id: 'ok', name: 'Sal', quantity: 10, minStock: 5, unit: 'kg' },
        { id: 'out', name: 'Tomate', quantity: 0, minStock: 4, unit: 'kg' },
      ] as InventoryItemEntity[]),
      repository<PaymentEntity>([]),
      repository<ReservationEntity>([]),
      repository<CashSessionEntity>([]),
    );

    const summary = await service.summary();

    expect(summary.lowStock).toEqual([
      {
        id: 'out',
        name: 'Tomate',
        quantity: 0,
        minStock: 4,
        shortage: 4,
        unit: 'kg',
        severity: 'out',
      },
      {
        id: 'low',
        name: 'Arroz',
        quantity: 2,
        minStock: 5,
        shortage: 3,
        unit: 'kg',
        severity: 'low',
      },
    ]);
  });
});
