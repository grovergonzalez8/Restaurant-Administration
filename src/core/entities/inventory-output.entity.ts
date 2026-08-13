import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { InventoryItemEntity } from './inventory-item.entity';
import { InventoryOutputReason } from '../enums/inventory-output-reason.enum';
import { UserEntity } from './user.entity';

@Entity('inventoryOutputs')
export class InventoryOutputEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => InventoryItemEntity, { eager: true, nullable: false })
  item: InventoryItemEntity;

  @Column('decimal', { precision: 10, scale: 2 })
  quantity: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: InventoryOutputReason.CONSUMPTION,
  })
  reason: InventoryOutputReason;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'performedById' })
  performedBy?: UserEntity;

  @Column({ nullable: true })
  note?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
