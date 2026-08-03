import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrderEntity } from './order.entity';
import { UserEntity } from './user.entity';
import { PaymentMethod } from '../enums/payment-method.enum';
import { CashSessionEntity } from './cash-session.entity';

@Entity('payments')
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => OrderEntity, { eager: true, onDelete: 'RESTRICT' })
  order: OrderEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  createdBy?: UserEntity;

  @ManyToOne(() => CashSessionEntity, (session) => session.payments, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  cashSession?: CashSessionEntity;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  receivedAmount?: number | null;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  changeAmount?: number | null;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @CreateDateColumn()
  createdAt: Date;
}
