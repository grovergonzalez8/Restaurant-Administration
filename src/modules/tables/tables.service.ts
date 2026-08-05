import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTableDto } from 'src/core/dtos/tables/create-table.dto';
import { UpdateTableDto } from 'src/core/dtos/tables/update-table.dto';
import { TableEntity } from 'src/core/entities/table.entity';
import { ReservationEntity } from 'src/core/entities/reservation.entity';
import { TableStatus } from 'src/core/enums/table-status.enum';
import { OrderStatus } from 'src/core/enums/order-status.enum';
import { ReservationStatus } from 'src/core/enums/reservation-status.enum';
import { In, Repository } from 'typeorm';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class TablesService {
  constructor(
    @InjectRepository(TableEntity) private tablesRepo: Repository<TableEntity>,
    @InjectRepository(ReservationEntity)
    private reservationsRepo: Repository<ReservationEntity>,
    private readonly realtime: RealtimeGateway,
  ) {}

  findAll(): Promise<TableEntity[]> {
    return this.tablesRepo.find();
  }

  findAvailable(): Promise<TableEntity[]> {
    return this.tablesRepo.find({ where: { status: TableStatus.FREE } });
  }

  async findOverview() {
    const activeStatuses = [
      OrderStatus.PENDING,
      OrderStatus.IN_PROGRESS,
      OrderStatus.READY,
    ];
    const reservationStatuses = [
      ReservationStatus.PENDING,
      ReservationStatus.CONFIRMED,
    ];
    const tables = await this.tablesRepo
      .createQueryBuilder('table')
      .leftJoinAndSelect(
        'table.orders',
        'order',
        'order.status IN (:...activeStatuses)',
        { activeStatuses },
      )
      .leftJoinAndSelect('order.createdBy', 'createdBy')
      .leftJoinAndSelect(
        'table.reservations',
        'reservation',
        'reservation.status IN (:...reservationStatuses)',
        { reservationStatuses },
      )
      .orderBy('table.number', 'ASC')
      .addOrderBy('order.createdAt', 'DESC')
      .addOrderBy('reservation.reservationAt', 'ASC')
      .getMany();

    return tables.map((table) => {
      const order = table.orders?.[0];
      const reservation = table.reservations?.[0];
      return {
        id: table.id,
        number: table.number,
        capacity: table.capacity,
        status: table.status,
        activeOrder: order
          ? {
              id: order.id,
              status: order.status,
              total: Number(order.total),
              createdAt: order.createdAt,
              waiter: order.createdBy
                ? { id: order.createdBy.id, name: order.createdBy.name }
                : null,
            }
          : null,
        nextReservation: reservation
          ? {
              id: reservation.id,
              customerName: reservation.customerName,
              guests: reservation.guests,
              reservationAt: reservation.reservationAt,
              status: reservation.status,
            }
          : null,
      };
    });
  }

  async findOne(id: string): Promise<TableEntity> {
    const table = await this.tablesRepo.findOne({ where: { id } });
    if (!table) {
      throw new NotFoundException('Mesa no encontrada');
    }
    return table;
  }

  async create(dto: CreateTableDto): Promise<TableEntity> {
    const exists = await this.tablesRepo.findOne({
      where: { number: dto.number },
    });
    if (exists) {
      throw new ConflictException('Ya existe una mesa con este numero');
    }

    const table = await this.tablesRepo.save(this.tablesRepo.create(dto));
    this.realtime.emit('table.created', table);
    return table;
  }

  async update(id: string, dto: UpdateTableDto): Promise<TableEntity> {
    const table = await this.findOne(id);
    if (table.status === TableStatus.OCCUPIED) {
      throw new ConflictException('No se puede modificar una mesa ocupada');
    }
    if (
      dto.status === TableStatus.OUT_OF_SERVICE ||
      dto.capacity !== undefined
    ) {
      const reservation = await this.reservationsRepo.findOne({
        where: {
          table: { id },
          status: In([ReservationStatus.PENDING, ReservationStatus.CONFIRMED]),
        },
        order: { reservationAt: 'ASC' },
      });
      if (reservation && dto.status === TableStatus.OUT_OF_SERVICE) {
        throw new ConflictException(
          'No se puede poner fuera de servicio una mesa con una reserva activa',
        );
      }
      if (
        reservation &&
        (dto.capacity ?? table.capacity) < reservation.guests
      ) {
        throw new ConflictException(
          `La capacidad no puede ser menor a los ${reservation.guests} comensales de la próxima reserva`,
        );
      }
    }
    if (dto.number !== undefined && dto.number !== table.number) {
      const duplicate = await this.tablesRepo.findOne({
        where: { number: dto.number },
      });
      if (duplicate) {
        throw new ConflictException('Ya existe una mesa con este número');
      }
    }
    Object.assign(table, dto);
    const saved = await this.tablesRepo.save(table);
    this.realtime.emit('table.updated', saved);
    return saved;
  }

  async remove(id: string): Promise<void> {
    const table = await this.tablesRepo.findOne({
      where: { id },
      relations: { orders: true, reservations: true },
    });
    if (!table) {
      throw new NotFoundException('Mesa no encontrada para eliminar');
    }
    if (table.status === TableStatus.OCCUPIED) {
      throw new ConflictException('No se puede eliminar una mesa ocupada');
    }
    if (table.orders.length || table.reservations.length) {
      throw new ConflictException(
        'No se puede eliminar una mesa con historial; márcala fuera de servicio',
      );
    }
    await this.tablesRepo.delete(id);
    this.realtime.emit('table.deleted', { id });
  }
}
