import { Repository } from 'typeorm';
import { TableEntity } from 'src/core/entities/table.entity';
import { OrderStatus } from 'src/core/enums/order-status.enum';
import { TableStatus } from 'src/core/enums/table-status.enum';
import { TablesService } from './tables.service';

describe('TablesService operational overview', () => {
  const query = {
    leftJoinAndSelect: jest.fn(),
    orderBy: jest.fn(),
    addOrderBy: jest.fn(),
    getMany: jest.fn(),
  };
  const repository = { createQueryBuilder: jest.fn() };
  const service = new TablesService(
    repository as unknown as Repository<TableEntity>,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    query.leftJoinAndSelect.mockReturnValue(query);
    query.orderBy.mockReturnValue(query);
    query.addOrderBy.mockReturnValue(query);
    repository.createQueryBuilder.mockReturnValue(query);
  });

  it('returns each table with a safe active-order summary', async () => {
    query.getMany.mockResolvedValue([
      {
        id: 'table-1',
        number: 4,
        capacity: 4,
        status: TableStatus.OCCUPIED,
        orders: [
          {
            id: 'order-1',
            status: OrderStatus.READY,
            total: '45.50',
            createdAt: new Date('2026-08-03T18:00:00.000Z'),
            createdBy: { id: 'waiter-1', name: 'Carlos Mesero' },
          },
        ],
      },
      {
        id: 'table-2',
        number: 5,
        capacity: 2,
        status: TableStatus.FREE,
        orders: [],
      },
    ]);

    const result = await service.findOverview();

    expect(result).toEqual([
      {
        id: 'table-1',
        number: 4,
        capacity: 4,
        status: TableStatus.OCCUPIED,
        activeOrder: {
          id: 'order-1',
          status: OrderStatus.READY,
          total: 45.5,
          createdAt: new Date('2026-08-03T18:00:00.000Z'),
          waiter: { id: 'waiter-1', name: 'Carlos Mesero' },
        },
      },
      {
        id: 'table-2',
        number: 5,
        capacity: 2,
        status: TableStatus.FREE,
        activeOrder: null,
      },
    ]);
    expect(query.leftJoinAndSelect).toHaveBeenCalledWith(
      'table.orders',
      'order',
      'order.status IN (:...activeStatuses)',
      {
        activeStatuses: [
          OrderStatus.PENDING,
          OrderStatus.IN_PROGRESS,
          OrderStatus.READY,
        ],
      },
    );
  });
});
