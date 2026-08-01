import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateReservationDto } from 'src/core/dtos/reservations/create-reservation.dto';
import { UpdateReservationStatusDto } from 'src/core/dtos/reservations/update-reservation-status.dto';
import { ReservationEntity } from 'src/core/entities/reservation.entity';
import { TableEntity } from 'src/core/entities/table.entity';
import { ReservationStatus } from 'src/core/enums/reservation-status.enum';
import { In, MoreThanOrEqual, Repository } from 'typeorm';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(ReservationEntity) private readonly reservations: Repository<ReservationEntity>,
    @InjectRepository(TableEntity) private readonly tables: Repository<TableEntity>,
  ) {}

  findAll() {
    return this.reservations.find({ order: { reservationAt: 'ASC' } });
  }

  findUpcoming() {
    return this.reservations.find({
      where: { reservationAt: MoreThanOrEqual(new Date()), status: In([ReservationStatus.PENDING, ReservationStatus.CONFIRMED]) },
      order: { reservationAt: 'ASC' },
    });
  }

  async create(dto: CreateReservationDto) {
    const table = await this.tables.findOne({ where: { id: dto.tableId } });
    if (!table) throw new NotFoundException('Mesa no encontrada');
    if (table.capacity < dto.guests) throw new BadRequestException('La mesa no tiene capacidad suficiente');
    const reservationAt = new Date(dto.reservationAt);
    const conflict = await this.reservations.findOne({
      where: {
        table: { id: table.id },
        reservationAt,
        status: In([ReservationStatus.PENDING, ReservationStatus.CONFIRMED]),
      },
    });
    if (conflict) throw new ConflictException('La mesa ya está reservada en ese horario');
    return this.reservations.save(this.reservations.create({ ...dto, table, reservationAt }));
  }

  async updateStatus(id: string, dto: UpdateReservationStatusDto) {
    const reservation = await this.reservations.findOne({ where: { id } });
    if (!reservation) throw new NotFoundException('Reserva no encontrada');
    reservation.status = dto.status;
    return this.reservations.save(reservation);
  }

  async remove(id: string) {
    const result = await this.reservations.delete(id);
    if (!result.affected) throw new NotFoundException('Reserva no encontrada');
  }
}
