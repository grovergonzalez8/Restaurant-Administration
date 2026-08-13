import { BadRequestException, ConflictException } from '@nestjs/common';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { ReservationEntity } from 'src/core/entities/reservation.entity';
import { TableEntity } from 'src/core/entities/table.entity';
import { ReservationStatus } from 'src/core/enums/reservation-status.enum';
import { TableStatus } from 'src/core/enums/table-status.enum';
import { ReservationsService } from './reservations.service';

describe('ReservationsService scheduling', () => {
  const reservations = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
  const tables = { find: jest.fn(), findOne: jest.fn() };
  const manager = {
    getRepository: jest.fn((entity: unknown) => {
      if (entity === ReservationEntity) return reservations;
      if (entity === TableEntity) return tables;
      throw new Error('Unexpected repository');
    }),
  } as unknown as EntityManager;
  const transaction = jest.fn((callback: (manager: EntityManager) => unknown) =>
    callback(manager),
  );
  const dataSource = { transaction } as unknown as DataSource;
  const realtime = { emit: jest.fn() };
  const service = new ReservationsService(
    reservations as unknown as Repository<ReservationEntity>,
    tables as unknown as Repository<TableEntity>,
    dataSource,
    realtime,
  );

  beforeEach(() => jest.clearAllMocks());

  it('keeps unresolved reservations visible after their scheduled time', async () => {
    reservations.find.mockResolvedValue([]);

    await service.findUpcoming();

    expect(reservations.find).toHaveBeenCalledWith({
      where: {
        status: In([ReservationStatus.PENDING, ReservationStatus.CONFIRMED]),
      },
      order: { reservationAt: 'ASC' },
    });
  });

  it('returns only tables without nearby reservations', async () => {
    const available = {
      id: 'table-1',
      number: 1,
      capacity: 4,
      status: TableStatus.FREE,
    };
    const reserved = { ...available, id: 'table-2', number: 2 };
    tables.find.mockResolvedValue([available, reserved]);
    reservations.find.mockResolvedValue([{ table: reserved }]);

    const result = await service.availability({
      reservationAt: new Date(Date.now() + 86_400_000).toISOString(),
      guests: 4,
    });

    expect(result).toEqual([available]);
  });

  it('rejects reservations in the past', async () => {
    await expect(
      service.create({
        tableId: 'table-1',
        customerName: 'Ana',
        phone: '70000000',
        guests: 2,
        reservationAt: new Date(Date.now() - 60_000).toISOString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(transaction).not.toHaveBeenCalled();
  });

  it('rejects overlapping reservations for the same table', async () => {
    tables.findOne.mockResolvedValue({
      id: 'table-1',
      capacity: 4,
      status: TableStatus.FREE,
    });
    reservations.findOne.mockResolvedValue({ id: 'reservation-1' });

    await expect(
      service.create({
        tableId: 'table-1',
        customerName: 'Ana',
        phone: '70000000',
        guests: 2,
        reservationAt: new Date(Date.now() + 86_400_000).toISOString(),
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(reservations.save).not.toHaveBeenCalled();
  });

  it('creates a future reservation when the table is available', async () => {
    const table = {
      id: 'table-1',
      capacity: 4,
      status: TableStatus.FREE,
    };
    const saved = { id: 'reservation-1', table };
    tables.findOne.mockResolvedValue(table);
    reservations.findOne.mockResolvedValue(null);
    reservations.create.mockImplementation((value: unknown) => value);
    reservations.save.mockResolvedValue(saved);

    const result = await service.create({
      tableId: table.id,
      customerName: 'Ana',
      phone: '70000000',
      guests: 2,
      reservationAt: new Date(Date.now() + 86_400_000).toISOString(),
    });

    expect(result).toBe(saved);
    expect(reservations.save).toHaveBeenCalled();
    expect(realtime.emit).toHaveBeenCalledWith('reservation.created', saved);
  });

  it('rejects reopening a completed reservation', async () => {
    reservations.findOne.mockResolvedValue({
      id: 'reservation-1',
      status: ReservationStatus.COMPLETED,
    });

    await expect(
      service.updateStatus('reservation-1', {
        status: ReservationStatus.CONFIRMED,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('notifies realtime clients when a reservation changes', async () => {
    const reservation = {
      id: 'reservation-1',
      status: ReservationStatus.PENDING,
    };
    reservations.findOne.mockResolvedValue(reservation);
    reservations.save.mockImplementation((value: unknown) => value);

    await service.updateStatus('reservation-1', {
      status: ReservationStatus.CONFIRMED,
    });

    expect(realtime.emit).toHaveBeenCalledWith(
      'reservation.updated',
      reservation,
    );
  });

  it('notifies realtime clients when a reservation is removed', async () => {
    reservations.delete.mockResolvedValue({ affected: 1 });

    await service.remove('reservation-1');

    expect(realtime.emit).toHaveBeenCalledWith('reservation.deleted', {
      id: 'reservation-1',
    });
  });
});
