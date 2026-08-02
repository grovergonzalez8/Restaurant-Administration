import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { CashSessionStatus } from '../enums/cash-session-status.enum';
import { PaymentEntity } from './payment.entity';

@Entity('cashSessions')
export class CashSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity, { eager: true })
  openedBy: UserEntity;

  @OneToMany(() => PaymentEntity, (payment) => payment.cashSession)
  payments: PaymentEntity[];

  @Column('decimal', { precision: 10, scale: 2 })
  openingBalance: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  expectedBalance?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  closingBalance?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  difference?: number;

  @Column({
    type: 'enum',
    enum: CashSessionStatus,
    default: CashSessionStatus.OPEN,
  })
  status: CashSessionStatus;

  @CreateDateColumn()
  openedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  closedAt?: Date;
}
