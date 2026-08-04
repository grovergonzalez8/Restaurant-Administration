import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TableEntity } from 'src/core/entities/table.entity';
import { TableStatus } from 'src/core/enums/table-status.enum';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { TablesService } from './tables.service';

describe('TablesService management', () => {
  const repository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
  const realtime = { emit: jest.fn() };
  const service = new TablesService(
    repository as unknown as Repository<TableEntity>,
    realtime as unknown as RealtimeGateway,
  );

  beforeEach(() => jest.clearAllMocks());

  it('creates a table and broadcasts the change', async () => {
    const table = {
      id: 'table-1',
      number: 8,
      capacity: 4,
      status: TableStatus.FREE,
    } as TableEntity;
    repository.findOne.mockResolvedValue(null);
    repository.create.mockReturnValue(table);
    repository.save.mockResolvedValue(table);

    const result = await service.create({ number: 8, capacity: 4 });

    expect(result).toBe(table);
    expect(realtime.emit).toHaveBeenCalledWith('table.created', table);
  });

  it('prevents modifying an occupied table', async () => {
    repository.findOne.mockResolvedValue({
      id: 'table-1',
      number: 1,
      status: TableStatus.OCCUPIED,
    });

    await expect(
      service.update('table-1', { capacity: 6 }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('prevents deleting a table with operational history', async () => {
    repository.findOne.mockResolvedValue({
      id: 'table-1',
      status: TableStatus.FREE,
      orders: [{ id: 'order-1' }],
      reservations: [],
    });

    await expect(service.remove('table-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('deletes an unused table and broadcasts the change', async () => {
    repository.findOne.mockResolvedValue({
      id: 'table-1',
      status: TableStatus.FREE,
      orders: [],
      reservations: [],
    });
    repository.delete.mockResolvedValue({ affected: 1 });

    await service.remove('table-1');

    expect(repository.delete).toHaveBeenCalledWith('table-1');
    expect(realtime.emit).toHaveBeenCalledWith('table.deleted', {
      id: 'table-1',
    });
  });
});
