import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { TableEntity } from './table.entity';
import { ReservationStatus } from '../enums/reservation-status.enum';

@Entity('reservations')
export class ReservationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TableEntity, { eager: true })
  table: TableEntity;

  @Column()
  customerName: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  email?: string;

  @Column('int')
  guests: number;

  @Column({ type: 'timestamp' })
  reservationAt: Date;

  @Column({ type: 'enum', enum: ReservationStatus, default: ReservationStatus.PENDING })
  status: ReservationStatus;

  @Column({ nullable: true })
  note?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
