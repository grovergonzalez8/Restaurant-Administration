import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { TableStatus } from '../enums/table-status.enum';
import { OrderEntity } from './order.entity';
import { ReservationEntity } from './reservation.entity';

@Entity('Tables')
export class TableEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  number: number;

  @Column({ default: 4 })
  capacity: number;

  @Column({ type: 'enum', enum: TableStatus, default: TableStatus.FREE })
  status: TableStatus;

  @OneToMany(() => OrderEntity, (order) => order.table)
  orders: OrderEntity[];

  @OneToMany(() => ReservationEntity, (reservation) => reservation.table)
  reservations: ReservationEntity[];
}
