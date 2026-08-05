import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TableEntity } from 'src/core/entities/table.entity';
import { ReservationEntity } from 'src/core/entities/reservation.entity';
import { ReservationStatus } from 'src/core/enums/reservation-status.enum';
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
  const reservations = { findOne: jest.fn() };
  const service = new TablesService(
    repository as unknown as Repository<TableEntity>,
    reservations as unknown as Repository<ReservationEntity>,
    realtime as unknown as RealtimeGateway,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    reservations.findOne.mockResolvedValue(null);
  });

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

  it('prevents taking a table with an active reservation out of service', async () => {
    repository.findOne.mockResolvedValue({
      id: 'table-1',
      number: 1,
      capacity: 4,
      status: TableStatus.FREE,
    });
    reservations.findOne.mockResolvedValue({
      id: 'reservation-1',
      guests: 4,
      status: ReservationStatus.CONFIRMED,
    });

    await expect(
      service.update('table-1', { status: TableStatus.OUT_OF_SERVICE }),
    ).rejects.toThrow('reserva activa');
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('preserves the capacity required by the next active reservation', async () => {
    repository.findOne.mockResolvedValue({
      id: 'table-1',
      number: 1,
      capacity: 6,
      status: TableStatus.FREE,
    });
    reservations.findOne.mockResolvedValue({
      id: 'reservation-1',
      guests: 5,
      status: ReservationStatus.PENDING,
    });

    await expect(service.update('table-1', { capacity: 4 })).rejects.toThrow(
      '5 comensales',
    );
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
