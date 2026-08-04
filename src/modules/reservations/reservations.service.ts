import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateReservationDto } from 'src/core/dtos/reservations/create-reservation.dto';
import { ReservationAvailabilityDto } from 'src/core/dtos/reservations/reservation-availability.dto';
import { UpdateReservationStatusDto } from 'src/core/dtos/reservations/update-reservation-status.dto';
import { ReservationEntity } from 'src/core/entities/reservation.entity';
import { TableEntity } from 'src/core/entities/table.entity';
import { ReservationStatus } from 'src/core/enums/reservation-status.enum';
import { TableStatus } from 'src/core/enums/table-status.enum';
import {
  Between,
  DataSource,
  In,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import { RealtimeGateway } from '../realtime/realtime.gateway';

const RESERVATION_DURATION_MS = 2 * 60 * 60 * 1000;

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(ReservationEntity)
    private readonly reservations: Repository<ReservationEntity>,
    @InjectRepository(TableEntity)
    private readonly tables: Repository<TableEntity>,
    private readonly dataSource: DataSource,
    private readonly realtime: RealtimeGateway,
  ) {}

  findAll() {
    return this.reservations.find({ order: { reservationAt: 'ASC' } });
  }

  findUpcoming() {
    return this.reservations.find({
      where: {
        reservationAt: MoreThanOrEqual(new Date()),
        status: In([ReservationStatus.PENDING, ReservationStatus.CONFIRMED]),
      },
      order: { reservationAt: 'ASC' },
    });
  }

  private window(reservationAt: Date) {
    return {
      from: new Date(reservationAt.getTime() - RESERVATION_DURATION_MS),
      to: new Date(reservationAt.getTime() + RESERVATION_DURATION_MS),
    };
  }

  private assertFuture(reservationAt: Date) {
    if (reservationAt.getTime() <= Date.now()) {
      throw new BadRequestException('La reserva debe programarse a futuro');
    }
  }

  async availability(dto: ReservationAvailabilityDto) {
    const reservationAt = new Date(dto.reservationAt);
    this.assertFuture(reservationAt);
    const { from, to } = this.window(reservationAt);
    const [tables, conflicts] = await Promise.all([
      this.tables.find({
        where: {
          capacity: MoreThanOrEqual(dto.guests),
          status: Not(TableStatus.OUT_OF_SERVICE),
        },
        order: { number: 'ASC' },
      }),
      this.reservations.find({
        where: {
          reservationAt: Between(from, to),
          status: In([ReservationStatus.PENDING, ReservationStatus.CONFIRMED]),
        },
      }),
    ]);
    const reservedTableIds = new Set(
      conflicts.map((reservation) => reservation.table.id),
    );
    return tables.filter((table) => !reservedTableIds.has(table.id));
  }

  async create(dto: CreateReservationDto) {
    const reservationAt = new Date(dto.reservationAt);
    this.assertFuture(reservationAt);
    const reservation = await this.dataSource.transaction(async (manager) => {
      const tables = manager.getRepository(TableEntity);
      const reservations = manager.getRepository(ReservationEntity);
      const table = await tables.findOne({
        where: { id: dto.tableId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!table) throw new NotFoundException('Mesa no encontrada');
      if (table.status === TableStatus.OUT_OF_SERVICE)
        throw new ConflictException('La mesa está fuera de servicio');
      if (table.capacity < dto.guests)
        throw new BadRequestException('La mesa no tiene capacidad suficiente');
      const { from, to } = this.window(reservationAt);
      const conflict = await reservations.findOne({
        where: {
          table: { id: table.id },
          reservationAt: Between(from, to),
          status: In([ReservationStatus.PENDING, ReservationStatus.CONFIRMED]),
        },
      });
      if (conflict)
        throw new ConflictException(
          'La mesa ya tiene una reserva cercana a ese horario',
        );
      return reservations.save(
        reservations.create({ ...dto, table, reservationAt }),
      );
    });
    this.realtime.emit('reservation.created', reservation);
    return reservation;
  }

  async updateStatus(id: string, dto: UpdateReservationStatusDto) {
    const reservation = await this.reservations.findOne({ where: { id } });
    if (!reservation) throw new NotFoundException('Reserva no encontrada');
    const transitions: Record<ReservationStatus, ReservationStatus[]> = {
      [ReservationStatus.PENDING]: [
        ReservationStatus.CONFIRMED,
        ReservationStatus.CANCELLED,
      ],
      [ReservationStatus.CONFIRMED]: [
        ReservationStatus.COMPLETED,
        ReservationStatus.CANCELLED,
      ],
      [ReservationStatus.CANCELLED]: [],
      [ReservationStatus.COMPLETED]: [],
    };
    if (
      dto.status !== reservation.status &&
      !transitions[reservation.status].includes(dto.status)
    ) {
      throw new ConflictException('Transición de reserva no válida');
    }
    reservation.status = dto.status;
    const saved = await this.reservations.save(reservation);
    this.realtime.emit('reservation.updated', saved);
    return saved;
  }

  async remove(id: string) {
    const result = await this.reservations.delete(id);
    if (!result.affected) throw new NotFoundException('Reserva no encontrada');
    this.realtime.emit('reservation.deleted', { id });
  }
}
