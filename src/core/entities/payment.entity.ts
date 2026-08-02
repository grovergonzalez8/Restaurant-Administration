import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { OrderEntity } from './order.entity';
import { UserEntity } from './user.entity';
import { PaymentMethod } from '../enums/payment-method.enum';

@Entity('payments')
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => OrderEntity, { eager: true, onDelete: 'RESTRICT' })
  order: OrderEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  createdBy?: UserEntity;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @CreateDateColumn()
  createdAt: Date;
}
