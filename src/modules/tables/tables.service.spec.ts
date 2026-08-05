import { Repository } from 'typeorm';
import { TableEntity } from 'src/core/entities/table.entity';
import { ReservationEntity } from 'src/core/entities/reservation.entity';
import { TableStatus } from 'src/core/enums/table-status.enum';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { TablesService } from './tables.service';

describe('TablesService', () => {
  const repository = { find: jest.fn() };
  const service = new TablesService(
    repository as unknown as Repository<TableEntity>,
    {} as Repository<ReservationEntity>,
    { emit: jest.fn() } as unknown as RealtimeGateway,
  );

  beforeEach(() => jest.clearAllMocks());

  it('only loads tables available for seating', async () => {
    const tables = [
      { id: 'table-1', status: TableStatus.FREE },
    ] as TableEntity[];
    repository.find.mockResolvedValue(tables);

    await expect(service.findAvailable()).resolves.toBe(tables);
    expect(repository.find).toHaveBeenCalledWith({
      where: { status: TableStatus.FREE },
    });
  });
});
